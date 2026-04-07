import app from './app';
import { config, validateEnv } from './config/env';

// Validate environment before starting
validateEnv();

const server = app.listen(config.port, () => {
  console.log(`[Arogya Drishti] Backend running on port ${config.port}`);
  console.log(`[Arogya Drishti] Environment: ${config.nodeEnv}`);
  console.log(`[Arogya Drishti] Health check: http://localhost:${config.port}/api/v1/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Arogya Drishti] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Arogya Drishti] Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Arogya Drishti] SIGINT received. Shutting down...');
  server.close(() => process.exit(0));
});

export default server;
