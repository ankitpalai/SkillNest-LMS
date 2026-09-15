import multer from 'multer';

// Use memory storage so we can stream files straight to Cloudinary without storing temporary files on disk
const storage = multer.memoryStorage();

// Allowed MIME types
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/mpeg'];
const RESOURCE_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'application/json',
];

// File Filter Helpers
const createFileFilter = (allowedTypes, typeName) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    const error = new Error(`Invalid file type for ${typeName}. Allowed formats: ${allowedTypes.join(', ')}`);
    error.status = 400;
    cb(error, false);
  }
};

// 1. Avatar Upload (max 5MB)
export const avatarUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: createFileFilter(IMAGE_MIME_TYPES, 'Avatar image'),
}).single('avatar');

// 2. Thumbnail Upload (max 5MB)
export const thumbnailUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: createFileFilter(IMAGE_MIME_TYPES, 'Course thumbnail'),
}).single('thumbnail');

// 3. Video Upload (max 100MB)
export const videoUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: createFileFilter(VIDEO_MIME_TYPES, 'Course video'),
}).single('video');

// 4. Resource / Attachment Upload (max 25MB)
export const resourceUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: createFileFilter(RESOURCE_MIME_TYPES, 'Resource file'),
}).single('resource');

export default {
  avatarUpload,
  thumbnailUpload,
  videoUpload,
  resourceUpload,
};
