import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsUUID()
  target_class_id?: string;

  @IsOptional()
  @IsIn(['all', 'student', 'teacher', 'parent', 'institution_staff'])
  target_role?: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}
