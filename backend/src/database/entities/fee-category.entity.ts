import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Institution } from './institution.entity';

export enum FeeFrequency {
  ANNUAL   = 'annual',
  TERM     = 'term',
  MONTHLY  = 'monthly',
  ONE_TIME = 'one_time',
}

@Entity('fee_categories')
export class FeeCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institution_id: string;

  @ManyToOne(() => Institution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institution_id' })
  institution: Institution;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: FeeFrequency, default: FeeFrequency.ANNUAL })
  frequency: FeeFrequency;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
