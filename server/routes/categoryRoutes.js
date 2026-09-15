import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route
router.get('/', getCategories);

// Admin-only management routes
router.post('/', authenticateUser, authorizeRoles('admin'), createCategory);
router.put('/:id', authenticateUser, authorizeRoles('admin'), updateCategory);
router.delete('/:id', authenticateUser, authorizeRoles('admin'), deleteCategory);

export default router;
