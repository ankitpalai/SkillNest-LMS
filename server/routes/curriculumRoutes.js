import express from 'express';
import {
  getCourseCurriculum,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from '../controllers/curriculumController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Authenticated read route
router.get('/course/:courseId', getCourseCurriculum);

// Section management routes (Instructor / Admin)
router.post(
  '/course/:courseId/sections',
  authenticateUser,
  authorizeRoles('instructor', 'admin'),
  createSection
);

router.put(
  '/course/:courseId/sections/reorder',
  authenticateUser,
  authorizeRoles('instructor', 'admin'),
  reorderSections
);

router.put(
  '/sections/:id',
  authenticateUser,
  authorizeRoles('instructor', 'admin'),
  updateSection
);

router.delete(
  '/sections/:id',
  authenticateUser,
  authorizeRoles('instructor', 'admin'),
  deleteSection
);

// Lesson management routes (Instructor / Admin)
router.post(
  '/sections/:sectionId/lessons',
  authenticateUser,
  authorizeRoles('instructor', 'admin'),
  createLesson
);

router.put(
  '/sections/:sectionId/lessons/reorder',
  authenticateUser,
  authorizeRoles('instructor', 'admin'),
  reorderLessons
);

router.put(
  '/lessons/:id',
  authenticateUser,
  authorizeRoles('instructor', 'admin'),
  updateLesson
);

router.delete(
  '/lessons/:id',
  authenticateUser,
  authorizeRoles('instructor', 'admin'),
  deleteLesson
);

export default router;
