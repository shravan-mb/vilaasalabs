import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { FeeFrequency } from '../../../database/entities/fee-category.entity';

export class CreateFeeCategoryDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsString()
  description?: string;

  @IsEnum(FeeFrequency)
  frequency: FeeFrequency;
}

export class UpdateFeeCategoryDto {
  @IsOptional() @IsString() @IsNotEmpty()
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsEnum(FeeFrequency)
  frequency?: FeeFrequency;

  @IsOptional()
  is_active?: boolean;
}

export class UpsertClassFeeStructureDto {
  @IsUUID()
  class_id: string;

  @IsUUID()
  fee_category_id: string;

  @IsOptional() @IsString()
  academic_year_id?: string;

  @IsNumber() @Min(0)
  amount: number;

  @IsOptional() @IsString()
  due_date?: string;
}

export class CreateDiscountDto {
  @IsUUID()
  student_id: string;

  @IsUUID()
  fee_category_id: string;

  @IsOptional() @IsString()
  academic_year_id?: string;

  @IsNumber() @Min(0)
  discount_amount: number;

  @IsOptional() @IsString()
  reason?: string;
}

export class RecordPaymentDto {
  @IsUUID()
  student_id: string;

  @IsUUID()
  fee_category_id: string;

  @IsOptional() @IsString()
  academic_year_id?: string;

  @IsNumber() @Min(1)
  amount_paid: number;

  @IsDateString()
  payment_date: string;

  @IsOptional() @IsString()
  remarks?: string;
}
