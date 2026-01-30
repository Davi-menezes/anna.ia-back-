import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { StudyPlan } from './StudyPlan';
import { ChatMessage } from './ChatMessage';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

export enum UserStatus {
  CREATED = 'created',
  VERIFIED = 'verified',
  PREMIUM = 'premium'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  password?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'google_id' })
  googleId?: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'profile_picture' })
  profilePicture?: string;

  @Column({ type: 'date', nullable: true, name: 'birth_date' })
  birthDate?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  education?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true, name: 'main_goal' })
  mainGoal?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 5.0, name: 'credits' })
  credits!: number;

  @Column({ type: 'boolean', default: false, name: 'free_simulado_used' })
  freeSimuladoUsed!: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'free_simulado_used_at' })
  freeSimuladoUsedAt?: Date;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.CREATED
  })
  status!: UserStatus;

  @Column({ type: 'boolean', default: false, name: 'is_email_verified' })
  isEmailVerified!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'email_verification_token' })
  emailVerificationToken?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'email_verification_expires' })
  emailVerificationExpires?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'password_reset_token' })
  passwordResetToken?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'password_reset_expires' })
  passwordResetExpires?: Date;

  @OneToMany(() => StudyPlan, studyPlan => studyPlan.user)
  studyPlans!: StudyPlan[]; // Changed from OneToOne to OneToMany

  @OneToMany(() => ChatMessage, chatMessage => chatMessage.user)
  chatMessages!: ChatMessage[]; // Added chatMessages relationship

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt!: Date;

  generateEmailVerificationToken(): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = token;
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return token;
  }

  generatePasswordResetToken(): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = token;
    this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return token;
  }

  async setPassword(newPassword: string): Promise<void> {
    this.password = await bcrypt.hash(newPassword, 10);
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
  }

  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }
}
