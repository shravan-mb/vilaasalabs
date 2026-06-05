import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institution_id: string;

  @Column()
  title: string;

  @Column('text')
  body: string;

  @Column({ nullable: true })
  target_class_id: string;

  @Column({ nullable: true })
  target_role: string;

  @Column({ nullable: true })
  created_by: string;

  @Column({ nullable: true })
  created_by_name: string;

  @CreateDateColumn()
  created_at: Date;
}
