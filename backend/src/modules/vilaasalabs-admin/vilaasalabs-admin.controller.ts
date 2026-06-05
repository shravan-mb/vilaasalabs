import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminSubscriptionDto, BroadcastDto, UpdateInstitutionDto } from './dto/admin-actions.dto';
import { VilaasalabsAdminService } from './vilaasalabs-admin.service';

@ApiTags('Vilaasalabs Internal Admin')
@Controller('vilaasalabs-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
@ApiBearerAuth()
export class VilaasalabsAdminController {
  constructor(private readonly service: VilaasalabsAdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Business overview stats' })
  getOverview() { return this.service.getBusinessOverview(); }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue stats: MRR, plan breakdown, recent payments' })
  getRevenue() { return this.service.getRevenueStats(); }

  @Get('institutions')
  @ApiOperation({ summary: 'Paginated institution list with search' })
  listInstitutions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listInstitutions(page ? +page : 1, limit ? +limit : 20, search);
  }

  @Get('institutions/:id')
  @ApiOperation({ summary: 'Full institution detail with user counts + subscription history' })
  getDetail(@Param('id') id: string) { return this.service.getInstitutionDetails(id); }

  @Patch('institutions/:id')
  @ApiOperation({ summary: 'Edit institution info' })
  updateInstitution(@Param('id') id: string, @Body() dto: UpdateInstitutionDto) {
    return this.service.updateInstitution(id, dto);
  }

  @Post('institutions/:id/subscription')
  @ApiOperation({ summary: 'Change or extend subscription for an institution' })
  changeSubscription(@Param('id') id: string, @Body() dto: AdminSubscriptionDto) {
    return this.service.changeSubscription(id, dto);
  }

  @Post('institutions/:id/suspend')
  @ApiOperation({ summary: 'Suspend an institution' })
  suspend(@Param('id') id: string) { return this.service.suspend(id); }

  @Post('institutions/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a suspended institution' })
  reactivate(@Param('id') id: string) { return this.service.reactivate(id); }

  @Post('broadcast')
  @ApiOperation({ summary: 'Send broadcast email to all or selected institutions' })
  broadcast(@Body() dto: BroadcastDto) { return this.service.broadcast(dto); }
}
