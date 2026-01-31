import { Request, Response } from 'express';
import AppDataSource from '../config/data-source';
import { QuestionGoal } from '../entities/QuestionGoal';
import { User } from '../entities/User';
import { logger } from '../utils/logger';

function todayISODate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const getTodayGoal = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const repo = AppDataSource.getRepository(QuestionGoal);

    const goalDate = todayISODate();

    let goal = await repo.findOne({ where: { user: { id: user.id }, goalDate }, relations: ['user'] });
    if (!goal) {
      goal = repo.create({ user: { id: user.id }, goalDate, targetQuestions: 0, completedQuestions: 0 });
    }

    // For now, keep the existing completedQuestions value
    // TODO: Calculate from actual simulado responses when we implement tracking

    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    logger.error('Error getting today goal:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar meta do dia' });
  }
};

export const setTodayGoal = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { targetQuestions } = req.body;

    const target = Number(targetQuestions);
    if (!Number.isFinite(target) || target < 0) {
      return res.status(400).json({ success: false, message: 'targetQuestions deve ser um número >= 0' });
    }

    const repo = AppDataSource.getRepository(QuestionGoal);
    const userRepo = AppDataSource.getRepository(User);

    const existingUser = await userRepo.findOne({ where: { id: user.id } });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    const goalDate = todayISODate();

    let goal = await repo.findOne({ where: { user: { id: user.id }, goalDate }, relations: ['user'] });
    if (!goal) {
      goal = repo.create({ user: existingUser, goalDate, targetQuestions: target, completedQuestions: 0 });
    } else {
      goal.targetQuestions = target;
      // keep completedQuestions
    }

    const saved = await repo.save(goal);
    res.status(200).json({ success: true, data: saved });
  } catch (error) {
    logger.error('Error setting today goal:', error);
    res.status(500).json({ success: false, message: 'Erro ao definir meta do dia' });
  }
};

export const incrementTodayProgress = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { amount } = req.body;

    const inc = Number(amount);
    if (!Number.isFinite(inc) || inc <= 0) {
      return res.status(400).json({ success: false, message: 'amount deve ser um número > 0' });
    }

    const repo = AppDataSource.getRepository(QuestionGoal);
    const userRepo = AppDataSource.getRepository(User);

    const existingUser = await userRepo.findOne({ where: { id: user.id } });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    const goalDate = todayISODate();
    let goal = await repo.findOne({ where: { user: { id: user.id }, goalDate }, relations: ['user'] });
    if (!goal) {
      goal = repo.create({ user: existingUser, goalDate, targetQuestions: 0, completedQuestions: 0 });
    }

    goal.completedQuestions = Math.max(0, (goal.completedQuestions || 0) + inc);

    const saved = await repo.save(goal);
    res.status(200).json({ success: true, data: saved });
  } catch (error) {
    logger.error('Error incrementing today progress:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar progresso' });
  }
};
