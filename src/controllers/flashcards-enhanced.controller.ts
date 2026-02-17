import { Request, Response } from 'express';
import { Flashcard } from '../entities/Flashcard';
import { User } from '../entities/User';
import AppDataSource from '../config/data-source';
import { logger } from '../utils/logger';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Direct REST v1 API call (avoids SDK compatibility issues)
async function callGeminiV1(apiKey: string, model: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    })
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini v1 error (${response.status}): ${raw}`);
  }

  const data = JSON.parse(raw);
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') || '';
  return text;
}

async function listGeminiV1Models(apiKey: string): Promise<Array<{ name?: string; supportedGenerationMethods?: string[] }>> {
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { method: 'GET' });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini v1 listModels error (${res.status}): ${raw}`);
  }
  const data = JSON.parse(raw);
  return Array.isArray(data?.models) ? data.models : [];
}

function pickGeminiV1Model(models: Array<{ name?: string; supportedGenerationMethods?: string[] }>): string {
  const supported = models
    .map(m => ({
      name: (m.name || '').replace(/^models\//, ''),
      methods: m.supportedGenerationMethods || [],
    }))
    .filter(m => m.name && m.methods.includes('generateContent'))
    .map(m => m.name);

  const preferred = supported.find(n => n.includes('flash')) || supported[0];
  if (!preferred) {
    throw new Error('Gemini v1: nenhum modelo com generateContent encontrado.');
  }
  return preferred;
}

async function callGeminiV1AutoModel(apiKey: string, model: string, prompt: string): Promise<string> {
  try {
    return await callGeminiV1(apiKey, model, prompt);
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (!msg.includes('Gemini v1 error (404)')) {
      throw err;
    }
    logger.warn(`Flashcards: model ${model} not found. Attempting ListModels fallback.`);
    const models = await listGeminiV1Models(apiKey);
    const fallbackModel = pickGeminiV1Model(models);
    logger.info(`Flashcards: using fallback model: ${fallbackModel}`);
    return await callGeminiV1(apiKey, fallbackModel, prompt);
  }
}

export const generateFlashcards = async (req: Request, res: Response) => {
  try {
    // Agora aceita um array de requests específicos ou usa o fallback antigo
    const { flashcardRequests, subject, count = 10, topics } = req.body;
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

    // Construção do Prompt Avançado
    let prompt = '';

    if (flashcardRequests && Array.isArray(flashcardRequests) && flashcardRequests.length > 0) {
      // Modo Novo: Inputs Mistos
      prompt = `Gere exatamente ${flashcardRequests.length} flashcards de estudo seguindo estritamente esta lista de tópicos:\n`;

      flashcardRequests.forEach((r: any, index: number) => {
        const subjectText = r.subject ? `Matéria: "${r.subject}"` : 'Matéria: Variedades/Curiosidades Gerais (Aleatório)';
        const topicText = r.topic ? `, Tópico: "${r.topic}"` : '';
        prompt += `${index + 1}. ${subjectText}${topicText}\n`;
      });

      prompt += `\nPara os itens marcados como Aleatório, escolha temas acadêmicos ou de conhecimentos gerais interessantes.`;
    } else {
      // Fallback Modo Antigo
      prompt = `Gere exatamente ${count} flashcards de estudo para a matéria "${subject || 'Geral (Aleatório)'}".`;
      if (topics && topics.length > 0) {
        prompt += ` Foque nos tópicos: ${topics.join(', ')}.`;
      }
    }

    prompt += `
      Responda APENAS em formato JSON array. Cada objeto deve ter:
      - "front": a pergunta ou conceito (máximo 100 caracteres)
      - "back": a resposta ou explicação (máximo 200 caracteres)
      - "subject": a matéria do card (se for aleatório, defina uma apropriada)
    `;

    logger.info(`Gerando flashcards para usuário ${user.id} (Model: ${GEMINI_MODEL})`);

    const text = await callGeminiV1AutoModel(GEMINI_API_KEY, GEMINI_MODEL, prompt);

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
        logger.error('Falha ao fazer parse do JSON da Gemini:', text);
        throw new Error('Não foi possível processar a resposta da IA');
      }
    }

    // Salvar flashcards
    const savedFlashcards = [];
    // Se usamos o modo requests, tentamos alinhar os subjects retornados
    const requestSubjectMap = flashcardRequests && Array.isArray(flashcardRequests) ? flashcardRequests : [];

    for (let i = 0; i < flashcardsData.length; i++) {
      const cardData = flashcardsData[i];
      // Tenta pegar o subject do request original se disponível e não vazio, senão usa o retornado pela IA ou o geral
      let finalSubject = cardData.subject; // Prioridade 1: IA definiu (útil para aleatórios)

      if (requestSubjectMap[i] && requestSubjectMap[i].subject) {
        finalSubject = requestSubjectMap[i].subject; // Prioridade 2: User forçou este subject
      } else if (!finalSubject) {
        finalSubject = subject || 'Geral'; // Fallback
      }

      const card = flashcardRepository.create({
        user: { id: user.id },
        subject: finalSubject,
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
