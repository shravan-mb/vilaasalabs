import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { ILike, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Attendance, AttendanceStatus } from '../../database/entities/attendance.entity';
import { MeetingRequest, MeetingRequestStatus } from '../../database/entities/meeting-request.entity';
import { ProctorNote } from '../../database/entities/proctor-note.entity';
import { StudentParent } from '../../database/entities/student-parent.entity';
import { TestResult } from '../../database/entities/test-result.entity';
import { User } from '../../database/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const INSTITUTION_ROLES = [Role.TEACHER, Role.STUDENT, Role.PARENT, Role.INSTITUTION_STAFF];

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(StudentParent)
    private readonly spRepo: Repository<StudentParent>,
    @InjectRepository(ProctorNote)
    private readonly noteRepo: Repository<ProctorNote>,
    @InjectRepository(MeetingRequest)
    private readonly meetingRepo: Repository<MeetingRequest>,
    @InjectRepository(TestResult)
    private readonly testResultRepo: Repository<TestResult>,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
  ) {}

  async findAll(
    institutionId: string,
    role?: Role,
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<PaginatedUsers> {
    const where: any = { institution_id: institutionId };
    if (role) where.role = role;
    if (search) where.name = ILike(`%${search}%`);

    const [data, total] = await this.userRepo.findAndCount({
      where,
      relations: role === Role.STUDENT ? { proctor: true } : undefined,
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByClass(institutionId: string, classId: string): Promise<User[]> {
    return this.userRepo.find({
      where: { institution_id: institutionId, role: Role.STUDENT, class_id: classId, is_active: true },
      relations: { proctor: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(institutionId: string, userId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId, institution_id: institutionId },
      relations: { proctor: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(institutionId: string, dto: CreateUserDto): Promise<User> {
    if (!INSTITUTION_ROLES.includes(dto.role)) {
      throw new ForbiddenException('Cannot create users with this role');
    }

    const email = dto.email?.trim() || null;
    if (email) {
      const existing = await this.userRepo.findOne({ where: { email } });
      if (existing) throw new ConflictException('Email already in use');
    }

    const password_hash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      institution_id: institutionId,
      role: dto.role,
      name: dto.name,
      email: email ?? undefined,
      phone: dto.phone,
      class_id: dto.class_id,
      proctor_id: dto.proctor_id ?? null,
      registration_number: dto.registration_number ?? null,
      teaching_subjects: dto.teaching_subjects ?? [],
      password_hash,
    });

    return this.userRepo.save(user);
  }

  async update(institutionId: string, userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(institutionId, userId);
    for (const key of Object.keys(dto) as (keyof UpdateUserDto)[]) {
      if (dto[key] !== undefined) (user as any)[key] = dto[key];
    }
    return this.userRepo.save(user);
  }

  async changePassword(institutionId: string, userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findOne(institutionId, userId);
    const valid = await bcrypt.compare(dto.current_password, user.password_hash);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    user.password_hash = await bcrypt.hash(dto.new_password, 10);
    await this.userRepo.save(user);
  }

  async setPasswordByAdmin(institutionId: string, userId: string, newPassword: string): Promise<void> {
    const user = await this.findOne(institutionId, userId);
    user.password_hash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
  }

  async deactivate(institutionId: string, userId: string): Promise<void> {
    const user = await this.findOne(institutionId, userId);
    user.is_active = false;
    await this.userRepo.save(user);
  }

  async activate(institutionId: string, userId: string): Promise<void> {
    const user = await this.findOne(institutionId, userId);
    user.is_active = true;
    await this.userRepo.save(user);
  }

  async remove(institutionId: string, userId: string): Promise<void> {
    const user = await this.findOne(institutionId, userId);
    await this.userRepo.remove(user);
  }

  async findProctoredStudents(institutionId: string, teacherId: string): Promise<User[]> {
    return this.userRepo.find({
      where: { institution_id: institutionId, role: Role.STUDENT, proctor_id: teacherId },
      order: { name: 'ASC' },
    });
  }

  async findChildrenOfParent(institutionId: string, parentId: string): Promise<User[]> {
    const links = await this.spRepo.find({
      where: { institution_id: institutionId, parent_id: parentId },
      relations: { student: { proctor: true } },
    });
    return links.map((l) => l.student).filter(Boolean);
  }

  async countByRole(institutionId: string): Promise<Record<string, number>> {
    const rows = await this.userRepo
      .createQueryBuilder('u')
      .select('u.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('u.institution_id = :institutionId', { institutionId })
      .groupBy('u.role')
      .getRawMany();

    return rows.reduce((acc, r) => ({ ...acc, [r.role]: Number(r.count) }), {});
  }

  // ── Bulk proctor assignment ────────────────────────────────────────────────

  async bulkAssignProctor(institutionId: string, classId: string, proctorId: string): Promise<{ updated: number }> {
    const proctor = await this.userRepo.findOne({ where: { id: proctorId, institution_id: institutionId, role: Role.TEACHER } });
    if (!proctor) throw new NotFoundException('Proctor teacher not found');

    const result = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ proctor_id: proctorId })
      .where('institution_id = :institutionId AND class_id = :classId AND role = :role', {
        institutionId, classId, role: Role.STUDENT,
      })
      .execute();

    return { updated: result.affected ?? 0 };
  }

  // ── Proctor notes ──────────────────────────────────────────────────────────

  async getProctorNotes(institutionId: string, studentId: string): Promise<ProctorNote[]> {
    return this.noteRepo.find({
      where: { institution_id: institutionId, student_id: studentId },
      order: { created_at: 'DESC' },
    });
  }

  async createProctorNote(institutionId: string, proctorId: string, studentId: string, content: string): Promise<ProctorNote> {
    const student = await this.userRepo.findOne({ where: { id: studentId, institution_id: institutionId } });
    if (!student) throw new NotFoundException('Student not found');
    const note = this.noteRepo.create({ institution_id: institutionId, student_id: studentId, proctor_id: proctorId, content });
    return this.noteRepo.save(note);
  }

  async deleteProctorNote(institutionId: string, noteId: string, requesterId: string): Promise<void> {
    const note = await this.noteRepo.findOne({ where: { id: noteId, institution_id: institutionId } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.proctor_id !== requesterId) throw new ForbiddenException('Not your note');
    await this.noteRepo.remove(note);
  }

  // ── Proctor performance ────────────────────────────────────────────────────

  async getProctorPerformance(institutionId: string, teacherId: string): Promise<any[]> {
    const students = await this.userRepo.find({
      where: { institution_id: institutionId, role: Role.STUDENT, proctor_id: teacherId },
      order: { name: 'ASC' },
    });

    const results = await Promise.all(
      students.map(async (student) => {
        // Attendance percentage (last 90 days)
        const since = new Date();
        since.setDate(since.getDate() - 90);
        const sinceStr = since.toISOString().split('T')[0];

        const attendanceRows = await this.attendanceRepo
          .createQueryBuilder('a')
          .where('a.student_id = :sid AND a.date >= :since', { sid: student.id, since: sinceStr })
          .getMany();

        const total = attendanceRows.length;
        const present = attendanceRows.filter((a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE).length;
        const attendance_pct = total > 0 ? Math.round((present / total) * 100) : null;
        const low_attendance = attendance_pct !== null && attendance_pct < 75;

        // Recent test results
        const testResults = await this.testResultRepo.find({
          where: { student_id: student.id },
          order: { created_at: 'DESC' },
          take: 5,
        });

        return {
          student: { id: student.id, name: student.name, phone: student.phone, email: student.email, class_id: student.class_id },
          attendance_pct,
          low_attendance,
          test_results: testResults,
        };
      }),
    );

    return results;
  }

  // ── Meeting requests ───────────────────────────────────────────────────────

  async createMeetingRequest(institutionId: string, parentId: string, studentId: string, message: string, proposedDate?: string): Promise<MeetingRequest> {
    const student = await this.userRepo.findOne({ where: { id: studentId, institution_id: institutionId }, relations: { proctor: true } });
    if (!student) throw new NotFoundException('Student not found');
    if (!student.proctor_id) throw new BadRequestException('Student has no proctor assigned');

    const req = this.meetingRepo.create({
      institution_id: institutionId,
      parent_id: parentId,
      student_id: studentId,
      proctor_id: student.proctor_id,
      message,
      proposed_date: proposedDate ?? null,
    });
    return this.meetingRepo.save(req);
  }

  async getMeetingRequestsForTeacher(institutionId: string, teacherId: string): Promise<MeetingRequest[]> {
    return this.meetingRepo.find({
      where: { institution_id: institutionId, proctor_id: teacherId },
      relations: { parent: true, student: true },
      order: { created_at: 'DESC' },
    });
  }

  async getMeetingRequestsForParent(institutionId: string, parentId: string): Promise<MeetingRequest[]> {
    return this.meetingRepo.find({
      where: { institution_id: institutionId, parent_id: parentId },
      relations: { student: true },
      order: { created_at: 'DESC' },
    });
  }

  async respondToMeetingRequest(institutionId: string, requestId: string, teacherId: string, status: MeetingRequestStatus, note?: string): Promise<MeetingRequest> {
    const req = await this.meetingRepo.findOne({ where: { id: requestId, institution_id: institutionId, proctor_id: teacherId } });
    if (!req) throw new NotFoundException('Meeting request not found');
    req.status = status;
    req.response_note = note ?? null;
    return this.meetingRepo.save(req);
  }
}
