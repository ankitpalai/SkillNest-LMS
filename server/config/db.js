import mongoose from 'mongoose';
import dns from 'node:dns';

// Force Node.js DNS to prefer IPv4 and use reliable DNS resolvers on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore if not supported in older runtimes
}

/**
 * Connect to MongoDB database using Mongoose
 */
export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms_db';

  try {
    const conn = await mongoose.connect(uri, {
      family: 4, // Force IPv4 connection
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // In development, log the error without immediately terminating process
    // so API health endpoints and mock services remain inspectable
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection lost. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB] Runtime connection error: ${err.message}`);
});

export default connectDB;
