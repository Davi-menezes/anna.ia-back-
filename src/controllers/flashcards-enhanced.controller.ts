import { Request, Response } from 'express';
import { Flashcard } from '../entities/Flashcard';
import { User } from '../entities/User';
import AppDataSource from '../config/data-source';
import { logger } from '../utils/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';

export const generateFlashcards = async (req: Request, res: Response) => {
  try {
    const { subject, count = 10, topics } = req.body;
    const user = req.user as any;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Não autorizado' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'Serviço de IA indisponível' });
    }

    const flashcardRepository = AppDataSource.getRepository(Flashcard);
    const userRepository = AppDataSource.getRepository(User);

    const currentUser = await userRepository.findOneBy({ id: user.id });
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    // VERIFICAR LIMITE DIÁRIO (10 flashcards/dia)
    const today = new Date().toISOString().split('T')[0];
    if (currentUser.lastFlashcardGenDate === today && currentUser.flashcardsGenCount >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Limite diário de 10 flashcards atingido. Tente novamente amanhã.'
      });
    }

    // VERIFICAR CRÉDITOS - FLASHCARDS CUSTAM 0.5 CRÉDITO
    if (currentUser.credits < 0.5) {
      return res.status(400).json({
        success: false,
        message: 'Créditos insuficientes para gerar flashcards (0.5 crédito necessário)'
      });
    }

    // Configurar Gemini SDK
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    });

    // Gerar flashcards com Gemini
    let prompt = `Gere exatamente ${count} flashcards de estudo para a matéria "${subject || 'Geral'}".`;
    if (topics && topics.length > 0) {
      prompt += ` Foque nos tópicos: ${topics.join(', ')}.`;
    }
    prompt += `
      Responda APENAS em formato JSON array. Cada objeto deve ter:
      - "front": a pergunta ou conceito (máximo 100 caracteres)
      - "back": a resposta ou explicação (máximo 200 caracteres)
    `;

    logger.info(`Gerando ${count} flashcards para usuário ${user.id} (Hoje: ${currentUser.flashcardsGenCount})`);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text) {
      throw new Error('Resposta vazia da Gemini API');
    }

    // Extrair JSON
    let flashcardsData;
    try {
      flashcardsData = JSON.parse(text);
      if (!Array.isArray(flashcardsData)) {
        if (flashcardsData.flashcards && Array.isArray(flashcardsData.flashcards)) {
          flashcardsData = flashcardsData.flashcards;
        } else {
          throw new Error('Formato inválido');
        }
      }
    } catch (e) {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        flashcardsData = JSON.parse(match[0]);
      } else {
        throw new Error('Não foi possível processar a resposta da IA');
      }
    }

    // Salvar flashcards
    const savedFlashcards = [];
    for (const cardData of flashcardsData) {
      const card = flashcardRepository.create({
        user: { id: user.id },
        subject: subject || 'Geral',
        front: cardData.front,
        back: cardData.back,
        status: 'new'
      });
      const saved = await flashcardRepository.save(card);
      savedFlashcards.push(saved);
    }

    // Atualizar usuário: Dedução de créditos e incremento do contador diário
    const newGenCount = currentUser.lastFlashcardGenDate === today
      ? currentUser.flashcardsGenCount + savedFlashcards.length
      : savedFlashcards.length;

    await userRepository.update(user.id, {
      credits: Number(currentUser.credits) - 0.5,
      lastFlashcardGenDate: today,
      flashcardsGenCount: newGenCount
    });

    res.json({
      success: true,
      data: {
        flashcards: savedFlashcards,
        totalGeneratedToday: newGenCount,
        creditsRemaining: Number(currentUser.credits) - 0.5
      }
    });

  } catch (error: any) {
    logger.error('Erro ao gerar flashcards:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno ao gerar flashcards'
    });
  }
};

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
    const { subject, front, back } = req.body;

    if (!subject || !front || !back) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: subject, front, back'
      });
    }

    const repo = AppDataSource.getRepository(Flashcard);
    const card = repo.create({
      user: { id: user.id },
      subject,
      front,
      back,
      status: 'new'
    });

    await repo.save(card);

    res.status(201).json({ success: true, data: card });
  } catch (error) {
    logger.error('Error creating flashcard:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar flashcard' });
  }
};

export const updateFlashcardStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user as any;

    if (!['new', 'learning', 'review', 'mastered'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido'
      });
    }

    const flashcardRepository = AppDataSource.getRepository(Flashcard);

    const flashcard = await flashcardRepository.findOne({
      where: { id, user: { id: user.id } }
    });

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard não encontrado'
      });
    }

    flashcard.status = status;
    flashcard.lastReviewedAt = new Date();

    const now = new Date();
    switch (status) {
      case 'new':
        flashcard.nextReviewAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'learning':
        flashcard.nextReviewAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
        break;
      case 'review':
        flashcard.nextReviewAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        break;
      case 'mastered':
        flashcard.nextReviewAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
    }

    await flashcardRepository.save(flashcard);

    res.json({
      success: true,
      data: flashcard
    });

  } catch (error) {
    logger.error('Erro ao atualizar flashcard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar flashcard'
    });
  }
};
