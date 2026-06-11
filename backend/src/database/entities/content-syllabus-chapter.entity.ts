import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ContentPack } from './content-pack.entity';
import { ContentSyllabusNote } from './content-syllabus-note.entity';

@Entity('content_syllabus_chapters')
export class ContentSyllabusChapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pack_id: string;

  @ManyToOne(() => ContentPack)
  @JoinColumn({ name: 'pack_id' })
  pack: ContentPack;

  @Column({ type: 'int' })
  chapter_number: number;

  @Column()
  chapter_name: string;

  @Column({ type: 'jsonb', nullable: true })
  topics: string[];

  @Column({ type: 'jsonb', nullable: true })
  learning_outcomes: string[];

  @OneToMany(() => ContentSyllabusNote, (n) => n.chapter)
  notes: ContentSyllabusNote[];

  @CreateDateColumn()
  created_at: Date;
}
