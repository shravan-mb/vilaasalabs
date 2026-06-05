import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum MeetingRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

@Entity('meeting_requests')
export class MeetingRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institution_id: string;

  @Column()
  parent_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @Column()
  student_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column()
  proctor_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proctor_id' })
  proctor: User;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', nullable: true })
  proposed_date: string | null;

  @Column({ type: 'enum', enum: MeetingRequestStatus, default: MeetingRequestStatus.PENDING })
  status: MeetingRequestStatus;

  @Column({ type: 'text', nullable: true })
  response_note: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
