import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimetableSlot } from '../../database/entities/timetable-slot.entity';
import { User } from '../../database/entities/user.entity';
import { CreateSlotDto } from './dto/create-slot.dto';

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(TimetableSlot) private readonly slotRepo: Repository<TimetableSlot>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async create(institutionId: string, dto: CreateSlotDto): Promise<TimetableSlot> {
    let teacherName: string | undefined;
    if (dto.teacher_id) {
      const teacher = await this.userRepo.findOne({ where: { id: dto.teacher_id } });
      teacherName = teacher?.name;
    }
    const slot = this.slotRepo.create({ ...dto, institution_id: institutionId, teacher_name: teacherName });
    return this.slotRepo.save(slot);
  }

  async getByClass(institutionId: string, classId: string): Promise<TimetableSlot[]> {
    return this.slotRepo.find({
      where: { institution_id: institutionId, class_id: classId },
      order: { day_of_week: 'ASC', start_time: 'ASC' },
    });
  }

  async getAll(institutionId: string): Promise<TimetableSlot[]> {
    return this.slotRepo.find({
      where: { institution_id: institutionId },
      order: { class_id: 'ASC', day_of_week: 'ASC', start_time: 'ASC' },
    });
  }

  async getByTeacher(institutionId: string, teacherId: string): Promise<TimetableSlot[]> {
    return this.slotRepo.find({
      where: { institution_id: institutionId, teacher_id: teacherId },
      order: { day_of_week: 'ASC', start_time: 'ASC' },
    });
  }

  async delete(institutionId: string, id: string): Promise<void> {
    const slot = await this.slotRepo.findOne({ where: { id, institution_id: institutionId } });
    if (!slot) throw new NotFoundException('Slot not found');
    await this.slotRepo.remove(slot);
  }
}
