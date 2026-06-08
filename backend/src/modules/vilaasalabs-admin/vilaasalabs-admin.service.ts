import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { SubscriptionPlan, SubscriptionStatus } from '../../common/enums/subscription-plan.enum';
import { Institution } from '../../database/entities/institution.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { User } from '../../database/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { AdminSubscriptionDto, BroadcastDto, UpdateInstitutionDto } from './dto/admin-actions.dto';

const PLAN_PRICES: Record<string, Record<string, number>> = {
  trial:   { monthly: 0,     annual: 0 },
  starter: { monthly: 999,   annual: 9990 },
  growth:  { monthly: 2499,  annual: 24990 },
  pro:     { monthly: 4999,  annual: 49990 },
  pro_max: { monthly: 9999,  annual: 99990 },
};

@Injectable()
export class VilaasalabsAdminService {
  constructor(
    @InjectRepository(Institution) private readonly institutionRepo: Repository<Institution>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    private readonly mailService: MailService,
  ) {}

  async getBusinessOverview() {
    const [totalInstitutions, activeInstitutions, totalUsers] = await Promise.all([
      this.institutionRepo.count(),
      this.institutionRepo.count({ where: { is_active: true } }),
      this.userRepo.count(),
    ]);

    const [subscriptionBreakdown, statusBreakdown, recentInstitutions, expiringTrials] = await Promise.all([
      this.institutionRepo.createQueryBuilder('i').select('i.subscription_plan', 'plan').addSelect('COUNT(*)', 'count').groupBy('i.subscription_plan').getRawMany(),
      this.institutionRepo.createQueryBuilder('i').select('i.subscription_status', 'status').addSelect('COUNT(*)', 'count').groupBy('i.subscription_status').getRawMany(),
      this.institutionRepo.find({ order: { created_at: 'DESC' }, take: 5 }),
      this.institutionRepo.createQueryBuilder('i').where('i.subscription_status = :status', { status: SubscriptionStatus.TRIAL }).andWhere('i.subscription_expires_at < :date', { date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) }).getMany(),
    ]);

