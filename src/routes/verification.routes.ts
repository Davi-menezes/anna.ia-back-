import { Router } from 'express';
import { verifyEmail, resendVerificationEmail } from '../controllers/verification.controller';
import { logger } from '../utils/logger';

const router = Router();

// Rota para verificar o e-mail com o token (suporta path parameter)
router.get('/verify-email/:token', (req, res, next) => {
  logger.info(`Rota de verificação chamada - Token: ${req.params.token ? req.params.token.substring(0, 10) + '...' : 'não fornecido'}`);
  next();
}, verifyEmail);

// Rota para reenviar o e-mail de verificação
router.post('/resend-verification', resendVerificationEmail);

export default router;
