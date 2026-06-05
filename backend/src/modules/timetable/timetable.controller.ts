import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSlotDto } from './dto/create-slot.dto';
import { TimetableService } from './timetable.service';

@ApiTags('Timetable')
@Controller('timetable')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TimetableController {
  constructor(private readonly service: TimetableService) {}

  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Create a timetable slot' })
  create(@Req() req: any, @Body() dto: CreateSlotDto) {
    return this.service.create(req.user.institution_id, dto);
  }

  @Get()
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Get all timetable slots for the institution (admin view)' })
  getAll(@Req() req: any) {
    return this.service.getAll(req.user.institution_id);
  }

  @Get('teacher')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get timetable slots for the logged-in teacher' })
  getByTeacher(@Req() req: any) {
    return this.service.getByTeacher(req.user.institution_id, req.user.id);
  }

  @Get('class/:classId')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'Get timetable for a class' })
  getByClass(@Req() req: any, @Param('classId') classId: string) {
    return this.service.getByClass(req.user.institution_id, classId);
  }

  @Delete(':id')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Delete a timetable slot' })
  delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(req.user.institution_id, id);
  }
}
