import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AttendanceStatus } from '../../database/entities/attendance.entity';
import { User } from '../../database/entities/user.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@ApiTags('Attendance')
@Controller('institutions/:institutionId/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('mark')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Mark attendance for a whole class on a date (bulk)' })
  mark(
    @Param('institutionId') institutionId: string,
    @CurrentUser() user: User,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.service.mark(institutionId, user.id, dto);
  }

  @Patch(':attendanceId')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Correct a single attendance record after marking' })
  update(
    @Param('institutionId') institutionId: string,
    @Param('attendanceId') attendanceId: string,
    @Body() body: { status: AttendanceStatus; remarks?: string },
  ) {
    return this.service.updateEntry(institutionId, attendanceId, body.status, body.remarks);
  }

  @Get()
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Query attendance records (filter by student, class, date range)' })
  query(
    @Param('institutionId') institutionId: string,
    @Query() queryDto: AttendanceQueryDto,
  ) {
    return this.service.query(institutionId, queryDto);
  }

  @Get('class/:classId/date/:date')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Get full attendance sheet for a class on a specific date' })
  getClassSheet(
    @Param('institutionId') institutionId: string,
    @Param('classId') classId: string,
    @Param('date') date: string,
  ) {
    return this.service.getClassAttendanceOnDate(institutionId, classId, date);
  }

  @Get('student/:studentId/summary')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.PARENT)
  @ApiOperation({ summary: 'Get attendance summary % for a student in a date range' })
  summary(
    @Param('institutionId') institutionId: string,
    @Param('studentId') studentId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.getStudentSummary(institutionId, studentId, from, to);
  }
}
