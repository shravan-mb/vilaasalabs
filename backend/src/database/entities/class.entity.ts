import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Institution } from './institution.entity';
import { Subject } from './subject.entity';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institution_id: string;

  @ManyToOne(() => Institution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institution_id' })
  institution: Institution;

  @Column()
  name: string;

  @Column({ nullable: true })
  section: string;

  @Column({ nullable: true })
  academic_year: string;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => Subject, (sub) => sub.class)
  subjects: Subject[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
