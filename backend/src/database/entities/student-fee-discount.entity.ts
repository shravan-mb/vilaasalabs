import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FeeCategory } from './fee-category.entity';
import { Institution } from './institution.entity';
import { User } from './user.entity';

@Entity('student_fee_discounts')
export class StudentFeeDiscount {
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
  discount_amount: number;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', nullable: true })
  approved_by: string | null;

  @CreateDateColumn()
  created_at: Date;
}
