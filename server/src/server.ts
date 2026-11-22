// server/src/server.ts
// HTTP Server Entry Point & Process Lifecycle Manager
import http from 'node:http';
import { app } from './app.ts';
import { config } from './config/env.ts';
import { logger } from './services/logger.ts';
import { getDbClient } from './services/prisma.ts';
import { seedDatabase } from '../prisma/seed.ts';

const prisma = getDbClient();

const server = http.createServer((req, res) => {
  app.handle(req, res);
});

async function startServer() {
  try {
    // 1. Verify Database Connection
    await prisma.$connect();

    // 2. Run Database Seed Check
    await seedDatabase();

    // 3. Start HTTP Server
    server.listen(config.port, '0.0.0.0', () => {
      logger.info(`========================================================`);
      logger.info(`Psychology Platform Backend listening on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API Base URL: http://localhost:${config.port}${config.apiBaseUrl}`);
      logger.info(`Swagger Documentation: http://localhost:${config.port}/api/docs`);
      logger.info(`Database Target: ${config.databaseUrl.split('@').pop()}`);
      logger.info(`========================================================`);
    });

  } catch (error) {
    logger.error('Failed to start backend server:', error);
    process.exit(1);
  }
}

// Graceful Shutdown Handlers
function handleGracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Initiating graceful server shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connections closed cleanly.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database disconnection:', err);
      process.exit(1);
    }
  });

  // Force close after 10s if connections linger
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

startServer();

export { server, app };

