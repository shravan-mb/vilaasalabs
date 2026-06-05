import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimetableSlot } from '../../database/entities/timetable-slot.entity';
import { User } from '../../database/entities/user.entity';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';

@Module({
  imports: [TypeOrmModule.forFeature([TimetableSlot, User])],
  controllers: [TimetableController],
  providers: [TimetableService],
})
export class TimetableModule {}
