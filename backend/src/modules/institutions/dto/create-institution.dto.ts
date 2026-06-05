import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { InstitutionType } from '../../../common/enums/institution-type.enum';

export class CreateInstitutionDto {
  @ApiProperty({ example: 'St. Joseph School' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: InstitutionType })
  @IsEnum(InstitutionType)
  type: InstitutionType;

  @ApiProperty({ example: 'stjoseph', description: 'Subdomain — will become stjoseph.eduvilaasa.com' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Subdomain can only contain lowercase letters, numbers and hyphens' })
  @MinLength(3)
  subdomain: string;

  @ApiProperty({ example: 'admin@stjosephs.edu' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+91 9876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  principal_name?: string;

  @ApiProperty({ description: 'Password for the institution admin account' })
  @IsString()
  @MinLength(8)
  admin_password: string;

  @ApiProperty({ description: 'Name of the institution admin' })
  @IsString()
  @IsNotEmpty()
  admin_name: string;
}
