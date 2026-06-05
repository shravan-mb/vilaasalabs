import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Institution } from './institution.entity';

export enum QuestionType {
  MCQ = 'mcq',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Entity('questions')
export class Question {
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
  subject: string;

  @Column({ nullable: true })
  topic: string;

  @Column({ type: 'text' })
  question_text: string;

  @Column({ type: 'enum', enum: QuestionType, default: QuestionType.MCQ })
  type: QuestionType;

  // For MCQ: array of options e.g. ["Option A", "Option B", "Option C", "Option D"]
  @Column({ type: 'jsonb', nullable: true })
  options: string[];

  @Column({ type: 'text' })
  correct_answer: string;

  @Column({ type: 'enum', enum: DifficultyLevel, default: DifficultyLevel.MEDIUM })
  difficulty: DifficultyLevel;

  // Tags for filtering e.g. ["chapter-1", "algebra"]
  @Column({ type: 'jsonb', nullable: true, default: [] })
  tags: string[];

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
