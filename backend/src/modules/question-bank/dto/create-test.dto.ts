import { IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { TestStatus } from '../../../database/entities/test.entity';

export class CreateTestDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsUUID()
  class_id?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  question_ids: string[];

  @IsInt()
  @Min(1)
  total_marks: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration_minutes?: number;

  @IsOptional()
  @IsEnum(TestStatus)
  status?: TestStatus;

  @IsOptional()
  @IsDateString()
  scheduled_at?: string;
}
