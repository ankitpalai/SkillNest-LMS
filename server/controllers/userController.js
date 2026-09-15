import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile with telemetry stats
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    const enrollmentCount = await Enrollment.countDocuments({ student: userId });

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
        enrollmentCount,
        wishlistCount: user.wishlist ? user.wishlist.length : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile (name, bio, avatar)
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, bio, avatar } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Full name cannot be empty',
        });
      }
      if (name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot exceed 50 characters',
        });
      }
      user.name = name.trim();
    }

    if (bio !== undefined) {
      if (bio.length > 250) {
        return res.status(400).json({
          success: false,
          message: 'Bio cannot exceed 250 characters',
        });
      }
      user.bio = bio.trim();
    }

    if (avatar !== undefined) {
      user.avatar = avatar.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/change-password
 * @desc    Change password with current password verification
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
    }

    // Explicitly select password field
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match our records',
      });
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  changePassword,
};
