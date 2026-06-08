import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FeeCategory } from './fee-category.entity';
import { Institution } from './institution.entity';
import { User } from './user.entity';

@Entity('fee_payments')
export class FeePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institution_id: string;

  @ManyToOne(() => Institution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institution_id' })
  institution: Institution;

  @Column()
  student_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column()
  fee_category_id: string;

  @ManyToOne(() => FeeCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fee_category_id' })
  fee_category: FeeCategory;

  @Column({ nullable: true })
  academic_year_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount_paid: number;

  @Column({ type: 'date' })
  payment_date: string;

  // cash only for now; extend later for online/cheque/dd
  @Column({ default: 'cash' })
  payment_mode: string;

  @Column({ unique: true })
  receipt_number: string;

  @Column({ nullable: true })
  collected_by: string;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  created_at: Date;
}
