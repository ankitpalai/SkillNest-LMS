import express from 'express';
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from '../controllers/wishlistController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// All wishlist routes are private
router.use(authenticateUser);

router.get('/', getWishlist);
router.post('/:courseId', addToWishlist);
router.delete('/:courseId', removeFromWishlist);

export default router;
