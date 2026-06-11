import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ContentSyllabusChapter } from './content-syllabus-chapter.entity';

@Entity('content_syllabus_notes')
export class ContentSyllabusNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  chapter_id: string;

  @ManyToOne(() => ContentSyllabusChapter, (c) => c.notes)
  @JoinColumn({ name: 'chapter_id' })
  chapter: ContentSyllabusChapter;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  order_index: number;

  @CreateDateColumn()
  created_at: Date;
}
