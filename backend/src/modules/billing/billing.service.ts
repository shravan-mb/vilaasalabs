import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { Repository } from 'typeorm';
import { BillingCycle, SubscriptionPlan, SubscriptionStatus } from '../../common/enums/subscription-plan.enum';
import { Institution } from '../../database/entities/institution.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { MailService } from '../mail/mail.service';

export const PLAN_PRICES: Record<SubscriptionPlan, Record<BillingCycle, number>> = {
  [SubscriptionPlan.TRIAL]:   { monthly: 0,     annual: 0     },
  [SubscriptionPlan.STARTER]: { monthly: 799,   annual: 7990  },
  [SubscriptionPlan.GROWTH]:  { monthly: 1999,  annual: 19990 },
  [SubscriptionPlan.PRO]:     { monthly: 4499,  annual: 44990 },
  [SubscriptionPlan.PRO_MAX]: { monthly: 8999,  annual: 89990 },
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private razorpay: Razorpay;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Institution)
    private readonly institutionRepo: Repository<Institution>,
    private readonly mailService: MailService,
  ) {
    const keyId = config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = config.get<string>('RAZORPAY_KEY_SECRET');
    if (keyId && keySecret) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  async createOrder(
    institutionId: string,
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
  ): Promise<{ order_id: string; amount: number; currency: string; key_id: string }> {
    if (!this.razorpay) throw new BadRequestException('Billing not configured — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
    if (plan === SubscriptionPlan.TRIAL) {
      throw new BadRequestException('Cannot create an order for the trial plan');
    }

    const amountInr = PLAN_PRICES[plan][billingCycle];
    const amountPaise = amountInr * 100;

    const order = await this.razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `ev_${institutionId.slice(0, 8)}_${Date.now()}`,
      notes: {
        institution_id: institutionId,
        plan,
        billing_cycle: billingCycle,
      },
    });

    return {
      order_id: order.id,
      amount: amountInr,
      currency: 'INR',
      key_id: this.config.get<string>('RAZORPAY_KEY_ID') as string,
    };
  }

  async verifyAndActivate(
    institutionId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
  ): Promise<Subscription> {
    if (!this.razorpay) throw new BadRequestException('Billing not configured — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
    // Verify signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.config.get<string>('RAZORPAY_KEY_SECRET') as string)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestException('Payment verification failed — invalid signature');
    }

    return this.activateSubscription(institutionId, plan, billingCycle, razorpayPaymentId, razorpayOrderId);
  }

  async handleWebhook(payload: any, razorpaySignature: string): Promise<void> {
    const body = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', this.config.get<string>('RAZORPAY_WEBHOOK_SECRET') as string)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      this.logger.warn('Invalid Razorpay webhook signature');
      return;
    }

    if (payload.event === 'payment.captured') {
      const payment = payload.payload?.payment?.entity;
      if (!payment?.notes?.institution_id) return;

      const { institution_id, plan, billing_cycle } = payment.notes;
      await this.activateSubscription(
        institution_id,
        plan as SubscriptionPlan,
        billing_cycle as BillingCycle,
        payment.id,
        payment.order_id,
      );
    }
  }

  private async activateSubscription(
    institutionId: string,
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
    paymentId: string,
    orderId: string,
  ): Promise<Subscription> {
    const institution = await this.institutionRepo.findOne({ where: { id: institutionId } });
    if (!institution) throw new BadRequestException('Institution not found');

    // Expire current subscription
    await this.subscriptionRepo
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: SubscriptionStatus.EXPIRED })
      .where('institution_id = :institutionId', { institutionId })
      .andWhere('status IN (:...statuses)', {
        statuses: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE_PERIOD],
      })
      .execute();

    const now = new Date();
    const expiresAt = new Date(now);
    if (billingCycle === BillingCycle.ANNUAL) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const amountInr = PLAN_PRICES[plan][billingCycle];

    const subscription = this.subscriptionRepo.create({
      institution_id: institutionId,
      plan,
      billing_cycle: billingCycle,
      status: SubscriptionStatus.ACTIVE,
      amount: amountInr,
      started_at: now,
      expires_at: expiresAt,
      razorpay_payment_id: paymentId,
      razorpay_subscription_id: orderId,
    });

    const saved = await this.subscriptionRepo.save(subscription);

    await this.institutionRepo.update(institutionId, {
      subscription_plan: plan,
      subscription_expires_at: expiresAt,
      is_active: true,
    });

    // Send payment success email
    this.mailService.sendPaymentSuccess(institution.name, institution.email, plan, amountInr, expiresAt);

    return saved;
  }

  getPlanPrices() {
    return Object.entries(PLAN_PRICES)
      .filter(([plan]) => plan !== SubscriptionPlan.TRIAL)
      .map(([plan, prices]) => ({ plan, ...prices }));
  }
}
