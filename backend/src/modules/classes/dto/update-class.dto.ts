import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  academic_year?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
