import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getTodayGoal, setTodayGoal, updateCompletedQuestions, deleteTodayGoal } from '../controllers/question-goals.controller';

const router = Router();

router.use(authenticate);

router.get('/today', getTodayGoal);
router.post('/today', setTodayGoal);
router.put('/today', updateCompletedQuestions);
router.delete('/today', deleteTodayGoal);

export default router;
