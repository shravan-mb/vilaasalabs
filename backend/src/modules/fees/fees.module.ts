import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassFeeStructure } from '../../database/entities/class-fee-structure.entity';
import { FeeCategory } from '../../database/entities/fee-category.entity';
import { FeePayment } from '../../database/entities/fee-payment.entity';
import { StudentFeeDiscount } from '../../database/entities/student-fee-discount.entity';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';

@Module({
  imports: [TypeOrmModule.forFeature([FeeCategory, ClassFeeStructure, StudentFeeDiscount, FeePayment])],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService],
})
export class FeesModule {}
