import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { InstitutionsService } from './institutions.service';

@ApiTags('Institutions')
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly service: InstitutionsService) {}

  @Post('onboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Onboard a new institution (Vilaasalabs internal only)' })
  onboard(@Body() dto: CreateInstitutionDto) {
    return this.service.onboard(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all institutions' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get institution by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VILAASALABS_SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend or reactivate an institution' })
  toggleActive(@Param('id') id: string) {
    return this.service.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VILAASALABS_SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete institution permanently' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
