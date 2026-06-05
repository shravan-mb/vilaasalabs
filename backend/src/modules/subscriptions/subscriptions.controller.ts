import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ExtendSubscriptionDto } from './dto/extend-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller('institutions/:institutionId/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get()
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  @ApiOperation({ summary: 'Get full subscription history for an institution' })
  findAll(@Param('institutionId') institutionId: string) {
    return this.service.getForInstitution(institutionId);
  }

  @Get('current')
  @Roles(Role.INSTITUTION_ADMIN, Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  @ApiOperation({ summary: 'Get the active subscription for an institution' })
  getCurrent(@Param('institutionId') institutionId: string) {
    return this.service.getCurrent(institutionId);
  }

  @Get('limits')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Get current plan limits (max students, teachers)' })
  getLimits(@Param('institutionId') institutionId: string) {
    return this.service.getPlanLimits(institutionId);
  }

  @Post('extend')
  @Roles(Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
  @ApiOperation({ summary: 'Extend or upgrade an institution subscription (Vilaasalabs internal)' })
  extend(@Param('institutionId') institutionId: string, @Body() dto: ExtendSubscriptionDto) {
    return this.service.extendOrUpgrade(institutionId, dto);
  }

  @Patch('suspend')
  @Roles(Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend an institution (blocks login for institution users)' })
  suspend(@Param('institutionId') institutionId: string) {
    return this.service.suspend(institutionId);
  }

  @Patch('reactivate')
  @Roles(Role.VILAASALABS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Reactivate a suspended institution' })
  reactivate(@Param('institutionId') institutionId: string) {
    return this.service.reactivate(institutionId);
  }
}
