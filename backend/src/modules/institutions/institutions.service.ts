import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { SubscriptionPlan, SubscriptionStatus, TRIAL_DURATION_DAYS } from '../../common/enums/subscription-plan.enum';
import { Institution } from '../../database/entities/institution.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { User } from '../../database/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepo: Repository<Institution>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  async onboard(dto: CreateInstitutionDto): Promise<{ institution: Institution; admin: Partial<User> }> {
    const existingEmail = await this.institutionRepo.findOne({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('An institution with this email already exists');

    const existingSubdomain = await this.institutionRepo.findOne({ where: { subdomain: dto.subdomain } });
    if (existingSubdomain) throw new ConflictException('This subdomain is already taken');

    this.authService.validatePasswordStrength(dto.admin_password);

    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + TRIAL_DURATION_DAYS);

    const institution = this.institutionRepo.create({
      name: dto.name,
      type: dto.type,
      subdomain: dto.subdomain,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      principal_name: dto.principal_name,
      registration_number: dto.registration_number,
      subscription_plan: SubscriptionPlan.TRIAL,
      subscription_status: SubscriptionStatus.TRIAL,
      subscription_expires_at: trialExpiry,
    });

    const savedInstitution = await this.institutionRepo.save(institution);

    const passwordHash = await this.authService.hashPassword(dto.admin_password);
    const admin = this.userRepo.create({
      institution_id: savedInstitution.id,
      role: Role.INSTITUTION_ADMIN,
      name: dto.admin_name,
      email: dto.email,
      password_hash: passwordHash,
    });
    const savedAdmin = await this.userRepo.save(admin);

    // Create trial subscription record
    await this.subscriptionRepo.save(
      this.subscriptionRepo.create({
        institution_id: savedInstitution.id,
        plan: SubscriptionPlan.TRIAL,
        status: SubscriptionStatus.TRIAL,
        started_at: new Date(),
        expires_at: trialExpiry,
      }),
    );

    // Fire-and-forget welcome email
    if (savedAdmin.email) this.mailService.sendWelcome(savedInstitution.name, savedAdmin.email, savedAdmin.name);

    const { password_hash: _, ...adminWithoutPassword } = savedAdmin;
    return { institution: savedInstitution, admin: adminWithoutPassword };
  }

  async findAll(): Promise<Institution[]> {
    return this.institutionRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Institution> {
    const institution = await this.institutionRepo.findOne({
      where: { id },
      relations: { subscriptions: true },
    });
    if (!institution) throw new NotFoundException('Institution not found');
    return institution;
  }

  async findBySubdomain(subdomain: string): Promise<Institution> {
    const institution = await this.institutionRepo.findOne({ where: { subdomain } });
    if (!institution) throw new NotFoundException('Institution not found');
    return institution;
  }

  async toggleActive(id: string): Promise<Institution> {
    const institution = await this.findOne(id);
    institution.is_active = !institution.is_active;
    return this.institutionRepo.save(institution);
  }

  async remove(id: string): Promise<void> {
    const institution = await this.findOne(id);
    await this.institutionRepo.remove(institution);
  }

  async getSettings(id: string): Promise<{ feature_flags: Record<string, boolean> }> {
    const inst = await this.institutionRepo.findOne({ where: { id }, select: { feature_flags: true } });
    if (!inst) throw new NotFoundException('Institution not found');
    const defaults: Record<string, boolean> = { show_subscription_tab: true };
    return { feature_flags: { ...defaults, ...(inst.feature_flags ?? {}) } };
  }

  async updateFeatureFlags(id: string, flags: Record<string, boolean>): Promise<void> {
    const inst = await this.institutionRepo.findOne({ where: { id } });
    if (!inst) throw new NotFoundException('Institution not found');
    inst.feature_flags = { ...(inst.feature_flags ?? {}), ...flags };
    await this.institutionRepo.save(inst);
  }
}
