import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/courseController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public course browsing routes
router.get('/', getCourses);
router.get('/:id', getCourseById);

// Instructor and Admin course management routes
router.post('/', authenticateUser, authorizeRoles('instructor', 'admin'), createCourse);
router.put('/:id', authenticateUser, authorizeRoles('instructor', 'admin'), updateCourse);
router.delete('/:id', authenticateUser, authorizeRoles('instructor', 'admin'), deleteCourse);

export default router;
