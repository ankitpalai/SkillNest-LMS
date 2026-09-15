import express from 'express';
import {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  deleteUser,
  getAdminCourses,
  toggleCourseStatus,
  deleteAdminCourse,
} from '../controllers/adminController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict RBAC Middleware: Admin only for all admin subroutes
router.use(authenticateUser, authorizeRoles('admin'));

// 1. Dashboard Telemetry & Statistics
router.get('/stats', getAdminStats);

// 2. User Management
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// 3. Course Moderation
router.get('/courses', getAdminCourses);
router.patch('/courses/:id/status', toggleCourseStatus);
router.delete('/courses/:id', deleteAdminCourse);

export default router;
