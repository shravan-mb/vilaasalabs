import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LinkParentDto } from './dto/link-parent.dto';
import { StudentParentService } from './student-parent.service';

@ApiTags('Student-Parent Links')
@Controller('institutions/:institutionId/students/:studentId/parents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentParentController {
  constructor(private readonly service: StudentParentService) {}

  @Get()
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: "Get all parents linked to a student" })
  getParents(
    @Param('institutionId') institutionId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getParentsOfStudent(institutionId, studentId);
  }

  @Post()
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Link a parent user to a student' })
  link(
    @Param('institutionId') institutionId: string,
    @Param('studentId') studentId: string,
    @Body() dto: LinkParentDto,
  ) {
    return this.service.link(institutionId, studentId, dto);
  }

  @Delete(':parentId')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove the link between a parent and a student' })
  unlink(
    @Param('institutionId') institutionId: string,
    @Param('studentId') studentId: string,
    @Param('parentId') parentId: string,
  ) {
    return this.service.unlink(institutionId, studentId, parentId);
  }
}