    return { stats: { total_institutions: totalInstitutions, active_institutions: activeInstitutions, total_users: totalUsers }, subscription_breakdown: subscriptionBreakdown, status_breakdown: statusBreakdown, recent_institutions: recentInstitutions, expiring_trials: expiringTrials };
  }

  async listInstitutions(page = 1, limit = 20, search?: string) {
    const where: any = search ? [{ name: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }, { city: ILike(`%${search}%`) }] : {};
    const [data, total] = await this.institutionRepo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getInstitutionDetails(id: string) {
    const institution = await this.institutionRepo.findOne({ where: { id } });
    if (!institution) throw new NotFoundException('Institution not found');
    const [userCounts, subscriptions] = await Promise.all([
      this.userRepo.createQueryBuilder('u').select('u.role', 'role').addSelect('COUNT(*)', 'count').where('u.institution_id = :id', { id }).groupBy('u.role').getRawMany(),
      this.subscriptionRepo.find({ where: { institution_id: id }, order: { created_at: 'DESC' }, take: 5 }),
    ]);
    return { ...institution, user_counts: userCounts.reduce((a, r) => ({ ...a, [r.role]: Number(r.count) }), {}), subscriptions };
  }

  async updateInstitution(id: string, dto: UpdateInstitutionDto): Promise<Institution> {
    const inst = await this.institutionRepo.findOne({ where: { id } });
    if (!inst) throw new NotFoundException('Institution not found');
    Object.assign(inst, dto);
    return this.institutionRepo.save(inst);
  }

  async changeSubscription(institutionId: string, dto: AdminSubscriptionDto): Promise<Subscription> {
    const institution = await this.institutionRepo.findOne({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');

    await this.subscriptionRepo.createQueryBuilder().update(Subscription)
      .set({ status: SubscriptionStatus.EXPIRED })
      .where('institution_id = :institutionId', { institutionId })
      .andWhere('status IN (:...statuses)', { statuses: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE_PERIOD] })
      .execute();

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + dto.duration_months);

    const amount = dto.amount ?? (PLAN_PRICES[dto.plan]?.[dto.billing_cycle] ?? 0);
    const sub = this.subscriptionRepo.create({ institution_id: institutionId, plan: dto.plan, billing_cycle: dto.billing_cycle, status: SubscriptionStatus.ACTIVE, amount, started_at: now, expires_at: expiresAt });
    const saved = await this.subscriptionRepo.save(sub);

    await this.institutionRepo.update(institutionId, { subscription_plan: dto.plan, subscription_expires_at: expiresAt, is_active: true });
    return saved;
  }

  async suspend(institutionId: string): Promise<void> {
    await this.subscriptionRepo.createQueryBuilder().update(Subscription)
      .set({ status: SubscriptionStatus.SUSPENDED })
      .where('institution_id = :institutionId', { institutionId })
      .andWhere('status IN (:...s)', { s: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE_PERIOD] })
      .execute();
    await this.institutionRepo.update(institutionId, { is_active: false });
  }

  async reactivate(institutionId: string): Promise<void> {
    await this.subscriptionRepo.createQueryBuilder().update(Subscription)
      .set({ status: SubscriptionStatus.ACTIVE })
      .where('institution_id = :institutionId', { institutionId })
      .andWhere('status = :status', { status: SubscriptionStatus.SUSPENDED })
      .execute();
    await this.institutionRepo.update(institutionId, { is_active: true });
  }

  async getRevenueStats() {
    const activeCount = await this.subscriptionRepo.count({ where: { status: SubscriptionStatus.ACTIVE } });
    const trialCount = await this.subscriptionRepo.count({ where: { status: SubscriptionStatus.TRIAL } });
    const expiredCount = await this.subscriptionRepo.count({ where: { status: SubscriptionStatus.EXPIRED } });

    const planBreakdown = await this.institutionRepo.createQueryBuilder('i')
      .select('i.subscription_plan', 'plan').addSelect('COUNT(*)', 'count')
      .where('i.subscription_status = :status', { status: SubscriptionStatus.ACTIVE })
      .groupBy('i.subscription_plan').getRawMany();

    const mrr = planBreakdown.reduce((sum, row) => {
      const monthly = PLAN_PRICES[row.plan]?.monthly ?? 0;
      return sum + monthly * Number(row.count);
    }, 0);

    const recentPayments = await this.subscriptionRepo.find({
      where: { status: SubscriptionStatus.ACTIVE },
      order: { created_at: 'DESC' },
      take: 10,
    });

    return { mrr, active_subscriptions: activeCount, trial_subscriptions: trialCount, expired_subscriptions: expiredCount, plan_breakdown: planBreakdown, recent_payments: recentPayments };
  }

  async updateFeatureFlags(institutionId: string, flags: Record<string, boolean>): Promise<void> {
    const inst = await this.institutionRepo.findOne({ where: { id: institutionId } });
    if (!inst) throw new NotFoundException('Institution not found');
    inst.feature_flags = { ...(inst.feature_flags ?? {}), ...flags };
    await this.institutionRepo.save(inst);
  }

  async broadcast(dto: BroadcastDto): Promise<{ sent: number }> {
    let emails: string[];
    if (dto.institution_ids?.length) {
      const insts = await this.institutionRepo.findBy(dto.institution_ids.map((id) => ({ id })));
      emails = insts.map((i) => i.email).filter(Boolean);
    } else {
      const insts = await this.institutionRepo.find({ where: { is_active: true }, select: { email: true } });
      emails = insts.map((i) => i.email).filter(Boolean);
    }
    await this.mailService.sendBroadcast(emails, dto.subject, dto.body);
    return { sent: emails.length };
  }
}
