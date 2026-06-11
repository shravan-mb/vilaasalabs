import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../../database/entities/user.entity';
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

  @Get(':id/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get institution profile — accessible to institution admin' })
  getProfile(@Param('id') id: string, @CurrentUser() user: User) {
    if (user.institution_id !== id) throw new ForbiddenException();
    return this.service.getProfile(id);
  }

  @Patch(':id/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTITUTION_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update institution profile — admin only' })
  updateProfile(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: any) {
    if (user.institution_id !== id) throw new ForbiddenException();
    const allowed = ['name', 'registration_number', 'phone', 'address', 'city', 'state', 'pincode', 'logo_url', 'principal_name'];
    const filtered = Object.fromEntries(Object.entries(dto).filter(([k]) => allowed.includes(k)));
    return this.service.updateProfile(id, filtered);
  }

  @Get(':id/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get institution feature flags — accessible to institution users' })
  getSettings(@Param('id') id: string, @CurrentUser() user: User) {
    const isOwn = user.institution_id === id;
    const isInternal = user.role === Role.VILAASALABS_SUPER_ADMIN || user.role === Role.VILAASALABS_DEV;
    if (!isOwn && !isInternal) throw new ForbiddenException();
    return this.service.getSettings(id);
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
