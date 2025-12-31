import { Router } from 'express';
import { verifyEmail, resendVerificationEmail } from '../controllers/verification.controller';

const router = Router();

// Rota para verificar o e-mail com o token
router.get('/verify-email/:token', verifyEmail);

// Rota para reenviar o e-mail de verificação
router.post('/resend-verification', resendVerificationEmail);

export default router;
