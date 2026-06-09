import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { TeacherAttendanceStatus } from '../../../database/entities/teacher-attendance.entity';

export class TeacherAttendanceEntryDto {
  @IsUUID()
  teacher_id: string;

  @IsEnum(TeacherAttendanceStatus)
  status: TeacherAttendanceStatus;

  @IsOptional()
  @IsString()
  check_in_time?: string;

  @IsOptional()
  @IsString()
  check_out_time?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class MarkTeacherAttendanceDto {
  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeacherAttendanceEntryDto)
  entries: TeacherAttendanceEntryDto[];
}

export class TeacherAttendanceQueryDto {
  @IsOptional()
  @IsString()
  from_date?: string;

  @IsOptional()
  @IsString()
  to_date?: string;

  @IsOptional()
  @IsUUID()
  teacher_id?: string;
}
