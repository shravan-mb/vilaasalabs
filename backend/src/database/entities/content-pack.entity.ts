import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ContentBoard } from './content-board.entity';

@Entity('content_packs')
export class ContentPack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  board_id: string;

  @ManyToOne(() => ContentBoard)
  @JoinColumn({ name: 'board_id' })
  board: ContentBoard;

  @Column({ type: 'int' })
  standard: number;

  @Column()
  subject: string;

  @Column({ default: false })
  is_published: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
