import { IsNotEmpty, Matches } from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

export class ChangeOwnPasswordDto {
  @IsNotEmpty()
  current_password: string;

  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, {
    message: 'Password must be 8+ chars with uppercase, lowercase, number and special character',
  })
  new_password: string;
}
