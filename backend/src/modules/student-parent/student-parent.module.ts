import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentParent } from '../../database/entities/student-parent.entity';
import { User } from '../../database/entities/user.entity';
import { StudentParentController } from './student-parent.controller';
import { StudentParentService } from './student-parent.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudentParent, User])],
  controllers: [StudentParentController],
  providers: [StudentParentService],
  exports: [StudentParentService],
})
export class StudentParentModule {}
