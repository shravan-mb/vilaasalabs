import { BadRequestException, Body, Controller, Get, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Repository } from 'typeorm';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../database/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { ChangeOwnPasswordDto } from './dto/change-own-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const avatarStorage = diskStorage({
  destination: './uploads/avatars',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get my profile' })
  getProfile(@CurrentUser() user: User) {
    const { password_hash: _, ...profile } = user;
    return profile;
  }

  @Patch()
  @ApiOperation({ summary: 'Update my name and phone' })
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    if (dto.name) user.name = dto.name;
    if (dto.phone !== undefined) user.phone = dto.phone;
    const saved = await this.userRepo.save(user);
    const { password_hash: _, ...profile } = saved;
    return profile;
  }

  @Patch('password')
  @ApiOperation({ summary: 'Change my own password' })
  async changePassword(@CurrentUser() user: User, @Body() dto: ChangeOwnPasswordDto) {
    const valid = await bcrypt.compare(dto.current_password, user.password_hash);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    user.password_hash = await bcrypt.hash(dto.new_password, 10);
    await this.userRepo.save(user);
    if (user.email) this.mailService.sendPasswordChanged(user.email, user.name);
    return { message: 'Password changed successfully' };
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) cb(new BadRequestException('Only image files allowed'), false);
      else cb(null, true);
    },
  }))
  async uploadAvatar(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    user.profile_photo_url = `${baseUrl}/uploads/avatars/${file.filename}`;
    await this.userRepo.save(user);
    return { profile_photo_url: user.profile_photo_url };
  }
}
