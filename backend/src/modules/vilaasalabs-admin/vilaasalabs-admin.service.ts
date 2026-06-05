import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionStatus } from '../../common/enums/subscription-plan.enum';
import { Institution } from '../../database/entities/institution.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class VilaasalabsAdminService {
  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepo: Repository<Institution>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

  async getBusinessOverview() {
    const [totalInstitutions, activeInstitutions, totalUsers] = await Promise.all([
      this.institutionRepo.count(),
      this.institutionRepo.count({ where: { is_active: true } }),
      this.userRepo.count(),
    ]);

    const subscriptionBreakdown = await this.institutionRepo
      .createQueryBuilder('inst')
      .select('inst.subscription_plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .groupBy('inst.subscription_plan')
      .getRawMany();

    const statusBreakdown = await this.institutionRepo
      .createQueryBuilder('inst')
      .select('inst.subscription_status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('inst.subscription_status')
      .getRawMany();

    const recentInstitutions = await this.institutionRepo.find({
      order: { created_at: 'DESC' },
      take: 5,
    });

    const expiringTrials = await this.institutionRepo
      .createQueryBuilder('inst')
      .where('inst.subscription_status = :status', { status: SubscriptionStatus.TRIAL })
      .andWhere('inst.subscription_expires_at < :date', {
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // expiring in 2 days
      })
      .getMany();

    return {
      stats: {
        total_institutions: totalInstitutions,
        active_institutions: activeInstitutions,
        total_users: totalUsers,
      },
      subscription_breakdown: subscriptionBreakdown,
      status_breakdown: statusBreakdown,
      recent_institutions: recentInstitutions,
      expiring_trials: expiringTrials,
    };
  }

  async getInstitutionDetails(id: string) {
    return this.institutionRepo.findOne({
      where: { id },
      relations: { users: true, subscriptions: true },
    });
  }
}
