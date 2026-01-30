import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getTodayGoal, setTodayGoal, incrementTodayProgress } from '../controllers/question-goals.controller';

const router = Router();

router.use(authenticate);

router.get('/today', getTodayGoal);
router.post('/today', setTodayGoal);
router.post('/today/progress', incrementTodayProgress);

export default router;
