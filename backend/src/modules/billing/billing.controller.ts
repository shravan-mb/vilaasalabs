import { Body, Controller, Get, Headers, HttpCode, Param, Post, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BillingService } from './billing.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiTags('Billing')
@Controller()
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Get('billing/plans')
  @ApiOperation({ summary: 'Get all plan prices (public)' })
  getPlans() {
    return this.service.getPlanPrices();
  }

  @Post('institutions/:institutionId/billing/create-order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTITUTION_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Razorpay order to upgrade/renew subscription' })
  createOrder(@Param('institutionId') institutionId: string, @Body() dto: CreateOrderDto) {
    return this.service.createOrder(institutionId, dto.plan, dto.billing_cycle);
  }

  @Post('institutions/:institutionId/billing/verify-payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTITUTION_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Razorpay payment and activate subscription' })
  verifyPayment(@Param('institutionId') institutionId: string, @Body() dto: VerifyPaymentDto) {
    return this.service.verifyAndActivate(
      institutionId,
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
      dto.plan,
      dto.billing_cycle,
    );
  }

  @Post('billing/webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Razorpay payment webhook (called by Razorpay servers)' })
  webhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.service.handleWebhook(payload, signature);
  }
}
