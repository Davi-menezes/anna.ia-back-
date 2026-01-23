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

// Serve profile picture - Make this PUBLIC so standard <img> tags can load it
router.get('/profile/picture/:userId', serveProfilePicture);

// Apply authentication middleware to all other user routes
router.use(authenticate);

// Get user profile
router.get('/profile', getProfile);

// Update user profile
router.patch('/profile', updateProfile);

// Update profile picture
router.post(
  '/profile/picture',
  upload.single('profilePicture'),
  handleUploadErrors,
  updateProfilePicture
);

// Serve profile picture - (MOVED UP to be public)

// Deduct credits
router.post('/credits/deduct', deductCredits);

export default router;
