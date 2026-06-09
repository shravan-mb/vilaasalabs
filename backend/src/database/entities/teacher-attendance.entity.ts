import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Institution } from './institution.entity';
import { User } from './user.entity';

export enum TeacherAttendanceStatus {
  PRESENT   = 'present',
  ABSENT    = 'absent',
  LATE      = 'late',
  HALF_DAY  = 'half_day',
  LEAVE     = 'leave',
}

export enum TeacherAttendanceSource {
  MANUAL  = 'manual',
  BIOMETRIC = 'biometric',
}

@Entity('teacher_attendance')
export class TeacherAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institution_id: string;

  @ManyToOne(() => Institution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institution_id' })
  institution: Institution;

  @Column()
  teacher_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: TeacherAttendanceStatus, default: TeacherAttendanceStatus.PRESENT })
  status: TeacherAttendanceStatus;

  @Column({ nullable: true })
  check_in_time: string;

  @Column({ nullable: true })
  check_out_time: string;

  @Column({ nullable: true })
  remarks: string;

  @Column({ type: 'enum', enum: TeacherAttendanceSource, default: TeacherAttendanceSource.MANUAL })
  source: TeacherAttendanceSource;

  @Column({ nullable: true })
  marked_by_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'marked_by_id' })
  marked_by: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
