import express from 'express';
import {
  createReview,
  getCourseReviews,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route: Get all reviews for a course
router.get('/course/:courseId', getCourseReviews);

// Private routes: Create, update, delete reviews
router.post('/', authenticateUser, createReview);
router.put('/:id', authenticateUser, updateReview);
router.delete('/:id', authenticateUser, deleteReview);

export default router;
