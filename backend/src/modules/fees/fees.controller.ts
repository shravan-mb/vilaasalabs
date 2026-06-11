import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { User } from '../../database/entities/user.entity';
import { CreateDiscountDto, CreateFeeCategoryDto, RecordPaymentDto, UpdateFeeCategoryDto, UpsertClassFeeStructureDto } from './dto/fees.dto';
import { FeesService } from './fees.service';

@ApiTags('Fees')
@Controller('institutions/:institutionId/fees')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FeesController {
  constructor(private readonly service: FeesService) {}

  // ── Categories ────────────────────────────────────────────────────────────────

  @Get('categories')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'List all fee categories for institution' })
  getCategories(@Param('institutionId') institutionId: string) {
    return this.service.getCategories(institutionId);
  }

  @Post('categories')
  @Roles(Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Create a fee category (e.g. Tuition, Transport)' })
  createCategory(@Param('institutionId') institutionId: string, @Body() dto: CreateFeeCategoryDto) {
    return this.service.createCategory(institutionId, dto);
  }

  @Patch('categories/:id')
  @Roles(Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Update fee category' })
  updateCategory(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body() dto: UpdateFeeCategoryDto) {
    return this.service.updateCategory(institutionId, id, dto);
  }

  @Delete('categories/:id')
  @Roles(Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Delete fee category' })
  deleteCategory(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.service.deleteCategory(institutionId, id);
  }

  // ── Class Fee Structures ──────────────────────────────────────────────────────

  @Get('structures')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Get fee structures, optionally filtered by class' })
  getStructures(@Param('institutionId') institutionId: string, @Query('classId') classId?: string) {
    return this.service.getStructures(institutionId, classId);
  }

  @Post('structures')
  @Roles(Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Set fee amount for a class + category (creates or updates)' })
  upsertStructure(@Param('institutionId') institutionId: string, @Body() dto: UpsertClassFeeStructureDto) {
    return this.service.upsertStructure(institutionId, dto);
  }

  @Post('structures/copy')
  @Roles(Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Copy fee structure from one class to multiple other classes' })
  copyStructures(
    @Param('institutionId') institutionId: string,
    @Body() body: { source_class_id: string; target_class_ids: string[]; overwrite?: boolean },
  ) {
    return this.service.copyStructures(institutionId, body.source_class_id, body.target_class_ids, body.overwrite ?? false);
  }

  @Delete('structures/:id')
  @Roles(Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Remove a class fee structure entry' })
  deleteStructure(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.service.deleteStructure(institutionId, id);
  }

  // ── Discounts ─────────────────────────────────────────────────────────────────

  @Get('discounts/:studentId')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Get all discounts for a student' })
  getDiscounts(
    @Param('institutionId') institutionId: string,
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.service.getDiscounts(institutionId, studentId, academicYearId);
  }

  @Post('discounts')
  @Roles(Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Grant or update a discount for a student' })
  createDiscount(@Param('institutionId') institutionId: string, @CurrentUser() user: User, @Body() dto: CreateDiscountDto) {
    return this.service.createDiscount(institutionId, user.id, dto);
  }

  @Delete('discounts/:id')
  @Roles(Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Remove a student discount' })
  deleteDiscount(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.service.deleteDiscount(institutionId, id);
  }

  // ── Payments ──────────────────────────────────────────────────────────────────

  @Get('payments/:studentId')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'Get payment history for a student' })
  getPayments(
    @Param('institutionId') institutionId: string,
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.service.getPayments(institutionId, studentId, academicYearId);
  }

  @Post('payments')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Record a cash payment for a student' })
  recordPayment(@Param('institutionId') institutionId: string, @CurrentUser() user: User, @Body() dto: RecordPaymentDto) {
    return this.service.recordPayment(institutionId, user.id, dto);
  }

  @Delete('payments/:id')
  @Roles(Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Delete a payment record (admin only)' })
  deletePayment(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.service.deletePayment(institutionId, id);
  }

  // ── Today's summary (for staff dashboard) ────────────────────────────────────

  @Get('today-summary')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: "Today's fee collection summary: total collected, count, recent payments" })
  getTodaySummary(@Param('institutionId') institutionId: string) {
    return this.service.getTodaySummary(institutionId);
  }

  // ── Summary ───────────────────────────────────────────────────────────────────

  @Get('summary/:studentId')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'Full fee summary for a student: due, discount, paid, balance per category' })
  getStudentSummary(
    @Param('institutionId') institutionId: string,
    @Param('studentId') studentId: string,
    @Query('classId') classId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.service.getStudentFeeSummary(institutionId, studentId, classId, academicYearId);
  }

  @Get('pending-summary')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF)
  @ApiOperation({ summary: 'Get pending fee balances for all students in a class' })
  getPendingSummary(
    @Param('institutionId') institutionId: string,
    @Query('classId') classId: string,
  ) {
    return this.service.getPendingFeesSummary(institutionId, classId);
  }

  @Get('receipts/:paymentId')
  @Roles(Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'Get full receipt data for a payment' })
  getReceipt(
    @Param('institutionId') institutionId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.service.getReceipt(institutionId, paymentId);
  }
}
