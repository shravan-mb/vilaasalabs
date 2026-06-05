import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './dto/create-academic-year.dto';

@ApiTags('Academic Years')
@Controller('academic-years')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AcademicYearsController {
  constructor(private readonly service: AcademicYearsService) {}

  @Get()
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.TEACHER, Role.STUDENT, Role.PARENT)
  findAll(@Req() req: any) { return this.service.findAll(req.user.institution_id); }

  @Post()
  @Roles(Role.INSTITUTION_ADMIN)
  create(@Req() req: any, @Body() dto: CreateAcademicYearDto) {
    return this.service.create(req.user.institution_id, dto);
  }

  @Patch(':id')
  @Roles(Role.INSTITUTION_ADMIN)
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAcademicYearDto) {
    return this.service.update(req.user.institution_id, id, dto);
  }

  @Post(':id/activate')
  @Roles(Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Set as current academic year' })
  activate(@Req() req: any, @Param('id') id: string) {
    return this.service.activate(req.user.institution_id, id);
  }

  @Delete(':id')
  @Roles(Role.INSTITUTION_ADMIN)
  delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(req.user.institution_id, id);
  }
}
