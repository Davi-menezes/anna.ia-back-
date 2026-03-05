import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { StudyPlan } from './StudyPlan';

@Entity('weekly_schedules')
export class WeeklySchedule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => StudyPlan, (plan) => plan.schedules)
    @JoinColumn({ name: 'study_plan_id' })
    studyPlan!: StudyPlan;

    @Column({ type: 'date' })
    startDate!: Date;

    @Column({ type: 'date' })
    endDate!: Date;

    @Column({ type: 'jsonb' })
    content!: any; // Detalhes do plano semanal gerado pela IA

    @Column({ type: 'boolean', default: false })
    isActive!: boolean;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;
}
