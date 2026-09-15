import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getMyPayments,
  getAllPayments,
} from '../controllers/paymentController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Order creation & payment verification
router.post('/create-order', authenticateUser, createPaymentOrder);
router.post('/verify-payment', authenticateUser, verifyPayment);

// Payment history queries
router.get('/my-payments', authenticateUser, getMyPayments);
router.get('/all', authenticateUser, authorizeRoles('admin'), getAllPayments);

export default router;
