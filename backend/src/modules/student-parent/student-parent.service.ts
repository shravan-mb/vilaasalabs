import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { StudentParent } from '../../database/entities/student-parent.entity';
import { User } from '../../database/entities/user.entity';
import { LinkParentDto } from './dto/link-parent.dto';

@Injectable()
export class StudentParentService {
  constructor(
    @InjectRepository(StudentParent)
    private readonly spRepo: Repository<StudentParent>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getParentsOfStudent(institutionId: string, studentId: string): Promise<StudentParent[]> {
    await this.assertStudent(institutionId, studentId);
    return this.spRepo.find({
      where: { institution_id: institutionId, student_id: studentId },
      relations: { parent: true },
    });
  }

  async getStudentsOfParent(institutionId: string, parentId: string): Promise<StudentParent[]> {
    return this.spRepo.find({
      where: { institution_id: institutionId, parent_id: parentId },
      relations: { student: true },
    });
  }

  async link(institutionId: string, studentId: string, dto: LinkParentDto): Promise<StudentParent> {
    await this.assertStudent(institutionId, studentId);

    const parent = await this.userRepo.findOne({
      where: { id: dto.parent_id, institution_id: institutionId, role: Role.PARENT },
    });
    if (!parent) throw new NotFoundException('Parent user not found in this institution');

    const existing = await this.spRepo.findOne({
      where: { institution_id: institutionId, student_id: studentId, parent_id: dto.parent_id },
    });
    if (existing) throw new ConflictException('This parent is already linked to this student');

    const link = this.spRepo.create({
      institution_id: institutionId,
      student_id: studentId,
      parent_id: dto.parent_id,
      relationship: dto.relationship ?? 'guardian',
    });
    return this.spRepo.save(link);
  }

  async unlink(institutionId: string, studentId: string, parentId: string): Promise<void> {
    const link = await this.spRepo.findOne({
      where: { institution_id: institutionId, student_id: studentId, parent_id: parentId },
    });
    if (!link) throw new NotFoundException('Link not found');
    await this.spRepo.remove(link);
  }

  private async assertStudent(institutionId: string, studentId: string): Promise<void> {
    const student = await this.userRepo.findOne({
      where: { id: studentId, institution_id: institutionId, role: Role.STUDENT },
    });
    if (!student) throw new NotFoundException('Student not found in this institution');
  }
}
