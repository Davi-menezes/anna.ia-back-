import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { StudyPlanSubject } from './StudyPlanSubject';
import { WeeklySchedule } from './WeeklySchedule';

@Entity('study_plans')
export class StudyPlan {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ type: 'varchar', length: 255 })
    targetVestibular!: string;

    @Column({ type: 'integer' })
    availableTimePerDay!: number; // in minutes

    @Column({ type: 'simple-array' })
    studyDays!: string[]; // e.g., ['seg', 'ter', 'qua']

    @OneToMany(() => StudyPlanSubject, (subject) => subject.studyPlan, { cascade: true })
    subjects!: StudyPlanSubject[];

    @OneToMany(() => WeeklySchedule, (schedule) => schedule.studyPlan, { cascade: true })
    schedules!: WeeklySchedule[];

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt!: Date;
}
