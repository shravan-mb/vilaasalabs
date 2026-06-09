import { Body, Controller, Get, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { User } from '../../database/entities/user.entity';
import { MarkTeacherAttendanceDto, TeacherAttendanceQueryDto } from './dto/teacher-attendance.dto';
import { TeacherAttendanceService } from './teacher-attendance.service';

@ApiTags('Teacher Attendance')
@Controller('institutions/:institutionId/teacher-attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeacherAttendanceController {
  constructor(private readonly service: TeacherAttendanceService) {}

  @Post('mark')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Manually mark teacher attendance for a date (bulk)' })
  mark(
    @Param('institutionId') institutionId: string,
    @CurrentUser() user: User,
    @Body() dto: MarkTeacherAttendanceDto,
  ) {
    return this.service.mark(institutionId, user.id, dto);
  }

  @Get('date/:date')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Get all teachers with their attendance status for a specific date' })
  getByDate(
    @Param('institutionId') institutionId: string,
    @Param('date') date: string,
  ) {
    return this.service.getByDate(institutionId, date);
  }

  @Get('monthly-summary')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Monthly attendance summary per teacher' })
  monthlySummary(
    @Param('institutionId') institutionId: string,
    @Query('year')  year:  string,
    @Query('month') month: string,
  ) {
    return this.service.getMonthlySummary(institutionId, +year, +month);
  }

  @Get()
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Query teacher attendance records with filters' })
  query(
    @Param('institutionId') institutionId: string,
    @Query() dto: TeacherAttendanceQueryDto,
  ) {
    return this.service.query(institutionId, dto);
  }

  @Post('csv-import')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import teacher attendance from biometric CSV export' })
  async importCsv(
    @Param('institutionId') institutionId: string,
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const csvText = file.buffer.toString('utf-8');
    return this.service.importFromCsv(institutionId, user.id, csvText);
  }
}
