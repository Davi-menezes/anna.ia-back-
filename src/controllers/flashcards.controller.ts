import { Request, Response } from 'express';
import AppDataSource from '../config/data-source';
import { Flashcard } from '../entities/Flashcard';
import { User } from '../entities/User';
import { logger } from '../utils/logger';

export const listFlashcards = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const repo = AppDataSource.getRepository(Flashcard);

    const subject = (req.query.subject as string) || undefined;

    const where: any = { user: { id: user.id } };
    if (subject) where.subject = subject;

    const cards = await repo.find({
      where,
      order: { updatedAt: 'DESC' as any },
      relations: ['user'],
    });

    res.status(200).json({ success: true, data: cards });
  } catch (error) {
    logger.error('Error listing flashcards:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar flashcards' });
  }
};

export const createFlashcard = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { front, back, subject } = req.body;

    if (!front || !back) {
      return res.status(400).json({ success: false, message: 'Campos front e back são obrigatórios' });
    }

    const repo = AppDataSource.getRepository(Flashcard);
    const userRepo = AppDataSource.getRepository(User);

    const existingUser = await userRepo.findOne({ where: { id: user.id } });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    const card = repo.create({
      user: existingUser,
      subject,
      front,
      back,
      status: 'new',
    });

    const saved = await repo.save(card);
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    logger.error('Error creating flashcard:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar flashcard' });
  }
};

export const updateFlashcard = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { front, back, subject, status } = req.body;

    const repo = AppDataSource.getRepository(Flashcard);
    const card = await repo.findOne({ where: { id, user: { id: user.id } }, relations: ['user'] });

    if (!card) {
      return res.status(404).json({ success: false, message: 'Flashcard não encontrado' });
    }

    if (typeof front === 'string') card.front = front;
    if (typeof back === 'string') card.back = back;
    if (typeof subject === 'string' || subject === null) card.subject = subject || undefined;
    if (status === 'new' || status === 'learning' || status === 'review') card.status = status;

    const saved = await repo.save(card);
    res.status(200).json({ success: true, data: saved });
  } catch (error) {
    logger.error('Error updating flashcard:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar flashcard' });
  }
};

export const deleteFlashcard = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Flashcard);
    const card = await repo.findOne({ where: { id, user: { id: user.id } }, relations: ['user'] });

    if (!card) {
      return res.status(404).json({ success: false, message: 'Flashcard não encontrado' });
    }

    await repo.remove(card);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error deleting flashcard:', error);
    res.status(500).json({ success: false, message: 'Erro ao deletar flashcard' });
  }
};

export const reviewFlashcard = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { quality } = req.body;

    const repo = AppDataSource.getRepository(Flashcard);
    const card = await repo.findOne({ where: { id, user: { id: user.id } }, relations: ['user'] });

    if (!card) {
      return res.status(404).json({ success: false, message: 'Flashcard não encontrado' });
    }

    // Heurística simples de repetição espaçada: qualidade 0-5 define o próximo intervalo de revisão.
    const q = Number(quality);
    const now = new Date();
    card.lastReviewedAt = now;

    const days = !Number.isFinite(q)
      ? 1
      : q >= 4
        ? 7
        : q >= 3
          ? 3
          : 1;

    card.nextReviewAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    card.status = q >= 4 ? 'review' : 'learning';

    const saved = await repo.save(card);
    res.status(200).json({ success: true, data: saved });
  } catch (error) {
    logger.error('Error reviewing flashcard:', error);
    res.status(500).json({ success: false, message: 'Erro ao registrar revisão' });
  }
};
