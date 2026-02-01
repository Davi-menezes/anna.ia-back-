import { Router } from 'express';
import { generateSimulado, getAvailableSubjects, getSimuladoStats } from '../controllers/simulado.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Gerar simulado
router.post('/generate', authenticate, generateSimulado);

// Listar matérias disponíveis
router.get('/subjects', getAvailableSubjects);

// Estatísticas dos simulados
router.get('/stats', getSimuladoStats);

export default router;
