import { Router } from 'express';
import { requestPasswordReset, resetPassword } from '../controllers/password.controller';
import { validate } from '../middlewares/validate';
import { body } from 'express-validator';

const router = Router();

// Rota para solicitar redefinição de senha
router.post(
  '/request-password-reset',
  validate([
    body('email').isEmail().withMessage('Por favor, forneça um e-mail válido'),
  ]),
  requestPasswordReset
);

// Rota para redefinir a senha
router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Token de redefinição é obrigatório'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('A senha deve ter pelo menos 8 caracteres')
      .matches(/\d/)
      .withMessage('A senha deve conter pelo menos um número'),
  ]),
  resetPassword
);

export default router;
