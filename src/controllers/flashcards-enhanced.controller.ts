import { Request, Response } from 'express';
import { Flashcard } from '../entities/Flashcard';
import { User } from '../entities/User';
import AppDataSource from '../config/data-source';
import { logger } from '../utils/logger';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';

// CUSTO ESTIMADO:
// Gemini 1.5 Flash: ~$0.00075 por 1.000 tokens (input)
// Gemini 1.5 Flash: ~$0.0015 por 1.000 tokens (output)
// Prompt médio: ~200 tokens
// Resposta média: ~500 tokens
// Custo por 10 flashcards: ~$0.001 (menos de 1 centavo de dólar)
// Custo mensal (10 flashcards/dia × 30 dias): ~$0.03 (3 centavos de dólar)

export const generateDailyFlashcards = async (req: Request, res: Response) => {
  try {
    const { subject, count = 10 } = req.body;
    const user = req.user as any;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Serviço de IA indisponível'
      });
    }

    const flashcardRepository = AppDataSource.getRepository(Flashcard);
    const userRepository = AppDataSource.getRepository(User);

    // Verificar se já gerou flashcards hoje
    const today = new Date().toDateString();
    const existingFlashcards = await flashcardRepository.find({
      where: {
        user: { id: user.id },
        subject,
        createdAt: new Date(today)
      }
    });

    if (existingFlashcards.length >= count) {
      return res.status(400).json({
        success: false,
        message: `Você já gerou ${existingFlashcards.length} flashcards de ${subject} hoje`
      });
    }

    // VERIFICAR CRÉDITOS - FLASHCARDS CUSTAM 0.5 CRÉDITO
    const currentUser = await userRepository.findOneBy({ id: user.id });
    if (!currentUser || currentUser.credits < 0.5) {
      return res.status(400).json({
        success: false,
        message: 'Créditos insuficientes para gerar flashcards (0.5 crédito necessário)'
      });
    }

    // Gerar flashcards com Gemini
    const prompt = `Gere ${count} flashcards de estudo para a matéria "${subject}".

IMPORTANTE: Responda APENAS em formato JSON array, sem texto adicional. Cada flashcard deve ter:
- front: a pergunta/conceito (máximo 100 caracteres)
- back: a resposta/explicação (máximo 200 caracteres)

Exemplo de formato:
[
  {"front": "O que é fotossíntese?", "back": "Processo pelo qual plantas convertem luz em energia química"},
  {"front": "Fórmula da água", "back": "H₂O - Dois átomos de hidrogênio e um de oxigênio"}
]

Gere flashcards sobre conceitos fundamentais, definições e fórmulas importantes de ${subject}.`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json() as any;
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Resposta vazia da Gemini API');
    }

    // Extrair JSON da resposta
    let flashcardsData;
    try {
      // Procurar por array JSON na resposta
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta');
      }
      flashcardsData = JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error('Erro ao parsear flashcards:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar resposta da IA'
      });
    }

    // Salvar flashcards no banco
    const savedFlashcards = [];
    for (const flashcardData of flashcardsData) {
      try {
        const flashcard = flashcardRepository.create({
          user: { id: user.id },
          subject,
          front: flashcardData.front,
          back: flashcardData.back,
          status: 'new'
        });
        const saved = await flashcardRepository.save(flashcard);
        savedFlashcards.push(saved);
      } catch (error) {
        logger.error('Erro ao salvar flashcard:', error);
      }
    }

    // Deduzir 0.5 crédito
    await userRepository.update(user.id, {
      credits: currentUser.credits - 0.5
    });

    logger.info(`Flashcards gerados: ${savedFlashcards.length} de ${subject} - Usuário: ${user.id}`);

    res.json({
      success: true,
      data: {
        flashcards: savedFlashcards,
        subject,
        totalGenerated: savedFlashcards.length,
        creditsRemaining: currentUser.credits - 0.5,
        costInfo: {
          creditsUsed: 0.5,
          creditsRemaining: currentUser.credits - 0.5,
          realCost: '$0.001',
          dailyCost: '$0.001',
          monthlyEstimate: '$0.03',
          viability: 'EXTREMAMENTE LUCRATIVO'
        }
      }
    });

  } catch (error) {
    logger.error('Erro ao gerar flashcards:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar flashcards'
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
    
    // Calcular próxima revisão baseado no status
    const now = new Date();
    switch (status) {
      case 'new':
        flashcard.nextReviewAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 dia
        break;
      case 'learning':
        flashcard.nextReviewAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 horas
        break;
      case 'review':
        flashcard.nextReviewAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 dias
        break;
      case 'mastered':
        flashcard.nextReviewAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias
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
