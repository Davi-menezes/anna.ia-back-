import 'module-alias/register';
import 'reflect-metadata';
import { createServer, Server } from 'http';
import { config } from './config/config';
import { createApp } from './app';
import { connectDB } from './config/database';
import { logger } from './utils/logger';

// Cria a aplicação Express
const app = createApp();
const server: Server = createServer(app);

// Conecta ao banco de dados e inicia o servidor
async function startServer(): Promise<void> {
  try {
    // Conecta ao MongoDB
    await connectDB();
    logger.info('✅ Conectado ao banco de dados');

    // Inicia o servidor
    server.listen(config.port, () => {
      logger.info(`
        🚀 Servidor rodando em http://localhost:${config.port}
        📊 Ambiente: ${config.nodeEnv}
        ⏰ ${new Date().toLocaleString()}
      `);
    });
  } catch (error) {
    logger.error('❌ Falha ao iniciar o servidor:', error);
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