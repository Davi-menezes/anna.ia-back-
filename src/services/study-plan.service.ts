import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config';
import AppDataSource from '../config/data-source';
import { StudyPlan } from '../entities/StudyPlan';
import { StudyPlanSubject } from '../entities/StudyPlanSubject';
import { WeeklySchedule } from '../entities/WeeklySchedule';
import { User } from '../entities/User';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export class StudyPlanService {
    private studyPlanRepository = AppDataSource.getRepository(StudyPlan);
    private subjectRepository = AppDataSource.getRepository(StudyPlanSubject);
    private scheduleRepository = AppDataSource.getRepository(WeeklySchedule);
    private userRepository = AppDataSource.getRepository(User);

    async createInitialPlan(userId: string, data: any) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) throw new Error('Usuário não encontrado');

        // Delete existing plan if any (due to 1:1 constraint)
        const existingPlan = await this.studyPlanRepository.findOne({
            where: { user: { id: userId } }
        });
        if (existingPlan) {
            await this.studyPlanRepository.remove(existingPlan);
        }

        const studyPlan = new StudyPlan();
        studyPlan.user = user;
        studyPlan.targetVestibular = data.targetVestibular;
        studyPlan.availableTimePerDay = data.availableTimePerDay;
        studyPlan.studyDays = data.studyDays;

        const savedPlan = await this.studyPlanRepository.save(studyPlan);

        // Initial subjects with level
        const subjects = data.subjects.map((s: any) => {
            const subject = new StudyPlanSubject();
            subject.studyPlan = savedPlan;
            subject.subjectName = s.name;
            subject.level = s.level;
            subject.priority = 3; // Initial medium priority
            return subject;
        });

        await this.subjectRepository.save(subjects);
        return savedPlan;
    }

    async generateWeeklyPlan(studyPlanId: string) {
        const plan = await this.studyPlanRepository.findOne({
            where: { id: studyPlanId },
            relations: ['subjects', 'user']
        });

        if (!plan) throw new Error('Plano de estudos não encontrado');

        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' }, { apiVersion: 'v1beta' });

        const prompt = `
      Você é a Anna, uma mentora de estudos altamente qualificada, empática e motivadora. 
      Seu objetivo é transformar a rotina do aluno em uma jornada de aprovação épica para o ${plan.targetVestibular}.
      
      DADOS DO ALUNO:
      - Tempo disponível: ${plan.availableTimePerDay} minutos por dia.
      - Dias de estudo: ${plan.studyDays.join(', ')}.
      - Diagnóstico de Matérias:
        ${plan.subjects.map(s => `- ${s.subjectName}: Nível ${s.level}/5 (Prioridade atual: ${s.priority}/5)`).join('\n')}
      
      REQUISITOS DO PLANO (Seja o melhor professor particular do mundo):
      1. Distribua as matérias priorizando aquelas com nível baixo (${plan.subjects.filter(s => s.level <= 2).map(s => s.subjectName).join(', ')}) ou prioridade alta.
      2. Divida o tempo diário de ${plan.availableTimePerDay}min entre Teoria (30%), Prática/Exercícios (50%) e Revisão (20%).
      3. Forneça "Dicas de Mestre" (tips) práticas: como memorizar, que tipo de exercício buscar ou um "hack" da matéria.
      4. A "Mensagem da Mentora" deve ser curta, inspiradora e citar o vestibular alvo (${plan.targetVestibular}).
      5. O "Objetivo da Semana" deve ser claro e focado em evolução.
      
      FORMATO DE RESPOSTA (JSON APENAS):
      {
        "weekGoal": "String curta e impactante",
        "days": [
          {
            "day": "segunda",
            "subjects": [
              { "name": "Matemática", "time": 60, "topics": ["Tópico A", "Tópico B"], "tips": "Dica prática de professor para esse tópico" }
            ]
          }
        ],
        "mentorMessage": "Mensagem carinhosa e motivacional da Anna"
      }
    `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from response if needed (sometimes LLMs wrap in markdown)
            const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
            const planContent = JSON.parse(jsonStr);

            const schedule = new WeeklySchedule();
            schedule.studyPlan = plan;
            schedule.startDate = new Date();
            schedule.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            schedule.content = planContent;
            schedule.isActive = true;

            // Deactivate previous active schedules
            await this.scheduleRepository.update({ studyPlan: { id: studyPlanId }, isActive: true }, { isActive: false });

            return await this.scheduleRepository.save(schedule);
        } catch (error) {
            logger.error('Erro ao gerar plano com Gemini:', error);
            throw new Error('Falha ao gerar plano de estudos inteligente');
        }
    }

    async updateSubjectPriority(studyPlanId: string, subjectName: string, performance: 'good' | 'average' | 'bad') {
        const subject = await this.subjectRepository.findOne({
            where: {
                studyPlan: { id: studyPlanId },
                subjectName: subjectName
            }
        });

        if (!subject) return;

        if (performance === 'bad') {
            subject.priority = Math.min(5, subject.priority + 1);
        } else if (performance === 'good') {
            subject.priority = Math.max(1, subject.priority - 1);
        }

        await this.subjectRepository.save(subject);
    }

    async findActivePlan(userId: string) {
        const plan = await this.studyPlanRepository.findOne({
            where: { user: { id: userId } },
            relations: ['subjects', 'schedules']
        });

        if (plan && plan.schedules) {
            // Sort schedules by date and find the active one
            // TypeORM's relations are arrays, so we find the one where isActive is true
            (plan as any).activeSchedule = plan.schedules.find(s => s.isActive);
        }

        return plan;
    }
}
