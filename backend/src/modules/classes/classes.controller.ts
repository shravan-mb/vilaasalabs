import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@ApiTags('Classes & Subjects')
@Controller('institutions/:institutionId/classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClassesController {
  constructor(private readonly service: ClassesService) {}

  // ── Classes ──────────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER, Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  @ApiOperation({ summary: 'List all classes (with subjects) in an institution' })
  findAll(@Param('institutionId') institutionId: string) {
    return this.service.findAllClasses(institutionId);
  }

  @Get(':classId')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER, Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  @ApiOperation({ summary: 'Get a single class with subjects' })
  findOne(@Param('institutionId') institutionId: string, @Param('classId') classId: string) {
    return this.service.findOneClass(institutionId, classId);
  }

  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  @ApiOperation({ summary: 'Create a class (e.g. "Grade 10", section "A")' })
  create(@Param('institutionId') institutionId: string, @Body() dto: CreateClassDto) {
    return this.service.createClass(institutionId, dto);
  }

  @Patch(':classId')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  @ApiOperation({ summary: 'Update a class' })
  update(
    @Param('institutionId') institutionId: string,
    @Param('classId') classId: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.service.updateClass(institutionId, classId, dto);
  }

  @Delete(':classId')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a class and all its subjects' })
  remove(@Param('institutionId') institutionId: string, @Param('classId') classId: string) {
    return this.service.removeClass(institutionId, classId);
  }

  // ── Subjects ─────────────────────────────────────────────────────────────

  @Get(':classId/subjects')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER, Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  @ApiOperation({ summary: 'List subjects in a class' })
  findSubjects(@Param('institutionId') institutionId: string, @Param('classId') classId: string) {
    return this.service.findAllSubjects(institutionId, classId);
  }

  @Post(':classId/subjects')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  @ApiOperation({ summary: 'Add a subject to a class' })
  createSubject(
    @Param('institutionId') institutionId: string,
    @Param('classId') classId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.service.createSubject(institutionId, classId, dto);
  }

  @Delete(':classId/subjects/:subjectId')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove a subject from a class' })
  removeSubject(
    @Param('institutionId') institutionId: string,
    @Param('classId') classId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.service.removeSubject(institutionId, classId, subjectId);
  }
}
