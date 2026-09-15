import { uploadBufferToCloudinary } from '../config/cloudinary.js';
import User from '../models/User.js';

/**
 * @route   POST /api/upload/avatar
 * @desc    Upload authenticated user's profile avatar
 * @access  Private
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar file provided. Please upload an image.',
      });
    }

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'skillnest/avatars',
      resource_type: 'image',
      mimetype: req.file.mimetype,
    });

    // Update user's avatar in database
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: uploadResult.secure_url },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/upload/thumbnail
 * @desc    Upload course thumbnail image
 * @access  Private (Instructor, Admin)
 */
export const uploadThumbnail = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No thumbnail file provided. Please upload an image.',
      });
    }

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'skillnest/thumbnails',
      resource_type: 'image',
      mimetype: req.file.mimetype,
    });

    res.status(200).json({
      success: true,
      message: 'Thumbnail uploaded successfully',
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/upload/video
 * @desc    Upload course lecture video
 * @access  Private (Instructor, Admin)
 */
export const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided. Please upload a video.',
      });
    }

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'skillnest/videos',
      resource_type: 'video',
      mimetype: req.file.mimetype,
    });

    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      duration: uploadResult.duration || 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/upload/resource
 * @desc    Upload lesson resource attachment (PDF, archive, doc)
 * @access  Private (Instructor, Admin)
 */
export const uploadResource = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resource file provided.',
      });
    }

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'skillnest/resources',
      resource_type: 'auto',
      mimetype: req.file.mimetype,
    });

    res.status(200).json({
      success: true,
      message: 'Resource uploaded successfully',
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  uploadAvatar,
  uploadThumbnail,
  uploadVideo,
  uploadResource,
};
