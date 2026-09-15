import express from 'express';
import {
  uploadAvatar,
  uploadThumbnail,
  uploadVideo,
  uploadResource,
} from '../controllers/uploadController.js';
import {
  avatarUpload,
  thumbnailUpload,
  videoUpload,
  resourceUpload,
} from '../middleware/uploadMiddleware.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Avatar upload (accessible to any authenticated user)
router.post('/avatar', authenticateUser, avatarUpload, uploadAvatar);

// Thumbnail upload (instructor and admin)
router.post(
  '/thumbnail',
  authenticateUser,
  authorizeRoles('instructor', 'admin'),
  thumbnailUpload,
  uploadThumbnail
);

// Video upload (instructor and admin)
router.post(
  '/video',
  authenticateUser,
  authorizeRoles('instructor', 'admin'),
  videoUpload,
  uploadVideo
);

// Resource upload (instructor and admin)
router.post(
  '/resource',
  authenticateUser,
  authorizeRoles('instructor', 'admin'),
  resourceUpload,
  uploadResource
);

export default router;
