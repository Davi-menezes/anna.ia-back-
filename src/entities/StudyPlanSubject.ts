import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StudyPlan } from './StudyPlan';

@Entity('study_plan_subjects')
export class StudyPlanSubject {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => StudyPlan, (plan) => plan.subjects)
    @JoinColumn({ name: 'study_plan_id' })
    studyPlan!: StudyPlan;

    @Column({ type: 'varchar', length: 255 })
    subjectName!: string;

    @Column({ type: 'integer', default: 1 })
    level!: number; // 1-5 (beginner to advanced)

    @Column({ type: 'integer', default: 1 })
    priority!: number; // Calculated based on weaknesses

    @Column({ type: 'jsonb', nullable: true })
    errorPatterns?: any; // To store AI analysis of user mistakes
}
