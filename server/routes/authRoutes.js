import express from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  getCurrentUser,
} from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/logout', logoutUser);
router.get('/me', authenticateUser, getCurrentUser);

export default router;
