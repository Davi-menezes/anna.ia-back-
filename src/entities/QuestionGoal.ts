import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('question_goals')
@Index(['user', 'goalDate'], { unique: true })
export class QuestionGoal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  @Index()
  user!: User;

  @Column({ type: 'date', name: 'goal_date' })
  goalDate!: string;

  @Column({ type: 'int', name: 'target_questions', default: 0 })
  targetQuestions!: number;

  @Column({ type: 'int', name: 'completed_questions', default: 0 })
  completedQuestions!: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt!: Date;
}
