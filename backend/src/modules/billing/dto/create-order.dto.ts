import { IsEnum } from 'class-validator';
import { BillingCycle, SubscriptionPlan } from '../../../common/enums/subscription-plan.enum';

export class CreateOrderDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsEnum(BillingCycle)
  billing_cycle: BillingCycle;
}
