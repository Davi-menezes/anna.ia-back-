import { Router } from 'express';
import { createPlan, generateWeekly, updatePerformance, getActivePlan } from '../controllers/study-plan.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { verifyPremium } from '../middlewares/premium.middleware';

const router = Router();

// All study plan routes require authentication and premium status
router.use(authenticate);
router.use(verifyPremium);

router.get('/', getActivePlan);
router.post('/', createPlan);
router.post('/:planId/generate', generateWeekly);
router.post('/:planId/performance', updatePerformance);

export default router;
