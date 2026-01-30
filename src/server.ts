import 'module-alias/register';
import 'reflect-metadata';
import { createServer, Server } from 'http';
import { config } from './config/config';
import { createApp } from './app';
import AppDataSource from './config/data-source';
import { logger } from './utils/logger';

// Cria a aplicação Express
const app = createApp();
const server: Server = createServer(app);

// Conecta ao banco de dados e inicia o servidor
async function startServer(): Promise<void> {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    logger.info('✅ Connected to PostgreSQL database');

    const runMigrations = String(process.env.RUN_MIGRATIONS || '').toLowerCase() === 'true';
    if (runMigrations) {
      logger.info('🔄 RUN_MIGRATIONS=true: running pending migrations...');
      await AppDataSource.runMigrations();
      logger.info('✅ Migrations completed');
    }
    // Start the server
    server.listen(config.port, () => {
      logger.info(`
        🚀 Server running at http://localhost:${config.port}
        📊 Environment: ${config.nodeEnv}
        ⏰ ${new Date().toLocaleString()}
      `);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Inicia o servidor
startServer();

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason: Error | any) => {
  logger.error('Unhandled Rejection:', reason);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
  });
});