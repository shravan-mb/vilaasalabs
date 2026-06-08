import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { BillingCycle, SubscriptionPlan } from '../../../common/enums/subscription-plan.enum';

export class UpdateInstitutionDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() principal_name?: string;
  @IsOptional() @IsString() registration_number?: string;
}

export class AdminSubscriptionDto {
  @IsIn(Object.values(SubscriptionPlan)) plan: SubscriptionPlan;
  @IsIn(Object.values(BillingCycle)) billing_cycle: BillingCycle;
  @IsInt() @Min(1) @Max(36) duration_months: number;
  @IsOptional() @IsInt() amount?: number;
}

export class BroadcastDto {
  @IsString() subject: string;
  @IsString() body: string;
  @IsOptional() institution_ids?: string[];
}
