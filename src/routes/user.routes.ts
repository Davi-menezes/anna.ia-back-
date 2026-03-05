import { Router } from 'express';
import { upload, handleUploadErrors } from '../utils/fileUpload';
import {
  updateProfilePicture,
  getProfile,
  serveProfilePicture,
  deductCredits,
  updateProfile
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Rota pública para servir foto de perfil (necessário para tags <img> sem autenticação)
router.get('/profile/picture/:userId', serveProfilePicture);

// Aplica autenticação em todas as demais rotas de usuário
router.use(authenticate);

// Busca perfil do usuário autenticado
router.get('/profile', getProfile);

// Atualiza dados do perfil
router.patch('/profile', updateProfile);

// Atualiza foto de perfil
router.post(
  '/profile/picture',
  upload.single('profilePicture'),
  handleUploadErrors,
  updateProfilePicture
);

// Deduz créditos do usuário
router.post('/credits/deduct', deductCredits);

export default router;
