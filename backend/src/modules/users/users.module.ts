import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../../database/entities/attendance.entity';
import { Class } from '../../database/entities/class.entity';
import { MeetingRequest } from '../../database/entities/meeting-request.entity';
import { ProctorNote } from '../../database/entities/proctor-note.entity';
import { StudentParent } from '../../database/entities/student-parent.entity';
import { TestResult } from '../../database/entities/test-result.entity';
import { User } from '../../database/entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, StudentParent, ProctorNote, MeetingRequest, Attendance, TestResult, Class])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
