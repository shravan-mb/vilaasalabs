import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Institution } from './institution.entity';
import { ContentBoard } from './content-board.entity';

@Entity('institution_content_access')
@Unique(['institution_id', 'board_id'])
export class InstitutionContentAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institution_id: string;

  @Column()
  board_id: string;

  @Column({ default: true })
  is_enabled: boolean;

  @Column({ nullable: true })
  enabled_by: string;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: 'institution_id' })
  institution: Institution;

  @ManyToOne(() => ContentBoard)
  @JoinColumn({ name: 'board_id' })
  board: ContentBoard;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
