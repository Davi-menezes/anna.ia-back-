import { config } from '../config/config';
import AppDataSource from '../config/data-source';
import { StudyPlan } from '../entities/StudyPlan';
import { StudyPlanSubject } from '../entities/StudyPlanSubject';
import { WeeklySchedule } from '../entities/WeeklySchedule';
import { User } from '../entities/User';
import { ChatMessage } from '../entities/ChatMessage';
import { logger } from '../utils/logger';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const SIMULADO_MAX_OUTPUT_TOKENS = Number(process.env.SIMULADO_MAX_OUTPUT_TOKENS || 3500);
const SIMULADO_TEMPERATURE = Number(process.env.SIMULADO_TEMPERATURE || 0.7);
const SIMULADO_CACHE_TTL_MS = Number(process.env.SIMULADO_CACHE_TTL_MS || 24 * 60 * 60 * 1000);

const simuladoCache = new Map<string, { expiresAt: number; questions: any[] }>();

async function listGeminiV1Models(apiKey: string): Promise<Array<{ name?: string; supportedGenerationMethods?: string[] }>> {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { method: 'GET' });
    const raw = await res.text();
    if (!res.ok) {
        throw new Error(`Gemini v1 listModels error (${res.status}): ${raw}`);
    }

    const data = JSON.parse(raw);
    return Array.isArray(data?.models) ? data.models : [];
}

function pickGeminiV1Model(models: Array<{ name?: string; supportedGenerationMethods?: string[] }>): string {
    const supported = models
        .map(m => ({
            name: (m.name || '').replace(/^models\//, ''),
            methods: m.supportedGenerationMethods || [],
        }))
        .filter(m => m.name && m.methods.includes('generateContent'))
        .map(m => m.name);

    const preferred = supported.find(n => n.includes('flash')) || supported[0];
    if (!preferred) {
        throw new Error('Gemini v1: nenhum modelo com generateContent encontrado em ListModels.');
    }

    return preferred;
}

async function generateWithGeminiV1(params: {
    apiKey: string;
    model: string;
    prompt: string;
}): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(params.model)}:generateContent`;

    logger.info(`Gemini mode=rest_v1 model=${params.model} url=${url}`);

    const res = await fetch(`${url}?key=${encodeURIComponent(params.apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: params.prompt }] }],
            generationConfig: {
                maxOutputTokens: SIMULADO_MAX_OUTPUT_TOKENS,
                temperature: SIMULADO_TEMPERATURE,
            }
        })
    });

    const raw = await res.text();
    if (!res.ok) {
        throw new Error(`Gemini v1 error (${res.status}): ${raw}`);
    }

    const data = JSON.parse(raw);
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') || '';
    return text;
}

async function generateWithGeminiV1AutoModel(params: {
    apiKey: string;
    model: string;
    prompt: string;
}): Promise<string> {
    try {
        return await generateWithGeminiV1(params);
    } catch (err: any) {
        const msg = String(err?.message || err);
        if (!msg.includes('Gemini v1 error (404)')) {
            throw err;
        }

        logger.warn(`Gemini model not found: ${params.model}. Attempting ListModels fallback.`);
        const models = await listGeminiV1Models(params.apiKey);
        const fallbackModel = pickGeminiV1Model(models);
        logger.warn(`Gemini fallback model selected: ${fallbackModel}`);

        return await generateWithGeminiV1({ ...params, model: fallbackModel });
    }
}

export class StudyPlanService {
    private studyPlanRepository = AppDataSource.getRepository(StudyPlan);
    private subjectRepository = AppDataSource.getRepository(StudyPlanSubject);
    private scheduleRepository = AppDataSource.getRepository(WeeklySchedule);
    private userRepository = AppDataSource.getRepository(User);

