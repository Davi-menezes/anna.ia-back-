import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  listFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
  reviewFlashcard,
} from '../controllers/flashcards.controller';

const router = Router();

router.use(authenticate);

router.get('/', listFlashcards);
router.post('/', createFlashcard);
router.patch('/:id', updateFlashcard);
router.delete('/:id', deleteFlashcard);
router.post('/:id/review', reviewFlashcard);

export default router;
