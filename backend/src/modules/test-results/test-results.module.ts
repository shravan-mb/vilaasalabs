import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestResult } from '../../database/entities/test-result.entity';
import { Test } from '../../database/entities/test.entity';
import { User } from '../../database/entities/user.entity';
import { TestResultsController } from './test-results.controller';
import { TestResultsService } from './test-results.service';

@Module({
  imports: [TypeOrmModule.forFeature([TestResult, Test, User])],
  controllers: [TestResultsController],
  providers: [TestResultsService],
  exports: [TestResultsService],
})
export class TestResultsModule {}
