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
  @ApiOperation({ summary: 'Get full attendance sheet for a class on a specific date (optionally filtered by subject)' })
  getClassSheet(
    @Param('institutionId') institutionId: string,
    @Param('classId') classId: string,
    @Param('date') date: string,
    @Query('subject') subject?: string,
  ) {
    return this.service.getClassAttendanceOnDate(institutionId, classId, date, subject);
  }

  @Get('class-report')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER)
  @ApiOperation({ summary: 'Class-wide attendance summary per student (optionally filtered by subject)' })
  classReport(
    @Param('institutionId') institutionId: string,
    @Query('class_id') classId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('subject') subject?: string,
  ) {
    return this.service.getClassReport(institutionId, classId, from, to, subject);
  }

  @Get('class/:classId/day-sheet/:date')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Student × subject attendance matrix for a class on a specific date' })
  getDaySheet(
    @Param('institutionId') institutionId: string,
    @Param('classId') classId: string,
    @Param('date') date: string,
  ) {
    return this.service.getDaySheet(institutionId, classId, date);
  }

  @Get('my/timeline')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: "Student's own attendance grouped by date with per-subject breakdown" })
  getMyTimeline(
    @Param('institutionId') institutionId: string,
    @CurrentUser() user: User,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.getStudentAttendanceTimeline(institutionId, user.id, from, to);
  }

  @Get('child/:studentId/timeline')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: "Child's attendance grouped by date with per-subject breakdown" })
  getChildTimeline(
    @Param('institutionId') institutionId: string,
    @Param('studentId') studentId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.getStudentAttendanceTimeline(institutionId, studentId, from, to);
  }

  @Get('child/:studentId')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Get attendance records for a parent\'s child' })
  getChildAttendance(
    @Param('institutionId') institutionId: string,
    @Param('studentId') studentId: string,
    @Query() queryDto: AttendanceQueryDto,
  ) {
    return this.service.query(institutionId, { ...queryDto, student_id: studentId });
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get the logged-in student\'s own attendance records' })
  getMyAttendance(
    @Param('institutionId') institutionId: string,
    @CurrentUser() user: User,
    @Query() queryDto: AttendanceQueryDto,
  ) {
    return this.service.query(institutionId, { ...queryDto, student_id: user.id });
  }

  @Get('student/:studentId/summary')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.STUDENT, Role.PARENT)
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
