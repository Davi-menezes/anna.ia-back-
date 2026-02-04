import AppDataSource from '../config/data-source';
import { logger } from '../utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';
import EnemApiService from '../services/enem-api.service';

const execAsync = promisify(exec);

class DeploymentInitializer {
  async initialize(): Promise<void> {
    try {
      logger.info('🚀 Iniciando inicialização do deployment...');
      
      // 1. Rodar migrations pendentes
      await this.runMigrations();
      
      // 2. Importar questões do ENEM (se ainda não existirem)
      await this.importEnemQuestions();
      
      // 3. Verificar se as questões foram importadas
      await this.verifyQuestionsImported();
      
      logger.info('✅ Inicialização do deployment concluída com sucesso!');
      
    } catch (error) {
      logger.error('❌ Erro na inicialização do deployment:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    try {
      logger.info('📋 Rodando migrations do banco de dados...');
      
      // Inicializar data source temporariamente para verificar
      await AppDataSource.initialize();
      
      // Verificar se já existe a tabela question_bank
      const tableExists = await AppDataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'question_bank'
        );
      `);
      
      await AppDataSource.destroy();
      
      if (!tableExists[0].exists) {
        logger.info('🔧 Rodando migrations...');
        await execAsync('npm run migration:run', { cwd: process.cwd() });
        logger.info('✅ Migrations executadas com sucesso!');
      } else {
        logger.info('✅ Tabela question_bank já existe, pulando migrations...');
      }
      
    } catch (error) {
      logger.error('Erro ao rodar migrations:', error);
      throw error;
    }
  }

  private async importEnemQuestions(): Promise<void> {
    try {
      await AppDataSource.initialize();
      const { QuestionBank } = await import('../entities/QuestionBank');
      const questionRepository = AppDataSource.getRepository(QuestionBank);
      
      // Verificar quantas questões já existem
      const existingCount = await questionRepository.count();
      
      if (existingCount === 0) {
        logger.info('📚 Nenhuma questão encontrada. Importando questões do ENEM...');
        
        const enemService = new EnemApiService();
        
        // Importar questões dos últimos 5 anos para começar
        const recentYears = [2023, 2022, 2021, 2020, 2019];
        
        for (const year of recentYears) {
          try {
            logger.info(`📅 Importando questões do ENEM ${year}...`);
            await enemService.importByYear(year);
          } catch (error) {
            logger.warn(`⚠️ Não foi possível importar questões do ano ${year}:`, error);
          }
        }
        
      } else if (existingCount < 50) {
        logger.info(`📚 Apenas ${existingCount} questões encontradas. Importando mais questões...`);
        
        const enemService = new EnemApiService();
        
        // Importar anos mais recentes para complementar
        const yearsToImport = [2023, 2022, 2021];
        
        for (const year of yearsToImport) {
          try {
            logger.info(`📅 Complementando com questões do ENEM ${year}...`);
            await enemService.importByYear(year);
          } catch (error) {
            logger.warn(`⚠️ Não foi possível importar questões do ano ${year}:`, error);
          }
        }
        
      } else {
        logger.info(`✅ ${existingCount} questões já encontradas no banco de dados.`);
      }
      
    } catch (error) {
      logger.error('Erro ao importar questões do ENEM:', error);
      throw error;
    } finally {
      await AppDataSource.destroy();
    }
  }

  private async verifyQuestionsImported(): Promise<void> {
    try {
      await AppDataSource.initialize();
      const { QuestionBank } = await import('../entities/QuestionBank');
      const questionRepository = AppDataSource.getRepository(QuestionBank);
      
      // Contar questões por matéria
      const stats = await questionRepository
        .createQueryBuilder('question')
        .select('question.subject', 'subject')
        .addSelect('COUNT(*)', 'count')
        .groupBy('question.subject')
        .getRawMany();
      
      const totalCount = await questionRepository.count();
      
      logger.info('📊 Estatísticas das questões importadas:');
      logger.info(`📚 Total de questões: ${totalCount}`);
      
      if (stats.length === 0) {
        logger.warn('⚠️ Nenhuma questão encontrada! Os simulados podem não funcionar corretamente.');
      } else {
        stats.forEach(stat => {
          logger.info(`   ${stat.subject}: ${stat.count} questões`);
        });
      }
      
      // Verificar se há questões suficientes para simulados
      if (totalCount < 30) {
        logger.warn('⚠️ Menos de 30 questões no total. Considere importar mais anos para melhor experiência.');
      }
      
    } catch (error) {
      logger.error('Erro ao verificar questões importadas:', error);
      throw error;
    } finally {
      await AppDataSource.destroy();
    }
  }
}

// Executar inicialização
async function main() {
  const initializer = new DeploymentInitializer();
  
  try {
    await initializer.initialize();
    process.exit(0);
  } catch (error) {
    logger.error('Falha na inicialização do deployment:', error);
    process.exit(1);
  }
}

// Executar apenas se for chamado diretamente
if (require.main === module) {
  main();
}

export default DeploymentInitializer;
