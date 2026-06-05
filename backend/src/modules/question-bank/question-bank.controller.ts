import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TestStatus } from '../../database/entities/test.entity';
import { User } from '../../database/entities/user.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionBankService } from './question-bank.service';

@ApiTags('Question Bank')
@Controller('institutions/:institutionId')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuestionBankController {
  constructor(private readonly service: QuestionBankService) {}

  // ── Questions ─────────────────────────────────────────────────────────────

  @Get('questions')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'List questions (filter by subject, difficulty, type, tag)' })
  findAllQuestions(
    @Param('institutionId') institutionId: string,
    @Query('subject') subject?: string,
    @Query('difficulty') difficulty?: string,
    @Query('type') type?: string,
    @Query('tags') tags?: string,
  ) {
    return this.service.findAllQuestions(institutionId, { subject, difficulty, type, tags });
  }

  @Get('questions/:questionId')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a single question' })
  findOneQuestion(
    @Param('institutionId') institutionId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.service.findOneQuestion(institutionId, questionId);
  }

  @Post('questions')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a question to the bank' })
  createQuestion(
    @Param('institutionId') institutionId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.service.createQuestion(institutionId, user.id, dto);
  }

  @Patch('questions/:questionId')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a question' })
  updateQuestion(
    @Param('institutionId') institutionId: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.service.updateQuestion(institutionId, questionId, dto);
  }

  @Delete('questions/:questionId')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a question permanently' })
  removeQuestion(
    @Param('institutionId') institutionId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.service.removeQuestion(institutionId, questionId);
  }

  // ── Tests ─────────────────────────────────────────────────────────────────

  @Get('tests')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'List all tests in an institution' })
  findAllTests(@Param('institutionId') institutionId: string) {
    return this.service.findAllTests(institutionId);
  }

  @Get('my-tests')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get published tests for the logged-in student (filtered by class)' })
  getMyTests(
    @Param('institutionId') institutionId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.findTestsForStudent(institutionId, user.id);
  }

  @Get('tests/:testId')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a test (metadata only)' })
  findOneTest(@Param('institutionId') institutionId: string, @Param('testId') testId: string) {
    return this.service.findOneTest(institutionId, testId);
  }

  @Get('tests/:testId/full')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a test with all its questions (for preview / print)' })
  getTestFull(@Param('institutionId') institutionId: string, @Param('testId') testId: string) {
    return this.service.getTestWithQuestions(institutionId, testId);
  }

  @Post('tests')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a test from question bank questions' })
  createTest(
    @Param('institutionId') institutionId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateTestDto,
  ) {
    return this.service.createTest(institutionId, user.id, dto);
  }

  @Patch('tests/:testId/status')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Change test status: draft → published → closed' })
  updateStatus(
    @Param('institutionId') institutionId: string,
    @Param('testId') testId: string,
    @Body() body: { status: TestStatus },
  ) {
    return this.service.updateTestStatus(institutionId, testId, body.status);
  }

  @Delete('tests/:testId')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a draft test' })
  removeTest(@Param('institutionId') institutionId: string, @Param('testId') testId: string) {
    return this.service.removeTest(institutionId, testId);
  }
}
