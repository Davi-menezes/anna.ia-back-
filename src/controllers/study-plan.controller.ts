import { Request, Response } from 'express';
import { StudyPlanService } from '../services/study-plan.service';
import { logger } from '../utils/logger';
import AppDataSource from '../config/data-source';
import { User } from '../entities/User';

const studyPlanService = new StudyPlanService();

export const createPlan = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const plan = await studyPlanService.createInitialPlan(user.id, req.body);
        res.status(201).json({ success: true, data: plan });
    } catch (error: any) {
        logger.error('Erro ao criar plano de estudos:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateWeekly = async (req: Request, res: Response) => {
    try {
        const { planId } = req.params;
        const schedule = await studyPlanService.generateWeeklyPlan(planId);
        res.status(200).json({ success: true, data: schedule });
    } catch (error: any) {
        logger.error('Erro ao gerar plano semanal:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePerformance = async (req: Request, res: Response) => {
    try {
        const { planId } = req.params;
        const { subjectName, performance } = req.body;
        await studyPlanService.updateSubjectPriority(planId, subjectName, performance);
        res.status(200).json({ success: true });
    } catch (error: any) {
        logger.error('Erro ao atualizar desempenho:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getActivePlan = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const plan = await studyPlanService.findActivePlan(user.id);
        res.status(200).json({ success: true, data: plan });
    } catch (error: any) {
        logger.error('Erro ao buscar plano ativo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateSimulado = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { subject } = req.params;

        logger.info(`generateSimulado called: user=${user?.id}, subject=${subject}`);

        if (!user) {
            logger.warn('generateSimulado: No user in request');
            return res.status(401).json({ success: false, message: 'Não autorizado' });
        }

        // Todos os usuários consomem créditos para gerar simulado
        const userRepository = AppDataSource.getRepository(User);
        let existingUser: any;
        try {
            existingUser = await userRepository.findOne({ where: { id: user.id } });
        } catch (dbErr) {
            logger.error('Error fetching user from DB:', dbErr);
            return res.status(500).json({ success: false, message: 'Erro ao buscar usuário no banco de dados' });
        }

        if (!existingUser) {
            logger.warn(`generateSimulado: User ${user.id} not found in DB`);
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        const creditCost = 1;
        const currentCredits = Number(existingUser.credits);

        const freeTrialAvailable = !existingUser.freeSimuladoUsed;

        logger.info(`Simulado request for user ${user.id}: current credits=${currentCredits}, cost=${creditCost}, freeTrialAvailable=${freeTrialAvailable}`);

        let charged = false;
        if (freeTrialAvailable) {
            existingUser.freeSimuladoUsed = true;
            existingUser.freeSimuladoUsedAt = new Date();
            try {
                await userRepository.save(existingUser);
            } catch (saveErr) {
                logger.error('Error saving user free simulado flag:', saveErr);
                return res.status(500).json({ success: false, message: 'Erro ao atualizar dados do usuário' });
            }
        } else {
            if (currentCredits < creditCost) {
                logger.warn(`User ${user.id} out of credits for simulado: ${currentCredits} < ${creditCost}`);
                return res.status(403).json({ success: false, message: 'Créditos insuficientes para gerar simulado', code: 'OUT_OF_CREDITS' });
            }

            // Deduz créditos antes de chamar a IA
            const newCredits = currentCredits - creditCost;
            existingUser.credits = Math.round(newCredits * 100) / 100;
            try {
                await userRepository.save(existingUser);
                charged = true;
            } catch (saveErr) {
                logger.error('Error saving user credits:', saveErr);
                return res.status(500).json({ success: false, message: 'Erro ao atualizar créditos' });
            }
        }

        try {
            logger.info(`Calling generateSimulado service for subject: ${subject}`);
            const questions = await studyPlanService.generateSimulado(subject);
            logger.info(`Successfully generated ${questions.length} questions for ${subject}, sending response. First question: ${JSON.stringify(questions[0])}`);
            return res.status(200).json({ success: true, data: questions, credits: existingUser.credits });
        } catch (genErr: any) {
            logger.error(`Error generating simulado in service: ${genErr.message}`, genErr);
            // Estorna créditos em caso de falha
            logger.error('Erro ao gerar simulado, estornando créditos:', genErr);
            if (charged) {
                existingUser.credits = currentCredits;
            }
            // Se era sessão gratuita, permite nova tentativa resetando a flag
            if (!charged && freeTrialAvailable) {
                existingUser.freeSimuladoUsed = false;
                existingUser.freeSimuladoUsedAt = null as any;
            }
            try {
                await userRepository.save(existingUser);
            } catch (refundErr) {
                logger.error('Error refunding credits:', refundErr);
            }
            throw genErr;
        }
    } catch (error: any) {
        logger.error('Erro ao gerar simulado:', error);
        res.status(500).json({ success: false, message: error.message || 'Erro ao gerar simulado' });
    }
};

export const chargeSimulado = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ success: false, message: 'Não autorizado' });

        const userRepository = AppDataSource.getRepository(User);
        const existingUser = await userRepository.findOne({ where: { id: user.id } });

        if (!existingUser) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

        const creditCost = 1;
        const currentCredits = Number(existingUser.credits);
        const freeTrialAvailable = !existingUser.freeSimuladoUsed;

        if (freeTrialAvailable) {
            existingUser.freeSimuladoUsed = true;
            existingUser.freeSimuladoUsedAt = new Date();
            await userRepository.save(existingUser);
            return res.status(200).json({ success: true, credits: existingUser.credits, freeTrialUsed: true });
        } else {
            if (currentCredits < creditCost) {
                return res.status(403).json({ success: false, message: 'Créditos insuficientes', code: 'OUT_OF_CREDITS' });
            }
            existingUser.credits = Math.round((currentCredits - creditCost) * 100) / 100;
            await userRepository.save(existingUser);
            return res.status(200).json({ success: true, credits: existingUser.credits });
        }
    } catch (error: any) {
        logger.error('Erro ao processar cobrança do simulado:', error);
        res.status(500).json({ success: false, message: 'Erro ao processar cobrança' });
    }
};
