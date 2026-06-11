import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { MeetingRequestStatus } from '../../database/entities/meeting-request.entity';
import { User } from '../../database/entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('institutions/:institutionId/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // ── List / counts (no param segment) ──────────────────────────────────────

  @Get()
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  @ApiOperation({ summary: 'List users in an institution (paginated)' })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Param('institutionId') institutionId: string,
    @Query('role') role?: Role,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(institutionId, role, page ? +page : 1, limit ? +limit : 20, search);
  }

  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  create(@Param('institutionId') institutionId: string, @Body() dto: CreateUserDto) {
    return this.service.create(institutionId, dto);
  }

  // ── Literal single-segment routes (must come before :userId) ──────────────

  @Get('counts')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  @ApiOperation({ summary: 'Get user counts by role' })
  counts(@Param('institutionId') institutionId: string) {
    return this.service.countByRole(institutionId);
  }

  @Patch('bulk-proctor')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign one teacher as proctor to all students in a class' })
  bulkAssignProctor(
    @Param('institutionId') institutionId: string,
    @Body() body: { class_id: string; proctor_id: string },
  ) {
    return this.service.bulkAssignProctor(institutionId, body.class_id, body.proctor_id);
  }

  // ── Literal multi-segment routes (must come before :userId/X) ─────────────

  @Get('class/:classId')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER)
  @ApiOperation({ summary: 'Get all students in a class' })
  findByClass(@Param('institutionId') institutionId: string, @Param('classId') classId: string) {
    return this.service.findByClass(institutionId, classId);
  }

  @Get('proctor/:teacherId/students')
  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all students proctored by a teacher' })
  getProctoredStudents(@Param('institutionId') institutionId: string, @Param('teacherId') teacherId: string) {
    return this.service.findProctoredStudents(institutionId, teacherId);
  }

  @Get('proctor/:teacherId/performance')
  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Get attendance % and test results for all students proctored by a teacher' })
  getProctorPerformance(@Param('institutionId') institutionId: string, @Param('teacherId') teacherId: string) {
    return this.service.getProctorPerformance(institutionId, teacherId);
  }

  @Post('meeting-requests')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Parent requests a meeting with their child\'s proctor' })
  createMeetingRequest(
    @Param('institutionId') institutionId: string,
    @CurrentUser() user: User,
    @Body() body: { student_id: string; message: string; proposed_date?: string },
  ) {
    return this.service.createMeetingRequest(institutionId, user.id, body.student_id, body.message, body.proposed_date);
  }

  @Get('meeting-requests/my-requests')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Parent views their own meeting requests' })
  getMyMeetingRequests(@Param('institutionId') institutionId: string, @CurrentUser() user: User) {
    return this.service.getMeetingRequestsForParent(institutionId, user.id);
  }

  @Get('meeting-requests/incoming')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Teacher views meeting requests sent to them' })
  getIncomingMeetingRequests(@Param('institutionId') institutionId: string, @CurrentUser() user: User) {
    return this.service.getMeetingRequestsForTeacher(institutionId, user.id);
  }

  @Patch('meeting-requests/:requestId/respond')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Teacher accepts or declines a meeting request' })
  respondToMeeting(
    @Param('institutionId') institutionId: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: User,
    @Body() body: { status: MeetingRequestStatus; response_note?: string },
  ) {
    return this.service.respondToMeetingRequest(institutionId, requestId, user.id, body.status, body.response_note);
  }

  // ── Parameterized single-segment (:userId) ─────────────────────────────────

  @Post(':studentId/link-parent')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Link a parent to a student' })
  linkParent(
    @Param('institutionId') institutionId: string,
    @Param('studentId') studentId: string,
    @Body() body: { parent_id: string },
  ) {
    return this.service.linkStudentParent(institutionId, studentId, body.parent_id);
  }

  @Get(':userId/children')
  @Roles(Role.INSTITUTION_ADMIN, Role.PARENT, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all students linked to a parent, with proctor info' })
  getChildren(@Param('institutionId') institutionId: string, @Param('userId') userId: string) {
    return this.service.findChildrenOfParent(institutionId, userId);
  }

  @Get(':userId/proctor-notes')
  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Get proctor notes for a student' })
  getProctorNotes(@Param('institutionId') institutionId: string, @Param('userId') userId: string) {
    return this.service.getProctorNotes(institutionId, userId);
  }

  @Post(':userId/proctor-notes')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Add a proctor note for a student' })
  addProctorNote(
    @Param('institutionId') institutionId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
    @Body() body: { content: string },
  ) {
    return this.service.createProctorNote(institutionId, user.id, userId, body.content);
  }

  @Delete(':userId/proctor-notes/:noteId')
  @Roles(Role.TEACHER, Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Delete a proctor note' })
  deleteProctorNote(
    @Param('institutionId') institutionId: string,
    @Param('noteId') noteId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.deleteProctorNote(institutionId, noteId, user.id);
  }

  @Get(':userId')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  findOne(@Param('institutionId') institutionId: string, @Param('userId') userId: string) {
    return this.service.findOne(institutionId, userId);
  }

  @Patch(':userId/change-password')
  @Roles(Role.INSTITUTION_ADMIN)
  changePassword(
    @Param('institutionId') institutionId: string,
    @Param('userId') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.service.changePassword(institutionId, userId, dto);
  }

  @Patch(':userId/set-password')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  setPassword(
    @Param('institutionId') institutionId: string,
    @Param('userId') userId: string,
    @Body() body: { new_password: string },
  ) {
    return this.service.setPasswordByAdmin(institutionId, userId, body.new_password);
  }

  @Patch(':userId/deactivate')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  deactivate(@Param('institutionId') institutionId: string, @Param('userId') userId: string) {
    return this.service.deactivate(institutionId, userId);
  }

  @Patch(':userId/activate')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  activate(@Param('institutionId') institutionId: string, @Param('userId') userId: string) {
    return this.service.activate(institutionId, userId);
  }

  @Patch(':userId')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  update(
    @Param('institutionId') institutionId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.service.update(institutionId, userId, dto);
  }

  @Delete(':userId')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  remove(@Param('institutionId') institutionId: string, @Param('userId') userId: string) {
    return this.service.remove(institutionId, userId);
  }
}
