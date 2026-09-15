import User from '../models/User.js';
import Course from '../models/Course.js';

/**
 * @route   POST /api/wishlist/:courseId
 * @desc    Add a course to the user's wishlist
 * @access  Private
 */
export const addToWishlist = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Add to wishlist using $addToSet (ensures uniqueness)
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { wishlist: courseId } },
      { new: true }
    ).populate({
      path: 'wishlist',
      populate: [
        { path: 'instructor', select: 'name avatar' },
        { path: 'category', select: 'name' },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Course added to wishlist',
      count: user.wishlist.length,
      wishlist: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/wishlist/:courseId
 * @desc    Remove a course from the user's wishlist
 * @access  Private
 */
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: courseId } },
      { new: true }
    ).populate({
      path: 'wishlist',
      populate: [
        { path: 'instructor', select: 'name avatar' },
        { path: 'category', select: 'name' },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Course removed from wishlist',
      count: user.wishlist.length,
      wishlist: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/wishlist
 * @desc    Get user's populated wishlist
 * @access  Private
 */
export const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: 'wishlist',
      populate: [
        { path: 'instructor', select: 'name avatar' },
        { path: 'category', select: 'name' },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      count: user.wishlist ? user.wishlist.length : 0,
      wishlist: user.wishlist || [],
    });
  } catch (error) {
    next(error);
  }
};

export default {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
};
