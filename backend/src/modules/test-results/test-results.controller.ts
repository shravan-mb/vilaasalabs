import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
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
  upsert(@Req() req: any, @Body() dto: UpsertResultsDto) {
    return this.service.upsertResults(req.user.institution_id, dto);
  }

  @Get('test/:testId')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER)
  @ApiOperation({ summary: 'Get all results for a test' })
  getByTest(@Req() req: any, @Param('testId') testId: string) {
    return this.service.getByTest(req.user.institution_id, testId);
  }

  @Get('student/:studentId')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'Get all results for a student (gradebook)' })
  getByStudent(@Req() req: any, @Param('studentId') studentId: string) {
    return this.service.getByStudent(req.user.institution_id, studentId);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student gets their own results' })
  getMyResults(@Req() req: any) {
    return this.service.getByStudent(req.user.institution_id, req.user.sub);
  }

  @Delete(':id')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Delete a result entry' })
  delete(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteResult(req.user.institution_id, id);
  }
}
