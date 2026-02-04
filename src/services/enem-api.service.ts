import AppDataSource from '../config/data-source';
import { QuestionBank } from '../entities/QuestionBank';
import axios from 'axios';
import { logger } from '../utils/logger';

interface EnemQuestion {
  title: string;
  index: number;
  discipline: string;
  language?: string;
  year: number;
  context?: string;
  files?: string[];
  correctAlternative: string;
  alternativesIntroduction?: string;
  alternatives: {
    letter: string;
    text: string;
    file?: string;
    isCorrect: boolean;
  }[];
}

interface EnemExam {
  title: string;
  year: number;
  disciplines: {
    label: string;
    value: string;
  }[];
  languages: {
    label: string;
    value: string;
  }[];
}

class EnemApiService {
  private baseUrl = 'https://api.enem.dev/v1';

  async getExams(): Promise<EnemExam[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/exams`);
      return response.data;
    } catch (error) {
      logger.error('Erro ao buscar provas do ENEM:', error);
      throw error;
    }
  }

  async getQuestions(year?: number): Promise<EnemQuestion[]> {
    try {
      if (year) {
        // Buscar questões de um ano específico
        const response = await axios.get(`${this.baseUrl}/exams/${year}/questions`);
        return response.data.questions || [];
      } else {
        // Buscar todas as questões de todos os anos
        const allQuestions: EnemQuestion[] = [];
        const exams = await this.getExams();
        
        for (const exam of exams) {
          try {
            const response = await axios.get(`${this.baseUrl}/exams/${exam.year}/questions`);
            allQuestions.push(...(response.data.questions || []));
          } catch (error) {
            logger.warn(`Não foi possível buscar questões do ano ${exam.year}:`, error);
          }
        }
        
        return allQuestions;
      }
    } catch (error) {
      logger.error('Erro ao buscar questões do ENEM:', error);
      throw error;
    }
  }

  mapDisciplineToSubject(discipline: string): string {
    const disciplineMap: Record<string, string> = {
      'ciencias-humanas': 'História',
      'ciencias-natureza': 'Biologia', 
      'linguagens': 'Português',
      'matematica': 'Matemática'
    };
    return disciplineMap[discipline] || discipline;
  }

  determineDifficulty(year: number): 'easy' | 'medium' | 'hard' {
    // Questões mais antigas tendem a ser consideradas mais fáceis
    if (year <= 2012) return 'easy';
    if (year <= 2018) return 'medium';
    return 'hard';
  }

  convertToQuestionBank(enemQuestion: EnemQuestion): Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'> {
    const correctAlternative = enemQuestion.alternatives.find(alt => alt.isCorrect);
    const correctAnswerIndex = enemQuestion.alternatives.findIndex(alt => alt.isCorrect);
    
    // Construir o texto completo da questão
    let fullQuestion = '';
    if (enemQuestion.alternativesIntroduction) {
      fullQuestion += enemQuestion.alternativesIntroduction + '\n\n';
    }
    if (enemQuestion.context) {
      fullQuestion += enemQuestion.context + '\n\n';
    }
    fullQuestion += enemQuestion.title;
    
    return {
      subject: this.mapDisciplineToSubject(enemQuestion.discipline),
      question: fullQuestion,
      options: enemQuestion.alternatives.map(alt => `${alt.letter}) ${alt.text}`),
      correctAnswerIndex: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
      explanation: correctAlternative?.text || 'Resposta oficial não disponível',
      difficulty: this.determineDifficulty(enemQuestion.year),
      tags: [`${enemQuestion.year}`, enemQuestion.discipline, enemQuestion.language || ''].filter(Boolean)
    };
  }

  async importAllQuestions(): Promise<void> {
    try {
      await AppDataSource.initialize();
      const questionRepository = AppDataSource.getRepository(QuestionBank);

      logger.info('Iniciando importação de questões do ENEM...');
      
      // Buscar todas as questões da API
      const questions = await this.getQuestions();
      logger.info(`Encontradas ${questions.length} questões na API do ENEM`);

      let importedCount = 0;
      let skippedCount = 0;
      const subjectCounts: Record<string, number> = {};

      for (const enemQuestion of questions) {
        try {
          // Verificar se a questão já existe
          const existingQuestion = await questionRepository.findOne({
            where: { 
              question: enemQuestion.title.substring(0, 200) // Busca parcial para evitar problemas com textos longos
            }
          });

          if (existingQuestion) {
            skippedCount++;
            continue;
          }

          const questionData = this.convertToQuestionBank(enemQuestion);
          const question = questionRepository.create(questionData);
          await questionRepository.save(question);
          
          importedCount++;
          subjectCounts[questionData.subject] = (subjectCounts[questionData.subject] || 0) + 1;

          // Log progress a cada 100 questões
          if (importedCount % 100 === 0) {
            logger.info(`Progresso: ${importedCount} questões importadas...`);
          }

        } catch (error) {
          logger.error(`Erro ao importar questão ${enemQuestion.index}:`, error);
        }
      }

      logger.info('\n✅ Importação concluída com sucesso!');
      logger.info(`📊 Total de questões importadas: ${importedCount}`);
      logger.info(`⏭️ Questões puladas (já existentes): ${skippedCount}`);
      logger.info('\n📚 Questões por matéria:');
      Object.entries(subjectCounts).forEach(([subject, count]) => {
        logger.info(`   ${subject}: ${count} questões`);
      });

    } catch (error) {
      logger.error('Erro durante importação:', error);
      throw error;
    } finally {
      await AppDataSource.destroy();
    }
  }

  async importByYear(year: number): Promise<void> {
    try {
      await AppDataSource.initialize();
      const questionRepository = AppDataSource.getRepository(QuestionBank);

      logger.info(`Importando questões do ENEM ${year}...`);
      
      // Buscar provas do ano específico
      const exams = await this.getExams();
      const targetExam = exams.find(exam => exam.year === year);
      
      if (!targetExam) {
        logger.error(`Prova do ano ${year} não encontrada`);
        return;
      }

      // Buscar questões da prova específica
      const questions = await this.getQuestions(targetExam.year);
      logger.info(`Encontradas ${questions.length} questões para o ano ${year}`);

      let importedCount = 0;
      const subjectCounts: Record<string, number> = {};

      for (const enemQuestion of questions) {
        try {
          const questionData = this.convertToQuestionBank(enemQuestion);
          const question = questionRepository.create(questionData);
          await questionRepository.save(question);
          
          importedCount++;
          subjectCounts[questionData.subject] = (subjectCounts[questionData.subject] || 0) + 1;

        } catch (error) {
          logger.error(`Erro ao importar questão ${enemQuestion.index}:`, error);
        }
      }

      logger.info(`\n✅ Importação do ENEM ${year} concluída!`);
      logger.info(`📊 Total importado: ${importedCount} questões`);
      logger.info('\n📚 Por matéria:');
      Object.entries(subjectCounts).forEach(([subject, count]) => {
        logger.info(`   ${subject}: ${count} questões`);
      });

    } catch (error) {
      logger.error('Erro durante importação:', error);
      throw error;
    } finally {
      await AppDataSource.destroy();
    }
  }
}

// Script para execução direta
async function main() {
  const enemService = new EnemApiService();
  
  // Verificar argumentos de linha de comando
  const args = process.argv.slice(2);
  const yearArg = args.find(arg => arg.startsWith('--year='));
  
  if (yearArg) {
    const year = parseInt(yearArg.split('=')[1]);
    if (isNaN(year) || year < 2009 || year > 2023) {
      console.error('Ano inválido. Use --year=2009 a 2023');
      process.exit(1);
    }
    await enemService.importByYear(year);
  } else {
    await enemService.importAllQuestions();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default EnemApiService;
