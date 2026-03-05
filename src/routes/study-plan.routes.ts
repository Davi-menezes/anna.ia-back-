import { Router } from 'express';
import { createPlan, generateWeekly, updatePerformance, getActivePlan, generateSimulado, chargeSimulado } from '../controllers/study-plan.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { verifyPremium } from '../middlewares/premium.middleware';

const router = Router();

// Todas as rotas de plano de estudos exigem autenticação
router.use(authenticate);

// Rotas de simulado (disponíveis para todos os usuários autenticados)
router.get('/simulado/:subject', generateSimulado);
router.post('/simulado/charge', chargeSimulado);

// Demais rotas exigem status premium
router.get('/', verifyPremium, getActivePlan);
router.post('/', verifyPremium, createPlan);
router.post('/:planId/generate', verifyPremium, generateWeekly);
router.post('/:planId/performance', verifyPremium, updatePerformance);

export default router;
