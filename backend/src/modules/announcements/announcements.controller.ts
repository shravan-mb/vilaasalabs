import { Body, Controller, Delete, Get, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { User } from '../../database/entities/user.entity';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Post('upload-image')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER)
  @ApiOperation({ summary: 'Upload an image attachment for an announcement (max 5 MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'announcements');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${suffix}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      file.mimetype.startsWith('image/')
        ? cb(null, true)
        : cb(new Error('Only image files are allowed'), false);
    },
  }))
  uploadImage(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return { url: `${baseUrl}/uploads/announcements/${file.filename}` };
  }

  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER)
  @ApiOperation({ summary: 'Create announcement' })
  create(@CurrentUser() user: User, @Body() dto: CreateAnnouncementDto) {
    return this.service.create(user.institution_id!, user.id, user.name, dto);
  }

  @Get()
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'List announcements for this institution' })
  findAll(@CurrentUser() user: User, @Query('class_id') classId?: string, @Query('role') role?: string) {
    return this.service.findAll(user.institution_id!, classId, role ?? user.role);
  }

  @Delete(':id')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Delete announcement' })
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.delete(user.institution_id!, id);
  }
}
