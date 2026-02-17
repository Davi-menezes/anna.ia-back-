import { Request, Response } from 'express';
import { User } from '../entities/User';
import AppDataSource from '../config/data-source';
import { logger } from '../utils/logger';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';

// CUSTO ESTIMADO CHAT:
// Gemini 1.5 Flash: ~$0.00075 por 1.000 tokens (input)
// Gemini 1.5 Flash: ~$0.0015 por 1.000 tokens (output)
// Prompt médio: ~300 tokens
// Resposta média: ~800 tokens
// Histórico: ~400 tokens (8 mensagens anteriores)
// Custo por conversa: ~$0.002

export const generateChatResponse = async (req: Request, res: Response) => {
  try {
    const { prompt, history = [] } = req.body;
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

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'O prompt é obrigatório'
      });
    }

    const userRepository = AppDataSource.getRepository(User);

    // VERIFICAR CRÉDITOS - CHAT CUSTA 1 CRÉDITO
    const currentUser = await userRepository.findOneBy({ id: user.id });
    if (!currentUser || currentUser.credits < 1) {
      return res.status(400).json({
        success: false,
        message: 'Créditos insuficientes para chat (1 crédito necessário)'
      });
    }

    // Preparar contexto com histórico
    const context = history.map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    // Adicionar prompt atual
    context.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    // Chamada à API Gemini
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: context,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      logger.error('Gemini API error:', errorText);
      throw new Error(`Erro na API Gemini: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json() as any;
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Resposta vazia da Gemini API');
    }

    // Deduzir 1 crédito
    await userRepository.update(user.id, {
      credits: currentUser.credits - 1
    });

    logger.info(`Chat gerado - Usuário: ${user.id} - Créditos restantes: ${currentUser.credits - 1}`);

    res.json({
      success: true,
      data: {
        response: text,
        creditsRemaining: currentUser.credits - 1,
        costInfo: {
          creditsUsed: 1,
          creditsRemaining: currentUser.credits - 1,
          realCost: '$0.002',
          inputTokens: 700, // estimado
          outputTokens: 800, // estimado
          totalTokens: 1500, // estimado
          costPerToken: '$0.0000013',
          viability: 'EXTREMELY LUCRATIVO'
        }
      }
    });

  } catch (error) {
    logger.error('Erro ao gerar resposta do chat:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar resposta do chat'
    });
  }
};

export const getChatCostAnalysis = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        services: [
          {
            name: 'Flashcards (10 cards)',
            credits: 0.5,
            realCost: '$0.001',
            inputTokens: 200,
            outputTokens: 500,
            totalTokens: 700,
            margin: '99.999%',
            monthlyCost: '$0.03'
          },
          {
            name: 'Chat (conversa)',
            credits: 1,
            realCost: '$0.002',
            inputTokens: 700,
            outputTokens: 800,
            totalTokens: 1500,
            margin: '99.999%',
            monthlyCost: '$0.06'
          },
          {
            name: 'Simulado (30 questões)',
            credits: 1,
            realCost: '$0.000',
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            margin: '100%',
            monthlyCost: '$0.00'
          }
        ],
        businessModel: {
          pricePer100Credits: 'R$10,00',
          realCostPer100Credits: 'R$0,38',
          profit: 'R$9,62',
          profitMargin: '96.2%',
          scalability: 'INFINITA',
          risk: 'MINIMO'
        },
        projections: {
          users100: {
            revenue: 'R$1.000',
            costs: 'R$38',
            profit: 'R$962'
          },
          users1000: {
            revenue: 'R$10.000',
            costs: 'R$380',
            profit: 'R$9.620'
          },
          users10000: {
            revenue: 'R$100.000',
            costs: 'R$3.800',
            profit: 'R$96.200'
          }
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar análise de custos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar análise de custos'
    });
  }
};
