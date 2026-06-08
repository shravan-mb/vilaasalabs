import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Class } from './class.entity';
import { FeeCategory } from './fee-category.entity';
import { Institution } from './institution.entity';

@Entity('class_fee_structures')
export class ClassFeeStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institution_id: string;

  @ManyToOne(() => Institution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institution_id' })
  institution: Institution;

  @Column()
  class_id: string;

  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column()
  fee_category_id: string;

  @ManyToOne(() => FeeCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fee_category_id' })
  fee_category: FeeCategory;

  @Column({ nullable: true })
  academic_year_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  due_date: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
