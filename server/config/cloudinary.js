import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo_secret',
  secure: true,
});

/**
 * Upload a memory buffer to Cloudinary using a stream.
 * Automatically handles mock/fallback for demo/offline test environments.
 * 
 * @param {Buffer} fileBuffer - Buffer from multer
 * @param {Object} options - Cloudinary upload options (folder, resource_type, etc.)
 * @returns {Promise<Object>} Upload result containing secure_url, public_id, format, etc.
 */
export const uploadBufferToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    // If running in demo mode or credentials are dummy placeholders, provide simulated reliable upload response
    const isDemo =
      !process.env.CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_API_KEY === 'demo_key' ||
      process.env.CLOUDINARY_CLOUD_NAME === 'demo_cloud';

    if (isDemo) {
      const mime = options.mimetype || 'image/jpeg';
      const base64 = fileBuffer.toString('base64');
      const dataUri = `data:${mime};base64,${base64}`;
      const fakePublicId = `skillnest/${options.folder || 'general'}/mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      return resolve({
        public_id: fakePublicId,
        secure_url: dataUri,
        url: dataUri,
        resource_type: options.resource_type || 'image',
        bytes: fileBuffer.length,
        format: mime.split('/')[1] || 'jpg',
        isMock: true,
      });
    }

    // Live Cloudinary upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'skillnest',
        resource_type: options.resource_type || 'auto',
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Delete a resource from Cloudinary by public ID
 * @param {string} publicId - Cloudinary public_id
 * @param {string} resourceType - 'image' | 'video' | 'raw'
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    if (!publicId || publicId.startsWith('skillnest/mock_')) return { result: 'ok' };
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('[Cloudinary] Delete error:', error.message);
    return null;
  }
};

export default {
  cloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
};
