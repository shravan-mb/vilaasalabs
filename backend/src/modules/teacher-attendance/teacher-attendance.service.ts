import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { TeacherAttendance, TeacherAttendanceSource, TeacherAttendanceStatus } from '../../database/entities/teacher-attendance.entity';
import { User } from '../../database/entities/user.entity';
import { MarkTeacherAttendanceDto, TeacherAttendanceQueryDto } from './dto/teacher-attendance.dto';

@Injectable()
export class TeacherAttendanceService {
  constructor(
    @InjectRepository(TeacherAttendance)
    private readonly repo: Repository<TeacherAttendance>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async mark(institutionId: string, markedById: string, dto: MarkTeacherAttendanceDto): Promise<TeacherAttendance[]> {
    // Delete existing records for that date (allow re-marking)
    await this.repo.delete({ institution_id: institutionId, date: dto.date });

    const records = dto.entries.map((e) =>
      this.repo.create({
        institution_id: institutionId,
        teacher_id:     e.teacher_id,
        date:           dto.date,
        status:         e.status,
        check_in_time:  e.check_in_time,
        check_out_time: e.check_out_time,
        remarks:        e.remarks,
        source:         TeacherAttendanceSource.MANUAL,
        marked_by_id:   markedById,
      } as any),
    );
    return this.repo.save(records as any);
  }

  async getByDate(institutionId: string, date: string): Promise<{ teacher: Partial<User>; record: TeacherAttendance | null }[]> {
    const teachers = await this.userRepo.find({
      where: { institution_id: institutionId, role: Role.TEACHER, is_active: true },
      order: { name: 'ASC' },
      select: { id: true, name: true, phone: true, email: true },
    });

    const records = await this.repo.find({
      where: { institution_id: institutionId, date },
    });

    const recMap = new Map(records.map((r) => [r.teacher_id, r]));

    return teachers.map((t) => ({
      teacher: t,
      record:  recMap.get(t.id) ?? null,
    }));
  }

  async getMonthlySummary(institutionId: string, year: number, month: number) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const records = await this.repo.find({
      where: { institution_id: institutionId, date: Between(from, to) },
      relations: { teacher: true },
      order: { date: 'ASC' },
    });

    const map = new Map<string, { name: string; present: number; absent: number; late: number; half_day: number; leave: number; total: number }>();

    for (const r of records) {
      if (!map.has(r.teacher_id)) {
        map.set(r.teacher_id, { name: r.teacher?.name ?? 'Unknown', present: 0, absent: 0, late: 0, half_day: 0, leave: 0, total: 0 });
      }
      const s = map.get(r.teacher_id)!;
      s.total++;
      if (r.status === TeacherAttendanceStatus.PRESENT)  s.present++;
      else if (r.status === TeacherAttendanceStatus.ABSENT) s.absent++;
      else if (r.status === TeacherAttendanceStatus.LATE)   s.late++;
      else if (r.status === TeacherAttendanceStatus.HALF_DAY) s.half_day++;
      else if (r.status === TeacherAttendanceStatus.LEAVE)  s.leave++;
    }

    return Array.from(map.entries()).map(([teacher_id, s]) => ({
      teacher_id,
      teacher_name: s.name,
      present:  s.present,
      absent:   s.absent,
      late:     s.late,
      half_day: s.half_day,
      leave:    s.leave,
      total:    s.total,
      percentage: s.total > 0 ? Math.round(((s.present + s.late + s.half_day * 0.5) / s.total) * 100) : 0,
    })).sort((a, b) => a.teacher_name.localeCompare(b.teacher_name));
  }

  async query(institutionId: string, dto: TeacherAttendanceQueryDto): Promise<TeacherAttendance[]> {
    const where: any = { institution_id: institutionId };
    if (dto.teacher_id) where.teacher_id = dto.teacher_id;
    if (dto.from_date && dto.to_date) where.date = Between(dto.from_date, dto.to_date);
    return this.repo.find({ where, relations: { teacher: true }, order: { date: 'DESC' } });
  }

  async importFromCsv(institutionId: string, markedById: string, csvText: string): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    const errors: string[] = [];
    let imported = 0;
    let skipped  = 0;

    // Expected CSV columns: Phone,Date,CheckIn,CheckOut,Status
    // Status column is optional — if omitted, we derive from CheckIn time
    const header = lines[0].toLowerCase();
    if (!header.includes('phone') || !header.includes('date')) {
      throw new BadRequestException('CSV must have at least "Phone" and "Date" columns');
    }
    const cols = lines[0].split(',').map((c) => c.trim().toLowerCase());
    const idx = {
      phone:     cols.indexOf('phone'),
      date:      cols.indexOf('date'),
      checkin:   cols.indexOf('checkin'),
      checkout:  cols.indexOf('checkout'),
      status:    cols.indexOf('status'),
    };

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      const phone    = parts[idx.phone];
      const date     = parts[idx.date];
      const checkIn  = idx.checkin  >= 0 ? parts[idx.checkin]  : null;
      const checkOut = idx.checkout >= 0 ? parts[idx.checkout] : null;

      if (!phone || !date) { errors.push(`Row ${i + 1}: missing phone or date`); skipped++; continue; }

      const teacher = await this.userRepo.findOne({
        where: { institution_id: institutionId, phone, role: Role.TEACHER },
        select: { id: true },
      });
      if (!teacher) { errors.push(`Row ${i + 1}: no teacher with phone ${phone}`); skipped++; continue; }

      // Derive status from check-in time if not explicit
      let status: TeacherAttendanceStatus;
      if (idx.status >= 0 && parts[idx.status]) {
        const s = parts[idx.status].toLowerCase();
        status = (Object.values(TeacherAttendanceStatus) as string[]).includes(s)
          ? s as TeacherAttendanceStatus
          : TeacherAttendanceStatus.PRESENT;
      } else if (checkIn) {
        const [h, m] = checkIn.split(':').map(Number);
        const minutes = h * 60 + (m || 0);
        status = minutes > 9 * 60 + 15 ? TeacherAttendanceStatus.LATE : TeacherAttendanceStatus.PRESENT;
      } else {
        status = TeacherAttendanceStatus.ABSENT;
      }

      // Upsert
      const existing = await this.repo.findOne({ where: { institution_id: institutionId, teacher_id: teacher.id, date } });
      if (existing) {
        existing.status         = status;
        (existing as any).check_in_time  = checkIn;
        (existing as any).check_out_time = checkOut;
        existing.source         = TeacherAttendanceSource.BIOMETRIC;
        await this.repo.save(existing);
      } else {
        await this.repo.save(this.repo.create({
          institution_id: institutionId,
          teacher_id:     teacher.id,
          date,
          status,
          check_in_time:  checkIn,
          check_out_time: checkOut,
          source:         TeacherAttendanceSource.BIOMETRIC,
          marked_by_id:   markedById,
        } as any));
      }
      imported++;
    }

    return { imported, skipped, errors };
  }
}
