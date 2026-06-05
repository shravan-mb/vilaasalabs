import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { BillingCycle, SubscriptionPlan } from '../../../common/enums/subscription-plan.enum';

export class ExtendSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsEnum(BillingCycle)
  billing_cycle: BillingCycle;

  @IsInt()
  @Min(1)
  duration_months: number;

  @IsOptional()
  amount?: number;
}
