import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER)
  @ApiOperation({ summary: 'Create announcement' })
  create(@Req() req: any, @Body() dto: CreateAnnouncementDto) {
    return this.service.create(req.user.institution_id, req.user.sub, req.user.name ?? '', dto);
  }

  @Get()
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'List announcements for this institution' })
  findAll(@Req() req: any, @Query('class_id') classId?: string, @Query('role') role?: string) {
    const userRole = role ?? req.user.role;
    return this.service.findAll(req.user.institution_id, classId, userRole);
  }

  @Delete(':id')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Delete announcement' })
  delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(req.user.institution_id, id);
  }
}
