import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from '../../database/entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement) private readonly repo: Repository<Announcement>,
  ) {}

  async create(institutionId: string, userId: string, userName: string, dto: CreateAnnouncementDto): Promise<Announcement> {
    const announcement = this.repo.create({
      institution_id: institutionId,
      title: dto.title,
      body: dto.body,
      target_class_id: dto.target_class_id,
      target_role: dto.target_role ?? 'all',
      created_by: userId,
      created_by_name: userName,
      image_url: dto.image_url ?? null,
    });
    return this.repo.save(announcement);
  }

  async findAll(institutionId: string, classId?: string, role?: string): Promise<Announcement[]> {
    const qb = this.repo.createQueryBuilder('a').where('a.institution_id = :institutionId', { institutionId });
    if (classId) {
      qb.andWhere('(a.target_class_id = :classId OR a.target_class_id IS NULL)', { classId });
    }
    const isAdminOrStaff = role === 'institution_admin' || role === 'institution_staff';
    if (role && !isAdminOrStaff) {
      qb.andWhere('(a.target_role = :role OR a.target_role = :all OR a.target_role IS NULL)', { role, all: 'all' });
    }
    return qb.orderBy('a.created_at', 'DESC').getMany();
  }

  async delete(institutionId: string, id: string): Promise<void> {
    const a = await this.repo.findOne({ where: { id, institution_id: institutionId } });
    if (!a) throw new NotFoundException('Announcement not found');
    await this.repo.remove(a);
  }
}
