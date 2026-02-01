import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { generateDailyFlashcards, listFlashcards, createFlashcard, updateFlashcardStatus } from '../controllers/flashcards-enhanced.controller';

const router = Router();

router.use(authenticate);

// Gerar flashcards com IA (0.5 crédito)
router.post('/generate', generateDailyFlashcards);

// Listar flashcards
router.get('/', listFlashcards);

// Criar flashcard manual
router.post('/', createFlashcard);

// Atualizar status do flashcard
router.put('/:id/status', updateFlashcardStatus);

export default router;
