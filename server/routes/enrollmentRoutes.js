import express from 'express';
import {
  enrollCourse,
  getMyEnrollments,
  getCourseEnrollment,
  toggleLessonCompletion,
} from '../controllers/enrollmentController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// All enrollment routes require authentication
router.use(authenticateUser);

// Enroll in a course
router.post('/', enrollCourse);

// Get all enrolled courses for current student
router.get('/my-courses', getMyEnrollments);

// Get enrollment status and progress for specific course
router.get('/:courseId', getCourseEnrollment);

// Mark lesson as complete / incomplete and recalculate progress
router.patch('/:courseId/lessons/:lessonId', toggleLessonCompletion);

export default router;
