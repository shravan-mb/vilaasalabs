import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('EMAIL_HOST'),
      port: config.get<number>('EMAIL_PORT', 587),
      secure: false,
      auth: {
        user: config.get('EMAIL_USER'),
        pass: config.get('EMAIL_PASS'),
      },
    });
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.get('EMAIL_FROM', 'EduVilaasa <no-reply@eduvilaasa.com>'),
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }

  async sendWelcome(institutionName: string, adminEmail: string, adminName: string): Promise<void> {
    await this.send(
      adminEmail,
      `Welcome to EduVilaasa — ${institutionName}`,
      `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
        <h2 style="color:#7c3aed">Welcome to EduVilaasa! 🎉</h2>
        <p>Hi <strong>${adminName}</strong>,</p>
        <p>Your institution <strong>${institutionName}</strong> has been successfully onboarded on EduVilaasa.</p>
        <p>You have a <strong>7-day free trial</strong> starting today. Log in at
          <a href="https://app.eduvilaasa.com" style="color:#7c3aed">app.eduvilaasa.com</a>
          to get started.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#888;font-size:12px">Powered by <a href="https://vilaasalabs.com" style="color:#7c3aed">Vilaasalabs</a></p>
      </div>
      `,
    );
  }

  async sendTrialExpiryWarning(institutionName: string, adminEmail: string, daysLeft: number): Promise<void> {
    await this.send(
      adminEmail,
      `Your EduVilaasa trial expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
      `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
        <h2 style="color:#f59e0b">⚠ Trial Expiring Soon</h2>
        <p>Hi,</p>
        <p>Your EduVilaasa trial for <strong>${institutionName}</strong> expires in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.</p>
        <p>Upgrade now to keep all your data and continue without interruption.</p>
        <a href="https://app.eduvilaasa.com/admin/subscription"
          style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Upgrade Now
        </a>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#888;font-size:12px">Powered by <a href="https://vilaasalabs.com" style="color:#7c3aed">Vilaasalabs</a></p>
      </div>
      `,
    );
  }

  async sendSubscriptionExpired(institutionName: string, adminEmail: string): Promise<void> {
    await this.send(
      adminEmail,
      `Your EduVilaasa subscription has expired — ${institutionName}`,
      `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
        <h2 style="color:#ef4444">Subscription Expired</h2>
        <p>Hi,</p>
        <p>Your EduVilaasa subscription for <strong>${institutionName}</strong> has expired.</p>
        <p>Your data is safe. Please renew to regain access.</p>
        <a href="https://app.eduvilaasa.com/admin/subscription"
          style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Renew Now
        </a>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#888;font-size:12px">Powered by <a href="https://vilaasalabs.com" style="color:#7c3aed">Vilaasalabs</a></p>
      </div>
      `,
    );
  }

  async sendTestPublished(testTitle: string, subject: string, studentEmails: string[]): Promise<void> {
    if (!studentEmails.length) return;
    for (const email of studentEmails) {
      await this.send(
        email,
        `New Test Published: ${testTitle}`,
        `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
          <h2 style="color:#7c3aed">📝 New Test Available</h2>
          <p>A new test has been published for <strong>${subject}</strong>:</p>
          <p style="font-size:18px;font-weight:600">${testTitle}</p>
          <a href="https://app.eduvilaasa.com/student/tests"
            style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            View Test
          </a>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#888;font-size:12px">Powered by <a href="https://vilaasalabs.com" style="color:#7c3aed">Vilaasalabs</a></p>
        </div>
        `,
      );
    }
  }

  async sendPasswordChanged(userEmail: string, userName: string): Promise<void> {
    await this.send(
      userEmail,
      'Your EduVilaasa password was changed',
      `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
        <h2 style="color:#7c3aed">Password Changed</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Your EduVilaasa password was just changed. If you did not do this, contact your institution admin immediately.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#888;font-size:12px">Powered by <a href="https://vilaasalabs.com" style="color:#7c3aed">Vilaasalabs</a></p>
      </div>
      `,
    );
  }

  async sendPasswordReset(userEmail: string, userName: string, resetUrl: string): Promise<void> {
    await this.send(
      userEmail,
      'Reset your EduVilaasa password',
      `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
        <h2 style="color:#7c3aed">Password Reset Request</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>We received a request to reset your password. Click the button below — this link is valid for <strong>30 minutes</strong>.</p>
        <a href="${resetUrl}"
          style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="margin-top:16px;color:#888;font-size:12px">If you didn't request this, ignore this email. Your password won't change.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#888;font-size:12px">Powered by <a href="https://vilaasalabs.com" style="color:#7c3aed">Vilaasalabs</a></p>
      </div>
      `,
    );
  }

  async sendBroadcast(toEmails: string[], subject: string, body: string): Promise<void> {
    for (const email of toEmails) {
      await this.send(
        email,
        subject,
        `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
          ${body}
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#888;font-size:12px">Sent via <a href="https://vilaasalabs.com" style="color:#7c3aed">Vilaasalabs</a></p>
        </div>
        `,
      );
    }
  }

  async sendPaymentSuccess(
    institutionName: string,
    adminEmail: string,
    plan: string,
    amount: number,
    expiresAt: Date,
  ): Promise<void> {
    await this.send(
      adminEmail,
      `Payment Confirmed — EduVilaasa ${plan.toUpperCase()} Plan`,
      `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
        <h2 style="color:#22c55e">✅ Payment Successful</h2>
        <p>Hi,</p>
        <p>Payment for <strong>${institutionName}</strong> was successful.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <tr><td style="padding:8px;color:#888">Plan</td><td style="padding:8px;font-weight:600">${plan.toUpperCase()}</td></tr>
          <tr><td style="padding:8px;color:#888">Amount Paid</td><td style="padding:8px;font-weight:600">₹${amount}</td></tr>
          <tr><td style="padding:8px;color:#888">Valid Until</td><td style="padding:8px;font-weight:600">${expiresAt.toDateString()}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#888;font-size:12px">Powered by <a href="https://vilaasalabs.com" style="color:#7c3aed">Vilaasalabs</a></p>
      </div>
      `,
    );
  }
}
