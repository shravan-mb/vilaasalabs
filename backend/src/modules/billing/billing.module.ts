import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institution } from '../../database/entities/institution.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { BillingController } from './billing.controller';
import { BillingScheduler } from './billing.scheduler';
import { BillingService } from './billing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, Institution])],
  controllers: [BillingController],
  providers: [BillingService, BillingScheduler],
  exports: [BillingService],
})
export class BillingModule {}
