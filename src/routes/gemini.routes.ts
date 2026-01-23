import { Router } from 'express';
import { generateResponse } from '../controllers/gemini.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication middleware
router.use(authenticate);

// Chat response
router.post('/chat', generateResponse);

export default router;
