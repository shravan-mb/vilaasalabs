import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { PasswordResetToken } from '../../database/entities/password-reset-token.entity';
import { User } from '../../database/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(PasswordResetToken) private readonly resetTokenRepo: Repository<PasswordResetToken>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const id = dto.identifier.trim();
    const user = await this.userRepo.findOne({
      where: [{ email: id }, { phone: id }],
      relations: { institution: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.is_active) throw new UnauthorizedException('Account is inactive');

    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    await this.userRepo.update(user.id, { last_login_at: new Date() });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email ?? '',
      role: user.role,
      institution_id: user.institution_id,
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email ?? '',
        role: user.role,
        institution_id: user.institution_id,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);
      const user = await this.userRepo.findOne({ where: { id: payload.sub, is_active: true } });
      if (!user) throw new UnauthorizedException();

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email ?? '',
        role: user.role,
        institution_id: user.institution_id,
      };
      return { access_token: this.jwtService.sign(newPayload, { expiresIn: '15m' }) };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) return; // don't reveal if email exists

    // Invalidate old tokens
    await this.resetTokenRepo.update({ user_id: user.id, used: false }, { used: true });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await this.resetTokenRepo.save(
      this.resetTokenRepo.create({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt }),
    );

    const baseUrl =
      dto.app === 'vilaasalabs'
        ? this.config.get('VILAASALABS_ADMIN_URL', 'http://localhost:4200')
        : this.config.get('EDUVILAASA_APP_URL', 'http://localhost:4201');

    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;
    await this.mailService.sendPasswordReset(user.email ?? '', user.name, resetUrl);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    this.validatePasswordStrength(dto.new_password);
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const record = await this.resetTokenRepo.findOne({ where: { token_hash: tokenHash, used: false } });
    if (!record || record.expires_at < new Date()) throw new BadRequestException('Invalid or expired reset token');

    const user = await this.userRepo.findOne({ where: { id: record.user_id } });
    if (!user) throw new NotFoundException('User not found');

    user.password_hash = await bcrypt.hash(dto.new_password, 12);
    await this.userRepo.save(user);
    record.used = true;
    await this.resetTokenRepo.save(record);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  validatePasswordStrength(password: string): void {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!regex.test(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters with uppercase, lowercase, number and special character',
      );
    }
  }
}
