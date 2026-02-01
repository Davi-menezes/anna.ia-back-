import { Request, Response } from 'express';
import { StudyPlan } from '../entities/StudyPlan';
import { User } from '../entities/User';
import AppDataSource from '../config/data-source';
import { logger } from '../utils/logger';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';

export const generateWeeklyStudyPlan = async (req: Request, res: Response) => {
  try {
    const { subjects, goals, availableHours } = req.body;
    const user = req.user as any;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    // VERIFICAR CRÉDITOS - PLANO DE ESTUDOS CUSTA 2 CRÉDITOS
    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOneBy({ id: user.id });
    
    if (!currentUser || currentUser.credits < 2) {
      return res.status(400).json({
        success: false,
        message: 'Créditos insuficientes para gerar plano de estudos (2 créditos necessários)'
      });
    }

    const prompt = `Crie um plano de estudos semanal personalizado.

INFORMAÇÕES:
- Matérias: ${subjects.join(', ')}
- Metas: ${goals}
- Horas disponíveis por dia: ${availableHours}

IMPORTANTE: Responda APENAS em formato JSON, sem texto adicional.

Formato:
{
  "weeklyPlan": [
    {
      "day": "Segunda-feira",
      "activities": [
        {
          "subject": "Matemática",
          "topic": "Álgebra linear",
          "duration": 90,
          "priority": "high"
        }
      ]
    }
  ],
  "recommendations": ["Estudar pela manhã", "Fazer pausas"],
  "estimatedWeeklyHours": 25
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
      })
    });

    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Resposta vazia da IA');
    }

    const planData = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');

    // Salvar plano usando a estrutura existente
    const studyPlanRepository = AppDataSource.getRepository(StudyPlan);
    const studyPlan = studyPlanRepository.create({
      user: { id: user.id },
      targetVestibular: goals,
      availableTimePerDay: availableHours * 60, // converter para minutos
      studyDays: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
      // Armazenar plano gerado em campo adicional ou como JSON
      subjects: [] // usar estrutura existente
    } as any);

    await studyPlanRepository.save(studyPlan);

    // Deduzir 2 créditos
    await userRepository.update(user.id, {
      credits: currentUser.credits - 2
    });

    res.json({
      success: true,
      data: {
        studyPlan: {
          ...studyPlan,
          generatedPlan: planData // incluir plano gerado
        },
        creditsRemaining: currentUser.credits - 2,
        costInfo: {
          creditsUsed: 2,
          realCost: '$0.004',
          viability: 'EXTREMAMENTE LUCRATIVO'
        }
      }
    });

  } catch (error) {
    logger.error('Erro ao gerar plano de estudos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar plano de estudos'
    });
  }
};

export const updateStudyProgress = async (req: Request, res: Response) => {
  try {
    const { planId, completedHours, subjectsCompleted } = req.body;
    const user = req.user as any;

    const studyPlanRepository = AppDataSource.getRepository(StudyPlan);
    
    const plan = await studyPlanRepository.findOne({
      where: { id: planId, user: { id: user.id } }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plano de estudos não encontrado'
      });
    }

    // Atualizar progresso (implementar lógica específica)
    // Por enquanto, apenas atualizar timestamp
    await studyPlanRepository.update(planId, {
      updatedAt: new Date()
    });

    res.json({
      success: true,
      data: plan
    });

  } catch (error) {
    logger.error('Erro ao atualizar progresso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar progresso'
    });
  }
};
