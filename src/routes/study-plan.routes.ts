import { Router } from 'express';
import { createPlan, generateWeekly, updatePerformance, getActivePlan, generateSimulado } from '../controllers/study-plan.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { verifyPremium } from '../middlewares/premium.middleware';

const router = Router();

// All study plan routes require authentication
router.use(authenticate);

// Simulado route (available to all authenticated users)
router.get('/simulado/:subject', generateSimulado);

// Other study plan routes require premium status
router.get('/', verifyPremium, getActivePlan);
router.post('/', verifyPremium, createPlan);
router.post('/:planId/generate', verifyPremium, generateWeekly);
router.post('/:planId/performance', verifyPremium, updatePerformance);

export default router;
