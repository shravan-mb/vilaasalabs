import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherAttendance } from '../../database/entities/teacher-attendance.entity';
import { User } from '../../database/entities/user.entity';
import { TeacherAttendanceController } from './teacher-attendance.controller';
import { TeacherAttendanceService } from './teacher-attendance.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherAttendance, User])],
  controllers: [TeacherAttendanceController],
  providers: [TeacherAttendanceService],
})
export class TeacherAttendanceModule {}
