import { Router } from 'express';
import { upload, handleUploadErrors } from '../utils/fileUpload';
import { 
  updateProfilePicture, 
  getProfile,
  serveProfilePicture 
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication middleware to all user routes
router.use(authenticate);

// Get user profile
router.get('/profile', getProfile);

// Update profile picture
router.post(
  '/profile/picture',
  upload.single('profilePicture'),
  handleUploadErrors,
  updateProfilePicture
);

// Serve profile picture
router.get('/profile/picture/:userId', serveProfilePicture);

export default router;
