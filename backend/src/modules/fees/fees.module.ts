import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassFeeStructure } from '../../database/entities/class-fee-structure.entity';
import { Class } from '../../database/entities/class.entity';
import { FeeCategory } from '../../database/entities/fee-category.entity';
import { FeePayment } from '../../database/entities/fee-payment.entity';
import { Institution } from '../../database/entities/institution.entity';
import { StudentFeeDiscount } from '../../database/entities/student-fee-discount.entity';
import { User } from '../../database/entities/user.entity';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';

@Module({
  imports: [TypeOrmModule.forFeature([FeeCategory, ClassFeeStructure, StudentFeeDiscount, FeePayment, User, Institution, Class])],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService],
})
export class FeesModule {}
