import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BillingCycle, SubscriptionPlan } from '../../../common/enums/subscription-plan.enum';

export class VerifyPaymentDto {
  @IsNotEmpty()
  @IsString()
  razorpay_order_id: string;

  @IsNotEmpty()
  @IsString()
  razorpay_payment_id: string;

  @IsNotEmpty()
  @IsString()
  razorpay_signature: string;

  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsEnum(BillingCycle)
  billing_cycle: BillingCycle;
}
