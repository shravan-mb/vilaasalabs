import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Institution } from './institution.entity';
import { User } from './user.entity';

export enum TestStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
}

@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institution_id: string;

  @ManyToOne(() => Institution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institution_id' })
  institution: Institution;

  @Column()
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  teacher: User;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true })
  class_id: string;

  // Array of question IDs included in the test
  @Column({ type: 'jsonb', default: [] })
  question_ids: string[];

  @Column({ type: 'int', default: 0 })
  total_marks: number;

  @Column({ type: 'int', nullable: true })
  duration_minutes: number;

  @Column({ type: 'enum', enum: TestStatus, default: TestStatus.DRAFT })
  status: TestStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
