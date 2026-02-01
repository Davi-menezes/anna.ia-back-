import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('question_bank')
export class QuestionBank {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text', array: true })
  options: string[];

  @Column({ type: 'integer' })
  correctAnswerIndex: number;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'medium',
    enum: ['easy', 'medium', 'hard']
  })
  difficulty: 'easy' | 'medium' | 'hard';

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
