import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: { institution: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.is_active) throw new UnauthorizedException('Account is inactive');

    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    await this.userRepo.update(user.id, { last_login_at: new Date() });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      institution_id: user.institution_id,
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
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
        email: user.email,
        role: user.role,
        institution_id: user.institution_id,
      };
      return { access_token: this.jwtService.sign(newPayload, { expiresIn: '15m' }) };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
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