    async createInitialPlan(userId: string, data: any) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) throw new Error('Usuário não encontrado');

        // Remove plano existente se houver (restrição 1:1)
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

        // Cria as matérias iniciais com seus níveis de proficiência
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
        if (!config.gemini.apiKey) {
            throw new Error('Serviço de IA indisponível no momento. Tente novamente mais tarde.');
        }
        const plan = await this.studyPlanRepository.findOne({
            where: { id: studyPlanId },
            relations: ['subjects', 'user']
        });

        if (!plan) throw new Error('Plano de estudos não encontrado');

            // Histórico de chat não é mais utilizado aqui para evitar dependência de tabela inexistente
            const chatContext = '';

        const prompt = `
      Você é a Anna, uma mentora de estudos altamente qualificada, empática e motivadora. 
      Seu objetivo é transformar a rotina do aluno em uma jornada de aprovação épica para o ${plan.targetVestibular}.
      
      DADOS DO ALUNO:
      - Tempo disponível: ${plan.availableTimePerDay} minutos por dia.
      - Dias de estudo: ${plan.studyDays.join(', ')}.
      - Diagnóstico de Matérias:
        ${plan.subjects.map(s => `- ${s.subjectName}: Nível ${s.level}/5 (Prioridade atual: ${s.priority}/5)`).join('\n')}
      ${chatContext}
      
      REQUISITOS DO PLANO (Seja o melhor professor particular do mundo):
      1. Distribua as matérias priorizando aquelas com nível baixo (${plan.subjects.filter(s => s.level <= 2).map(s => s.subjectName).join(', ')}) ou prioridade alta e TOCANDO NOS PONTOS DE DÚVIDA RECENTES.
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
            const text = await generateWithGeminiV1AutoModel({
                apiKey: config.gemini.apiKey,
                model: GEMINI_MODEL,
                prompt
            });

            // Extrai JSON da resposta (LLMs às vezes envolvem com blocos markdown)
            const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
            const planContent = JSON.parse(jsonStr);

            const schedule = new WeeklySchedule();
            schedule.studyPlan = plan;
            schedule.startDate = new Date();
            schedule.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            schedule.content = planContent;
            schedule.isActive = true;

            // Desativa os cronogramas semanais anteriores
            await this.scheduleRepository.update({ studyPlan: { id: studyPlanId }, isActive: true }, { isActive: false });

            return await this.scheduleRepository.save(schedule);
        } catch (error) {
            logger.error('Erro ao gerar plano com Gemini:', error);
            throw new Error('Não conseguimos gerar seu plano de estudos no momento. Por favor, tente novamente em alguns instantes.');
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
            // Encontra o cronograma ativo (relações do TypeORM são arrays)
            (plan as any).activeSchedule = plan.schedules.find(s => s.isActive);
        }

        return plan;
    }

    async generateSimulado(subject: string) {
        if (!config.gemini.apiKey) {
            throw new Error('Serviço de IA indisponível no momento. Tente novamente mais tarde.');
        }
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateSeed = `${yyyy}-${mm}-${dd}`;

        const cacheKey = `simulado:${subject}:${dateSeed}:${GEMINI_MODEL}`;
        const cached = simuladoCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            logger.info(`Simulado cache hit: ${cacheKey}`);
            return cached.questions;
        }

        const prompt = `
            Você é um especialista em criar provas e simulados.
            Gere um simulado de 30 questões de múltipla escolha sobre o tema "${subject}".

            Regras de VARIAÇÃO DIÁRIA:
            - Data do dia: ${dateSeed}. Gere questões inéditas para esta data.
            - Use uma semente determinística: "seed:${subject}:${dateSeed}" para garantir rotatividade diária.

            REGRAS OBRIGATÓRIAS:
            1.  As questões devem cobrir uma variedade de tópicos dentro de "${subject}".
            2.  As questões devem ter diferentes níveis de dificuldade (fácil, médio, difícil).
            3.  Cada questão deve ter 4 opções de resposta.
            4.  A resposta correta deve ser claramente indicada.
            5.  Inclua uma breve explicação para a resposta correta.

            FORMATO DE RESPOSTA (JSON APENAS, um array de 30 objetos):
            [
              {
                "subject": "${subject}",
                "question": "Texto da pergunta aqui...",
                "options": [
                  "Opção A",
                  "Opção B",
                  "Opção C",
                  "Opção D"
                ],
                "correctAnswerIndex": 0,
                "explanation": "Explicação concisa do porquê esta é a resposta correta."
              }
            ]
        `;

        logger.info(`Simulado prompt size: subject=${subject} dateSeed=${dateSeed} promptChars=${prompt.length}`);

        try {
            const text = await generateWithGeminiV1AutoModel({
                apiKey: config.gemini.apiKey,
                model: GEMINI_MODEL,
                prompt
            });

            logger.info(`Gemini response length: ${text.length} chars`);

            // Try multiple JSON extraction strategies
            let jsonStr = text;

            // Estratégia 1: busca array JSON
            const arrayMatch = text.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                jsonStr = arrayMatch[0];
            } else {
                // Estratégia 2: busca objeto JSON (caso esteja encapsulado)
                const objectMatch = text.match(/\{[\s\S]*\}/);
                if (objectMatch) {
                    jsonStr = objectMatch[0];
                }
            }

            // Corrige problemas comuns de JSON gerado por LLMs
            jsonStr = jsonStr
                .replace(/,\s*}/g, '}')  // Remove vírgulas extras antes de }
                .replace(/,\s*]/g, ']')  // Remove vírgulas extras antes de ]
                .replace(/\\n/g, '\\\\n')  // Escapa quebras de linha
                .replace(/\\"/g, '\\\\"')  // Escapa aspas
                .trim();

            logger.info(`Attempting to parse JSON, first 200 chars: ${jsonStr.substring(0, 200)}...`);

            const questions = JSON.parse(jsonStr);

            // Valida que o simulado contém exatamente 30 questões
            if (!Array.isArray(questions) || questions.length !== 30) {
                throw new Error(`Formato inválido: o simulado deve conter exatamente 30 questões. Recebido: ${Array.isArray(questions) ? questions.length : 'não é array'}`);
            }

            simuladoCache.set(cacheKey, {
                expiresAt: Date.now() + SIMULADO_CACHE_TTL_MS,
                questions
            });

            // Adiciona IDs sequenciais às questões
            const questionsWithIds = questions.map((q: any, index: number) => ({
                ...q,
                id: index,
            }));

            return questionsWithIds;
        } catch (error: any) {
            logger.error('Erro ao gerar simulado com Gemini:', error);

            throw new Error('Não conseguimos gerar seu simulado no momento. Tente novamente.');
        }
    }
}
