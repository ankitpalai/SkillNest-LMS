import express from 'express';
import {
  getInstructorStats,
  getInstructorCourses,
  toggleCourseStatus,
} from '../controllers/instructorController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all instructor routes
router.use(authenticateUser);
router.use(authorizeRoles('instructor', 'admin'));

router.get('/stats', getInstructorStats);
router.get('/courses', getInstructorCourses);
router.patch('/courses/:id/status', toggleCourseStatus);

export default router;
