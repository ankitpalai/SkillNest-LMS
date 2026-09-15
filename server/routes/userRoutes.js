import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from '../controllers/userController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// All user profile routes are private
router.use(authenticateUser);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.put('/change-password', changePassword);

export default router;
