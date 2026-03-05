import 'module-alias/register';
import 'reflect-metadata';
import { createServer, Server } from 'http';
import { config } from './config/config';
import { createApp } from './app';
import AppDataSource from './config/data-source';
import { logger } from './utils/logger';
import DeploymentInitializer from './scripts/deployment-init';

// Cria a aplicação Express
const app = createApp();
const server: Server = createServer(app);

// Conecta ao banco de dados e inicia o servidor
async function startServer(): Promise<void> {
  try {
    // Inicializa a conexão com o banco de dados
    await AppDataSource.initialize();
    logger.info('✅ Conectado ao banco de dados PostgreSQL');

    const runMigrations = String(process.env.RUN_MIGRATIONS || '').toLowerCase() === 'true';
    if (runMigrations) {
      logger.info('🔄 RUN_MIGRATIONS=true: running pending migrations...');
      await AppDataSource.runMigrations();
      logger.info('✅ Migrations completed');
    }

    // Inicialização do deployment (migrations + importação ENEM)
    const runDeploymentInit = String(process.env.RUN_DEPLOYMENT_INIT || '').toLowerCase() === 'true';
    if (runDeploymentInit) {
      logger.info('🚀 RUN_DEPLOYMENT_INIT=true: initializing deployment...');
      const initializer = new DeploymentInitializer();
      await initializer.initialize();
      logger.info('✅ Deployment initialization completed');
    }
    // Inicia o servidor HTTP
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
  logger.error('Rejeição não tratada:', reason);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido. Encerrando o servidor...');
  server.close(() => {
    logger.info('Processo encerrado');
  });
});