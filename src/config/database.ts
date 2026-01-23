import mongoose, { Connection } from 'mongoose';
import { config } from './config';
import { logger } from '../utils/logger';

// Conecta ao MongoDB
export const connectDB = async (): Promise<Connection> => {
  try {
    const connection = await mongoose.connect(config.database.uri);

    logger.info('✅ Conectado ao MongoDB');
    return connection.connection;
  } catch (error) {
    logger.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

// Eventos de conexão
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB desconectado');
});

mongoose.connection.on('error', (error) => {
  logger.error('Erro na conexão com o MongoDB:', error);
});

// Fecha a conexão quando a aplicação é encerrada
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('Conexão com o MongoDB fechada');
  process.exit(0);
});