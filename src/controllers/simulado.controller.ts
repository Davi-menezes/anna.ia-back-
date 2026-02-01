import { Request, Response } from 'express';
import { QuestionBank } from '../entities/QuestionBank';
import { User } from '../entities/User';
import AppDataSource from '../config/data-source';
import { logger } from '../utils/logger';

export const generateSimulado = async (req: Request, res: Response) => {
  try {
    const { subject } = req.params;
    const difficulty = (req.query.difficulty as string) || 'medium';
    const count = parseInt(req.query.count as string) || 30;
    const user = req.user as any;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Matéria é obrigatória'
      });
    }

    const questionRepository = AppDataSource.getRepository(QuestionBank);
    const userRepository = AppDataSource.getRepository(User);

    // Verificar se usuário tem créditos
    const currentUser = await userRepository.findOneBy({ id: user.id });
    if (!currentUser || currentUser.credits < 1) {
      return res.status(400).json({
        success: false,
        message: 'Créditos insuficientes para gerar simulado (1 crédito necessário)'
      });
    }

    // Buscar questões aleatórias
    const questions = await questionRepository
      .createQueryBuilder('question')
      .where('question.subject = :subject', { subject })
      .andWhere('question.difficulty = :difficulty', { difficulty })
      .orderBy('RANDOM()')
      .limit(count)
      .getMany();

    if (questions.length < count) {
      logger.warn(`Apenas ${questions.length} questões encontradas para ${subject}`);
    }

    // Deduzir crédito
    await userRepository.update(user.id, {
      credits: currentUser.credits - 1
    });

    // Formatar simulado
    const simulado = questions.map((q, index) => ({
      id: q.id,
      number: index + 1,
      question: q.question,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation,
      difficulty: q.difficulty,
      tags: q.tags
    }));

    logger.info(`Simulado gerado: ${subject} - ${questions.length} questões - Usuário: ${user.id}`);

    res.json({
      success: true,
      data: {
        simulado,
        subject,
        difficulty,
        totalQuestions: questions.length,
        creditsRemaining: currentUser.credits - 1,
        costInfo: {
          creditsUsed: 1,
          creditsRemaining: currentUser.credits - 1
        }
      }
    });

  } catch (error) {
    logger.error('Erro ao gerar simulado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar simulado'
    });
  }
};

export const getAvailableSubjects = async (req: Request, res: Response) => {
  try {
    const questionRepository = AppDataSource.getRepository(QuestionBank);
    
    const subjects = await questionRepository
      .createQueryBuilder('question')
      .select('DISTINCT question.subject', 'subject')
      .getRawMany();

    res.json({
      success: true,
      data: subjects.map(s => s.subject)
    });

  } catch (error) {
    logger.error('Erro ao buscar matérias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar matérias disponíveis'
    });
  }
};

export const getSimuladoStats = async (req: Request, res: Response) => {
  try {
    const questionRepository = AppDataSource.getRepository(QuestionBank);
    
    const stats = await questionRepository
      .createQueryBuilder('question')
      .select('question.subject', 'subject')
      .addSelect('COUNT(*)', 'total')
      .addSelect('COUNT(CASE WHEN question.difficulty = :easy THEN 1 END)', 'easy')
      .addSelect('COUNT(CASE WHEN question.difficulty = :medium THEN 1 END)', 'medium')
      .addSelect('COUNT(CASE WHEN question.difficulty = :hard THEN 1 END)', 'hard')
      .setParameter('easy', 'easy')
      .setParameter('medium', 'medium')
      .setParameter('hard', 'hard')
      .groupBy('question.subject')
      .getRawMany();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
};
