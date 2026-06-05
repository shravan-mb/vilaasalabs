import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from '../../database/entities/class.entity';
import { Subject } from '../../database/entities/subject.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  // ── Classes ──────────────────────────────────────────────────────────────

  async findAllClasses(institutionId: string): Promise<Class[]> {
    return this.classRepo.find({
      where: { institution_id: institutionId },
      relations: { subjects: true },
      order: { name: 'ASC', section: 'ASC' },
    });
  }

  async findOneClass(institutionId: string, classId: string): Promise<Class> {
    const cls = await this.classRepo.findOne({
      where: { id: classId, institution_id: institutionId },
      relations: { subjects: true },
    });
    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  async createClass(institutionId: string, dto: CreateClassDto): Promise<Class> {
    const existing = await this.classRepo.findOne({
      where: { institution_id: institutionId, name: dto.name, section: dto.section ?? undefined },
    });
    if (existing) throw new ConflictException('A class with this name and section already exists');

    const cls = this.classRepo.create({ institution_id: institutionId, ...dto });
    return this.classRepo.save(cls);
  }

  async updateClass(institutionId: string, classId: string, dto: UpdateClassDto): Promise<Class> {
    const cls = await this.findOneClass(institutionId, classId);
    Object.assign(cls, dto);
    return this.classRepo.save(cls);
  }

  async removeClass(institutionId: string, classId: string): Promise<void> {
    const cls = await this.findOneClass(institutionId, classId);
    await this.classRepo.remove(cls);
  }

  // ── Subjects ─────────────────────────────────────────────────────────────

  async findAllSubjects(institutionId: string, classId: string): Promise<Subject[]> {
    await this.findOneClass(institutionId, classId);
    return this.subjectRepo.find({
      where: { institution_id: institutionId, class_id: classId },
      order: { name: 'ASC' },
    });
  }

  async createSubject(institutionId: string, classId: string, dto: CreateSubjectDto): Promise<Subject> {
    await this.findOneClass(institutionId, classId);

    const existing = await this.subjectRepo.findOne({
      where: { institution_id: institutionId, class_id: classId, name: dto.name },
    });
    if (existing) throw new ConflictException('Subject already exists in this class');

    const subject = this.subjectRepo.create({ institution_id: institutionId, class_id: classId, ...dto });
    return this.subjectRepo.save(subject);
  }

  async removeSubject(institutionId: string, classId: string, subjectId: string): Promise<void> {
    const subject = await this.subjectRepo.findOne({
      where: { id: subjectId, class_id: classId, institution_id: institutionId },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    await this.subjectRepo.remove(subject);
  }
}
