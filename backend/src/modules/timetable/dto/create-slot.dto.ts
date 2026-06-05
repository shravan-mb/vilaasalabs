import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateSlotDto {
  @IsUUID()
  class_id: string;

  @IsString()
  subject_name: string;

  @IsOptional()
  @IsUUID()
  teacher_id?: string;

  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;
}
