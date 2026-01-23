import { Router } from 'express';
import passport from 'passport';
import { register, login, googleCallback, getCurrentUser } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { loginSchema, registerSchema } from '../validations/auth.validation';

const router = Router();

// Rotas de autenticação
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// Rotas de autenticação social
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

// Rota para obter o usuário atual
router.get('/me', verifyToken, getCurrentUser);

// Rotas de verificação de e-mail
import verificationRoutes from './verification.routes';
router.use(verificationRoutes);

// Rotas de redefinição de senha
import passwordRoutes from './password.routes';
router.use(passwordRoutes);

export default router;