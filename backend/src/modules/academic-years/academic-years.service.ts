import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from '../../database/entities/academic-year.entity';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './dto/create-academic-year.dto';

@Injectable()
export class AcademicYearsService {
  constructor(
    @InjectRepository(AcademicYear) private readonly repo: Repository<AcademicYear>,
  ) {}

  async findAll(institutionId: string): Promise<AcademicYear[]> {
    return this.repo.find({ where: { institution_id: institutionId }, order: { start_date: 'DESC' } });
  }

  async create(institutionId: string, dto: CreateAcademicYearDto): Promise<AcademicYear> {
    const year = this.repo.create({ ...dto, institution_id: institutionId });
    return this.repo.save(year);
  }

  async update(institutionId: string, id: string, dto: UpdateAcademicYearDto): Promise<AcademicYear> {
    const year = await this.repo.findOne({ where: { id, institution_id: institutionId } });
    if (!year) throw new NotFoundException('Academic year not found');
    Object.assign(year, dto);
    return this.repo.save(year);
  }

  async activate(institutionId: string, id: string): Promise<AcademicYear> {
    const year = await this.repo.findOne({ where: { id, institution_id: institutionId } });
    if (!year) throw new NotFoundException('Academic year not found');
    await this.repo.update({ institution_id: institutionId }, { is_current: false });
    year.is_current = true;
    return this.repo.save(year);
  }

  async delete(institutionId: string, id: string): Promise<void> {
    const year = await this.repo.findOne({ where: { id, institution_id: institutionId } });
    if (!year) throw new NotFoundException('Academic year not found');
    if (year.is_current) throw new BadRequestException('Cannot delete the current academic year');
    await this.repo.remove(year);
  }
}
