import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import curriculumRoutes from './routes/curriculumRoutes.js';
import instructorRoutes from './routes/instructorRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();

// Core Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Allow local development origins
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Allow configured CLIENT_URL
    if (process.env.CLIENT_URL && (origin === process.env.CLIENT_URL || origin.startsWith(process.env.CLIENT_URL))) {
      return callback(null, true);
    }
    // Allow Vercel deployments (*.vercel.app)
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // Fallback for production / staging
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);

// Fallback & Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
