import { IsEmail, IsIn, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(['eduvilaasa', 'vilaasalabs'])
  app: 'eduvilaasa' | 'vilaasalabs';
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  new_password: string;
}
