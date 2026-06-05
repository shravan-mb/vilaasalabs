import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VilaasalabsAdminService } from './vilaasalabs-admin.service';

@ApiTags('Vilaasalabs Internal Admin')
@Controller('vilaasalabs-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
@ApiBearerAuth()
export class VilaasalabsAdminController {
  constructor(private readonly service: VilaasalabsAdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Business overview — stats, subscriptions, recent onboarding' })
  getOverview() {
    return this.service.getBusinessOverview();
  }

  @Get('institutions/:id')
  @ApiOperation({ summary: 'Full details of a specific institution' })
  getInstitutionDetails(@Param('id') id: string) {
    return this.service.getInstitutionDetails(id);
  }
}
