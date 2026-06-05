import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { InstitutionType } from '../../common/enums/institution-type.enum';
import { SubscriptionPlan, SubscriptionStatus } from '../../common/enums/subscription-plan.enum';
import { User } from './user.entity';
import { Subscription } from './subscription.entity';

@Entity('institutions')
export class Institution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'enum', enum: InstitutionType, default: InstitutionType.SCHOOL })
  type: InstitutionType;

  @Column({ unique: true })
  subdomain: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  pincode: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ nullable: true })
  principal_name: string;

  @Column({ type: 'enum', enum: SubscriptionPlan, default: SubscriptionPlan.TRIAL })
  subscription_plan: SubscriptionPlan;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.TRIAL })
  subscription_status: SubscriptionStatus;

  @Column({ type: 'timestamp', nullable: true })
  subscription_expires_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => User, (user) => user.institution)
  users: User[];

  @OneToMany(() => Subscription, (sub) => sub.institution)
  subscriptions: Subscription[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
