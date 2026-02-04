import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { StudyPlan } from '../entities/StudyPlan';
import { StudyPlanSubject } from '../entities/StudyPlanSubject';
import { WeeklySchedule } from '../entities/WeeklySchedule';
import { ChatMessage } from '../entities/ChatMessage';
import { Flashcard } from '../entities/Flashcard';
import { QuestionGoal } from '../entities/QuestionGoal';
import { QuestionBank } from '../entities/QuestionBank';

dotenv.config({
  path: path.resolve(
    process.cwd(),
    process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
  ),
});

// fallback (muitos projetos usam apenas ".env")
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

const isProduction = process.env.NODE_ENV === 'production';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || 'localhost'),
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DATABASE_URL ? undefined : (process.env.DB_USERNAME || 'postgres'),
  password: process.env.DATABASE_URL ? undefined : (process.env.DB_PASSWORD || 'postgres'),
  database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || 'postgres'),
  synchronize: false,
  logging: !isProduction,
  entities: [User, StudyPlan, StudyPlanSubject, WeeklySchedule, ChatMessage, Flashcard, QuestionGoal, QuestionBank],
  migrations: [path.resolve(__dirname, '..', 'migrations', '*.{ts,js}')],
  subscribers: [],
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

export default AppDataSource;