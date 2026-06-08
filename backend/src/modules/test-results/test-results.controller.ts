import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { User } from '../../database/entities/user.entity';
import { UpsertResultsDto } from './dto/upsert-result.dto';
import { TestResultsService } from './test-results.service';

@ApiTags('Test Results')
@Controller('test-results')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TestResultsController {
  constructor(private readonly service: TestResultsService) {}

  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER)
  @ApiOperation({ summary: 'Upsert test results for a batch of students' })
  upsert(@CurrentUser() user: User, @Body() dto: UpsertResultsDto) {
    return this.service.upsertResults(user.institution_id!, dto);
  }

  @Get('test/:testId')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER)
  @ApiOperation({ summary: 'Get all results for a test' })
  getByTest(@CurrentUser() user: User, @Param('testId') testId: string) {
    return this.service.getByTest(user.institution_id!, testId);
  }

  @Get('student/:studentId')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'Get all results for a student (gradebook)' })
  getByStudent(@CurrentUser() user: User, @Param('studentId') studentId: string) {
    return this.service.getByStudent(user.institution_id!, studentId);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student gets their own results' })
  getMyResults(@CurrentUser() user: User) {
    return this.service.getByStudent(user.institution_id!, user.id);
  }

  @Get('class/:classId')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER)
  @ApiOperation({ summary: 'Per-test score summary for a class (for admin reports)' })
  getClassReport(@CurrentUser() user: User, @Param('classId') classId: string) {
    return this.service.getClassReport(user.institution_id!, classId);
  }

  @Delete(':id')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Delete a result entry' })
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.deleteResult(user.institution_id!, id);
  }
}
