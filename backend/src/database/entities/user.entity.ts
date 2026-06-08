import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Institution } from './institution.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // null for vilaasalabs internal staff (super admin / dev)
  @Column({ nullable: true })
  institution_id: string | null;

  @ManyToOne(() => Institution, (inst) => inst.users, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institution_id' })
  institution: Institution | null;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @Column()
  name: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string | null;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  class_id: string;

  // Proctor / reporting teacher assigned to this student
  @Column({ type: 'uuid', nullable: true })
  proctor_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'proctor_id' })
  proctor: User | null;

  @Column()
  password_hash: string;

  @Column({ nullable: true })
  profile_photo_url: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  last_login_at: Date;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  teaching_subjects: Array<{ class_id: string; class_name: string; subject_id: string; subject_name: string }>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
