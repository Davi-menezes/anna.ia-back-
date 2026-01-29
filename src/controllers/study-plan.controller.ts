import { Request, Response } from 'express';
import { StudyPlanService } from '../services/study-plan.service';
import { logger } from '../utils/logger';

const studyPlanService = new StudyPlanService();

export const createPlan = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const plan = await studyPlanService.createInitialPlan(user.id, req.body);
        res.status(201).json({ success: true, data: plan });
    } catch (error: any) {
        logger.error('Error creating study plan:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateWeekly = async (req: Request, res: Response) => {
    try {
        const { planId } = req.params;
        const schedule = await studyPlanService.generateWeeklyPlan(planId);
        res.status(200).json({ success: true, data: schedule });
    } catch (error: any) {
        logger.error('Error generating weekly plan:', error);
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
        logger.error('Error updating performance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getActivePlan = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const plan = await studyPlanService.findActivePlan(user.id);
        res.status(200).json({ success: true, data: plan });
    } catch (error: any) {
        logger.error('Error getting active plan:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateSimulado = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { subject } = req.params;

        // Credits logic for simulados: premium users free, others cost 1.0 credit
        const userRepository = (await import('../config/data-source')).default.getRepository((await import('../entities/User')).User);
        const existingUser = await userRepository.findOne({ where: { id: user.id } });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        const creditCost = existingUser.status === 'premium' ? 0 : 1.0;
        const currentCredits = Number(existingUser.credits);

        if (creditCost > 0 && currentCredits < creditCost) {
            return res.status(403).json({ success: false, message: 'Créditos insuficientes para gerar simulado', code: 'OUT_OF_CREDITS' });
        }

        // Deduct beforehand if not premium
        if (creditCost > 0) {
            existingUser.credits = Math.round((currentCredits - creditCost) * 100) / 100;
            await userRepository.save(existingUser);
        }

        try {
            const questions = await studyPlanService.generateSimulado(subject);
            return res.status(200).json({ success: true, data: questions, credits: existingUser.credits });
        } catch (genErr) {
            // Refund on failure
            if (creditCost > 0) {
                existingUser.credits = currentCredits;
                await userRepository.save(existingUser);
            }
            throw genErr;
        }
    } catch (error: any) {
        logger.error('Error generating simulado:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
