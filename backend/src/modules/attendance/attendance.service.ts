import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';
import { Attendance, AttendanceStatus } from '../../database/entities/attendance.entity';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
  ) {}

  async mark(institutionId: string, markedById: string, dto: MarkAttendanceDto): Promise<Attendance[]> {
    // Prevent re-marking the same class+subject on the same date
    const where: any = { institution_id: institutionId, class_id: dto.class_id, date: dto.date };
    where.subject_name = dto.subject_name ? dto.subject_name : IsNull();

    const alreadyMarked = await this.attendanceRepo.findOne({ where });
    if (alreadyMarked) {
      const subjectLabel = dto.subject_name ? ` (${dto.subject_name})` : '';
      throw new BadRequestException(
        `Attendance for this class${subjectLabel} on ${dto.date} has already been marked. Use update instead.`,
      );
    }

    const records = dto.entries.map((entry) =>
      this.attendanceRepo.create({
        institution_id: institutionId,
        class_id: dto.class_id,
        date: dto.date,
        subject_name: dto.subject_name ?? null,
        student_id: entry.student_id,
        marked_by: markedById,
        status: entry.status,
        remarks: entry.remarks,
      }),
    );

    return this.attendanceRepo.save(records);
  }

  async updateEntry(
    institutionId: string,
    attendanceId: string,
    status: AttendanceStatus,
    remarks?: string,
  ): Promise<Attendance> {
    const record = await this.attendanceRepo.findOne({
      where: { id: attendanceId, institution_id: institutionId },
    });
    if (!record) throw new BadRequestException('Attendance record not found');
    record.status = status;
    if (remarks !== undefined) record.remarks = remarks;
    return this.attendanceRepo.save(record);
  }

  async query(institutionId: string, query: AttendanceQueryDto): Promise<Attendance[]> {
    const where: any = { institution_id: institutionId };

    if (query.student_id) where.student_id = query.student_id;
    if (query.class_id) where.class_id = query.class_id;
    if (query.subject_name) where.subject_name = query.subject_name;
    if (query.from_date && query.to_date) {
      where.date = Between(query.from_date, query.to_date);
    } else if (query.from_date) {
      where.date = Between(query.from_date, query.from_date);
    }

    return this.attendanceRepo.find({
      where,
      relations: { student: true },
      order: { date: 'DESC' },
    });
  }

  async getClassAttendanceOnDate(
    institutionId: string,
    classId: string,
    date: string,
    subjectName?: string,
  ): Promise<Attendance[]> {
    const where: any = { institution_id: institutionId, class_id: classId, date };
    if (subjectName) where.subject_name = subjectName;
    return this.attendanceRepo.find({
      where,
      relations: { student: true },
      order: { student: { name: 'ASC' } },
    });
  }

  async getStudentSummary(
    institutionId: string,
    studentId: string,
    fromDate: string,
    toDate: string,
  ): Promise<{ total: number; present: number; absent: number; late: number; percentage: number }> {
    const records = await this.attendanceRepo.find({
      where: {
        institution_id: institutionId,
        student_id: studentId,
        date: Between(fromDate, toDate),
      },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const absent = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const late = records.filter((r) => r.status === AttendanceStatus.LATE).length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, absent, late, percentage };
  }

  // ── Day Sheet: student × subject matrix for a single date ───────────────────

  async getDaySheet(institutionId: string, classId: string, date: string) {
    const records = await this.attendanceRepo.find({
      where: { institution_id: institutionId, class_id: classId, date },
      relations: { student: true, teacher: true },
      order: { student: { name: 'ASC' } },
    });

    // Unique subjects for this day (null → 'General')
    const subjectSet = new Set<string>();
    for (const r of records) subjectSet.add(r.subject_name ?? 'General');
    const subjects = [...subjectSet].sort();

    // Teacher name per subject (first teacher found per subject)
    const teacherBySubject: Record<string, string> = {};
    for (const r of records) {
      const key = r.subject_name ?? 'General';
      if (!teacherBySubject[key]) teacherBySubject[key] = r.teacher?.name ?? '—';
    }

    // Per-student rows
    const studentMap = new Map<string, { name: string; cells: Record<string, { status: string; id: string; remarks: string }> }>();
    for (const r of records) {
      const key = r.subject_name ?? 'General';
      if (!studentMap.has(r.student_id)) {
        studentMap.set(r.student_id, { name: r.student?.name ?? 'Unknown', cells: {} });
      }
      studentMap.get(r.student_id)!.cells[key] = { status: r.status, id: r.id, remarks: r.remarks ?? '' };
    }

    const rows = Array.from(studentMap.entries()).map(([student_id, s]) => ({
      student_id,
      student_name: s.name,
      cells: s.cells,
      present_count: Object.values(s.cells).filter(c => c.status === 'present' || c.status === 'late').length,
      absent_count: Object.values(s.cells).filter(c => c.status === 'absent').length,
    }));

    return { date, subjects, teacher_by_subject: teacherBySubject, rows };
  }

  // ── Student timeline: records grouped by date with per-subject breakdown ─────

  async getStudentAttendanceTimeline(institutionId: string, studentId: string, fromDate: string, toDate: string) {
    const records = await this.attendanceRepo.find({
      where: {
        institution_id: institutionId,
        student_id: studentId,
        date: Between(fromDate, toDate),
      },
      order: { date: 'DESC' },
    });

    // Group by date
    const byDate = new Map<string, any[]>();
    for (const r of records) {
      if (!byDate.has(r.date)) byDate.set(r.date, []);
      byDate.get(r.date)!.push({
        id:      r.id,
        subject: r.subject_name ?? 'General',
        status:  r.status,
        remarks: r.remarks ?? '',
      });
    }

    const totalPeriods   = records.length;
    const presentPeriods = records.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE).length;
    const absentPeriods  = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const latePeriods    = records.filter(r => r.status === AttendanceStatus.LATE).length;

    const days = Array.from(byDate.entries())
      .map(([date, periods]) => ({
        date,
        periods: periods.sort((a, b) => a.subject.localeCompare(b.subject)),
        present_count: periods.filter(p => p.status === 'present' || p.status === 'late').length,
        absent_count:  periods.filter(p => p.status === 'absent').length,
        late_count:    periods.filter(p => p.status === 'late').length,
        total_count:   periods.length,
        has_absent:    periods.some(p => p.status === 'absent'),
        all_present:   periods.every(p => p.status === 'present' || p.status === 'late'),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return {
      summary: {
        total_periods:   totalPeriods,
        present_periods: presentPeriods,
        absent_periods:  absentPeriods,
        late_periods:    latePeriods,
        total_days:      byDate.size,
        percentage:      totalPeriods > 0 ? Math.round((presentPeriods / totalPeriods) * 100) : 0,
      },
      days,
    };
  }

  async getClassReport(institutionId: string, classId: string, from?: string, to?: string, subjectName?: string) {
    const where: any = { institution_id: institutionId, class_id: classId };
    if (from && to) where.date = Between(from, to);
    if (subjectName) where.subject_name = subjectName;

    const records = await this.attendanceRepo.find({ where, relations: { student: true } });

    const map = new Map<string, { name: string; present: number; absent: number; late: number; total: number }>();
    for (const r of records) {
      if (!map.has(r.student_id)) {
        map.set(r.student_id, { name: r.student?.name ?? 'Unknown', present: 0, absent: 0, late: 0, total: 0 });
      }
      const s = map.get(r.student_id)!;
      s.total++;
      if (r.status === AttendanceStatus.PRESENT) s.present++;
      else if (r.status === AttendanceStatus.ABSENT) s.absent++;
      else if (r.status === AttendanceStatus.LATE) s.late++;
    }

    return Array.from(map.entries()).map(([student_id, st]) => ({
      student_id,
      student_name: st.name,
      present: st.present,
      absent: st.absent,
      late: st.late,
      total: st.total,
      percentage: st.total > 0 ? Math.round(((st.present + st.late) / st.total) * 100) : 0,
    })).sort((a, b) => a.student_name.localeCompare(b.student_name));
  }
}
