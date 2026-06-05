import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('timetable_slots')
export class TimetableSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institution_id: string;

  @Column()
  class_id: string;

  @Column()
  subject_name: string;

  @Column({ nullable: true })
  teacher_id: string;

  @Column({ nullable: true })
  teacher_name: string;

  @Column({ type: 'int' })
  day_of_week: number;

  @Column()
  start_time: string;

  @Column()
  end_time: string;

  @CreateDateColumn()
  created_at: Date;
}
