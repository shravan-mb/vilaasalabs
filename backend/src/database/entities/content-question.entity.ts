import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ContentPack } from './content-pack.entity';

@Entity('content_questions')
export class ContentQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pack_id: string;

  @ManyToOne(() => ContentPack)
  @JoinColumn({ name: 'pack_id' })
  pack: ContentPack;

  @Column({ type: 'text' })
  question_text: string;

  @Column({ default: 'mcq' })
  question_type: string;

  @Column({ type: 'jsonb', nullable: true })
  options: string[];

  @Column()
  correct_answer: string;

  @Column({ nullable: true, type: 'text' })
  explanation: string;

  @Column({ default: 'medium' })
  difficulty: string;

  @Column({ type: 'int', default: 1 })
  marks: number;

  @Column({ nullable: true })
  chapter: string;

  @CreateDateColumn()
  created_at: Date;
}
