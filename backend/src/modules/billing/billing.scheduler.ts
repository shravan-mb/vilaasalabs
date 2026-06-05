import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { SubscriptionStatus } from '../../common/enums/subscription-plan.enum';
import { Institution } from '../../database/entities/institution.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BillingScheduler {
  private readonly logger = new Logger(BillingScheduler.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Institution)
    private readonly institutionRepo: Repository<Institution>,
    private readonly mailService: MailService,
  ) {}

  // Runs every day at 8 AM — warns institutions expiring in 3 days
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendExpiryWarnings() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    const expiringSoon = await this.subscriptionRepo
      .createQueryBuilder('s')
      .where('s.expires_at <= :threeDays', { threeDays: threeDaysFromNow })
      .andWhere('s.expires_at > :tomorrow', { tomorrow })
      .andWhere('s.status IN (:...statuses)', {
        statuses: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE],
      })
      .getMany();

    for (const sub of expiringSoon) {
      const institution = await this.institutionRepo.findOne({ where: { id: sub.institution_id } });
      if (!institution) continue;
      const daysLeft = Math.ceil((sub.expires_at.getTime() - Date.now()) / 86400000);
      this.logger.log(`Sending expiry warning to ${institution.email} (${daysLeft} days left)`);
      await this.mailService.sendTrialExpiryWarning(institution.name, institution.email, daysLeft);
    }
  }

  // Runs every day at midnight — expires overdue subscriptions and notifies
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOverdue() {
    const now = new Date();

    const overdue = await this.subscriptionRepo.find({
      where: {
        expires_at: LessThan(now),
        status: SubscriptionStatus.ACTIVE,
      },
    });

    for (const sub of overdue) {
      sub.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepo.save(sub);

      const institution = await this.institutionRepo.findOne({ where: { id: sub.institution_id } });
      if (!institution) continue;

      await this.institutionRepo.update(institution.id, { is_active: false });
      this.logger.log(`Expired subscription for ${institution.name}`);
      await this.mailService.sendSubscriptionExpired(institution.name, institution.email);
    }

    // Also expire trials
    const expiredTrials = await this.subscriptionRepo.find({
      where: {
        expires_at: LessThan(now),
        status: SubscriptionStatus.TRIAL,
      },
    });

    for (const sub of expiredTrials) {
      sub.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepo.save(sub);
      const institution = await this.institutionRepo.findOne({ where: { id: sub.institution_id } });
      if (!institution) continue;
      await this.institutionRepo.update(institution.id, { is_active: false });
      await this.mailService.sendSubscriptionExpired(institution.name, institution.email);
    }

    if (overdue.length + expiredTrials.length > 0) {
      this.logger.log(`Expired ${overdue.length + expiredTrials.length} subscriptions`);
    }
  }
}
