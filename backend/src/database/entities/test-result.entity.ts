import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('test_results')
@Unique(['test_id', 'student_id'])
export class TestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institution_id: string;

  @Column()
  test_id: string;

  @Column()
  student_id: string;

  @Column('decimal', { precision: 6, scale: 2 })
  score: number;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
