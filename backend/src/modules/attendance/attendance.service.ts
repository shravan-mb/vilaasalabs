import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
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
    // Prevent re-marking the same class on the same date
    const alreadyMarked = await this.attendanceRepo.findOne({
      where: { institution_id: institutionId, class_id: dto.class_id, date: dto.date },
    });
    if (alreadyMarked) {
      throw new BadRequestException(
        `Attendance for class ${dto.class_id} on ${dto.date} has already been marked. Use update instead.`,
      );
    }

    const records = dto.entries.map((entry) =>
      this.attendanceRepo.create({
        institution_id: institutionId,
        class_id: dto.class_id,
        date: dto.date,
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
  ): Promise<Attendance[]> {
    return this.attendanceRepo.find({
      where: { institution_id: institutionId, class_id: classId, date },
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
}
