import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

export class CreateUserDto {
  @IsEnum([Role.TEACHER, Role.STUDENT, Role.PARENT, Role.INSTITUTION_STAFF])
  role: Role;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  class_id?: string;

  @IsOptional()
  @IsUUID()
  proctor_id?: string;

  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, {
    message: 'Password must be 8+ chars with uppercase, lowercase, number and special character',
  })
  password: string;
}
