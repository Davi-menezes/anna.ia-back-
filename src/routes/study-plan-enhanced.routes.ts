import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { generateWeeklyStudyPlan, updateStudyProgress } from '../controllers/study-plan-enhanced.controller';

const router = Router();

router.use(authenticate);

// Gerar plano de estudos semanal (2 créditos)
router.post('/generate', generateWeeklyStudyPlan);

// Atualizar progresso do plano
router.put('/:id/progress', updateStudyProgress);

export default router;
