import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PLAN_LIMITS, SubscriptionPlan, SubscriptionStatus, TRIAL_DURATION_DAYS } from '../../common/enums/subscription-plan.enum';
import { Institution } from '../../database/entities/institution.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { ExtendSubscriptionDto } from './dto/extend-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Institution)
    private readonly institutionRepo: Repository<Institution>,
  ) {}

  async getForInstitution(institutionId: string): Promise<Subscription[]> {
    return this.subscriptionRepo.find({
      where: { institution_id: institutionId },
      order: { created_at: 'DESC' },
    });
  }

  async getCurrent(institutionId: string): Promise<Subscription> {
    const active = await this.findCurrent(institutionId);
    if (!active) throw new NotFoundException('No active subscription found for this institution');
    return active;
  }

  async findCurrent(institutionId: string): Promise<Subscription | null> {
    const sub = await this.subscriptionRepo.findOne({
      where: [
        { institution_id: institutionId, status: SubscriptionStatus.TRIAL },
        { institution_id: institutionId, status: SubscriptionStatus.ACTIVE },
        { institution_id: institutionId, status: SubscriptionStatus.GRACE_PERIOD },
      ],
      order: { created_at: 'DESC' },
    });
    if (sub) return sub;

    // Fallback: synthesise from institution fields for institutions without a subscriptions row
    const inst = await this.institutionRepo.findOne({ where: { id: institutionId } });
    if (!inst?.subscription_plan) return null;
    const activeStatuses: SubscriptionStatus[] = [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.GRACE_PERIOD];
    if (!activeStatuses.includes(inst.subscription_status)) return null;

    return Object.assign(new Subscription(), {
      id:              null,
      institution_id:  institutionId,
      plan:            inst.subscription_plan,
      status:          inst.subscription_status,
      billing_cycle:   null,
      amount:          0,
      started_at:      inst.created_at,
      expires_at:      inst.subscription_expires_at ?? null,
      razorpay_subscription_id: null,
      razorpay_payment_id:      null,
      created_at:      inst.created_at,
      updated_at:      inst.updated_at,
    });
  }

  async extendOrUpgrade(institutionId: string, dto: ExtendSubscriptionDto): Promise<Subscription> {
    const institution = await this.institutionRepo.findOne({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');

    if (dto.plan === SubscriptionPlan.TRIAL) {
      const hadTrial = await this.subscriptionRepo.findOne({ where: { institution_id: institutionId, plan: SubscriptionPlan.TRIAL } });
      if (hadTrial) throw new BadRequestException('This institution has already used its free trial');
    }

    // Expire any current active subscription
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
    expiresAt.setMonth(expiresAt.getMonth() + dto.duration_months);

    const subscription = this.subscriptionRepo.create({
      institution_id: institutionId,
      plan: dto.plan,
      billing_cycle: dto.billing_cycle,
      status: SubscriptionStatus.ACTIVE,
      amount: dto.amount ?? 0,
      started_at: now,
      expires_at: expiresAt,
    });

    const saved = await this.subscriptionRepo.save(subscription);

    // Update institution plan and expiry
    await this.institutionRepo.update(institutionId, {
      subscription_plan: dto.plan,
      subscription_expires_at: expiresAt,
      is_active: true,
    });

    return saved;
  }

  async suspend(institutionId: string): Promise<void> {
    const current = await this.getCurrent(institutionId);
    current.status = SubscriptionStatus.SUSPENDED;
    await this.subscriptionRepo.save(current);
    await this.institutionRepo.update(institutionId, { is_active: false });
  }

  async reactivate(institutionId: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { institution_id: institutionId, status: SubscriptionStatus.SUSPENDED },
      order: { created_at: 'DESC' },
    });
    if (!subscription) throw new BadRequestException('No suspended subscription found');
    subscription.status = SubscriptionStatus.ACTIVE;
    await this.subscriptionRepo.save(subscription);
    await this.institutionRepo.update(institutionId, { is_active: true });
  }

  async getPlanLimits(institutionId: string): Promise<{ plan: SubscriptionPlan; limits: { maxStudents: number; maxTeachers: number } }> {
    const current = await this.findCurrent(institutionId);
    if (!current) throw new NotFoundException('No active subscription found for this institution');
    return { plan: current.plan, limits: PLAN_LIMITS[current.plan] };
  }

  // Called by a cron job or webhook — expires overdue subscriptions
  async expireOverdue(): Promise<number> {
    const result = await this.subscriptionRepo
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: SubscriptionStatus.EXPIRED })
      .where('expires_at < NOW()')
      .andWhere('status IN (:...statuses)', {
        statuses: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE],
      })
      .execute();

    return result.affected ?? 0;
  }

  // Called once per day from the Vilaasalabs admin panel to give a grace period
  async applyGracePeriod(): Promise<number> {
    const result = await this.subscriptionRepo
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: SubscriptionStatus.GRACE_PERIOD })
      .where('expires_at < NOW()')
      .andWhere('status = :status', { status: SubscriptionStatus.ACTIVE })
      .execute();

    return result.affected ?? 0;
  }
}
