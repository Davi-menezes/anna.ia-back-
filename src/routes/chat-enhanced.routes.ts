import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { generateChatResponse, getChatCostAnalysis } from '../controllers/chat-enhanced.controller';

const router = Router();

router.use(authenticate);

// Gerar resposta do chat (1 crédito)
router.post('/generate', generateChatResponse);

// Análise de custos (informações)
router.get('/cost-analysis', getChatCostAnalysis);

export default router;
