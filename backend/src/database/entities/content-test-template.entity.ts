import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ContentPack } from './content-pack.entity';

@Entity('content_test_templates')
export class ContentTestTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pack_id: string;

  @ManyToOne(() => ContentPack)
  @JoinColumn({ name: 'pack_id' })
  pack: ContentPack;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'int', default: 10 })
  total_questions: number;

  @Column({ type: 'int', default: 10 })
  total_marks: number;

  @Column({ type: 'int', default: 30 })
  duration_minutes: number;

  @Column({ type: 'jsonb', nullable: true })
  question_ids: string[];

  @CreateDateColumn()
  created_at: Date;
}
