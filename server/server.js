import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

let server;

// Start server after connecting to Database
const startServer = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`[LMS Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[LMS Server] Health endpoint: http://localhost:${PORT}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[LMS Server] Port ${PORT} is already in use. Please free port ${PORT} or restart.`);
    } else {
      console.error(`[LMS Server] Listener error: ${err.message}`);
    }
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Do not crash server in dev mode
});

// Handle graceful termination
process.on('SIGTERM', () => {
  if (server) server.close();
});
process.on('SIGINT', () => {
  if (server) server.close();
});
