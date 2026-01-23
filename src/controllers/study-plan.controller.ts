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
