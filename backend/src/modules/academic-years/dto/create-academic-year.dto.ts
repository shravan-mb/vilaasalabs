import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAcademicYearDto {
  @IsString()
  @MaxLength(20)
  name: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}

export class UpdateAcademicYearDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}
