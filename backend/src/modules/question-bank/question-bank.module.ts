import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '../../database/entities/question.entity';
import { StudentParent } from '../../database/entities/student-parent.entity';
import { Test } from '../../database/entities/test.entity';
import { TestResult } from '../../database/entities/test-result.entity';
import { User } from '../../database/entities/user.entity';
import { QuestionBankController } from './question-bank.controller';
import { QuestionBankService } from './question-bank.service';

@Module({
  imports: [TypeOrmModule.forFeature([Question, StudentParent, Test, TestResult, User])],
  controllers: [QuestionBankController],
  providers: [QuestionBankService],
  exports: [QuestionBankService],
})
export class QuestionBankModule {}
