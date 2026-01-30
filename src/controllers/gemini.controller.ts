import { Request, Response } from 'express';
import { config } from '../config/config';
import { User } from '../entities/User';
import { ChatMessage } from '../entities/ChatMessage';
import AppDataSource from '../config/data-source';
import { logger } from '../utils/logger';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

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
    history?: Array<{ role: 'user' | 'model'; content: string }>;
    prompt: string;
}): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(params.model)}:generateContent`;

    const contents = [
        ...(params.history || []).map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        { role: 'user', parts: [{ text: params.prompt }] }
    ];

    logger.info(`Gemini mode=rest_v1 model=${params.model} url=${url}`);

    const res = await fetch(`${url}?key=${encodeURIComponent(params.apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents,
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
    history?: Array<{ role: 'user' | 'model'; content: string }>;
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

export const generateResponse = async (req: Request, res: Response) => {
    try {
        const { prompt, history } = req.body;
        const user = req.user;

        logger.info(`Gemini API Key present: ${!!config.gemini.apiKey}`);
        logger.info(`Gemini user from req: ${user?.id}`);

        if (!config.gemini.apiKey) {
            logger.error('Gemini API Key is missing (GEMINI_API_KEY).');
            return res.status(503).json({
                success: false,
                message: 'Serviço de IA indisponível no momento. Tente novamente mais tarde.'
            });
        }

        if (!user) {
            logger.warn('generateResponse: No user in request');
            return res.status(401).json({
                success: false,
                message: 'Não autorizado',
            });
        }

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'O prompt é obrigatório',
            });
        }

        const userRepository = AppDataSource.getRepository(User);
        let existingUser: any;
        try {
            existingUser = await userRepository.findOneBy({ id: user.id });
        } catch (dbErr) {
            logger.error('Error fetching user from DB in chat:', dbErr);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar usuário no banco de dados',
            });
        }

        if (!existingUser) {
            logger.warn(`generateResponse: User ${user.id} not found in DB`);
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado',
            });
        }

        const creditCost = 0.5;
        const currentCredits = Number(existingUser.credits);

        logger.info(`Credits check for user ${user.id}: current=${currentCredits}, cost=${creditCost}`);

        // All users, including premium, consume credits now
        if (currentCredits < creditCost) {
            logger.warn(`User ${user.id} out of credits: ${currentCredits} < ${creditCost}`);
            return res.status(403).json({
                success: false,
                message: 'Créditos insuficientes para usar o chat',
                code: 'OUT_OF_CREDITS'
            });
        }

        // Deduct credits before calling AI
        const newCredits = currentCredits - creditCost;
        existingUser.credits = Math.round(newCredits * 100) / 100;
        await userRepository.save(existingUser);

        let text = '';
        try {
            const systemPrompt = `Atue como um Professor Profissional Altamente Qualificado e Especialista em Didática.
                
SUA PERSONALIDADE:
- Você é paciente, encorajador e extremamente claro.
- Explique tudo de forma DETALHADA, mas usando linguagem SIMPLES e INTUITIVA.
- Use analogias do dia a dia para facilitar o entendimento.
- O objetivo é que QUALQUER pessoa, independente do nível de conhecimento, consiga entender a explicação.

REGRAS ESTRITAS DE CONTEÚDO:
- Você ACEITA APENAS perguntas relacionadas a MATÉRIAS ESCOLARES (Português, Matemática, História, Geografia, Biologia, Química, Física, Filosofia, Sociologia, Inglês, Literatura, Redação) e preparação para VESTIBULARES/ENEM.
- Se o usuário perguntar sobre qualquer outro assunto (como fofocas, receitas culinárias, conselhos de relacionamento, notícias de famosos, política não-relacionada a estudos, jogos, etc.), você deve recusar educadamente.

MENSAGEM DE RECUSA PADRÃO:
"Desculpe, mas como seu professor virtual, meu foco é exclusivamente ajudar você em seus estudos e matérias escolares. Vamos voltar para o aprendizado? O que você está estudando hoje?"`;

            const historyRaw = (history || []).map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                content: msg.content
            }));

            const firstUserIndex = historyRaw.findIndex((m: { role: 'user' | 'model'; content: string }) => m.role === 'user');
            const safeHistory = firstUserIndex >= 0 ? historyRaw.slice(firstUserIndex) : [];

            text = await generateWithGeminiV1AutoModel({
                apiKey: config.gemini.apiKey,
                model: GEMINI_MODEL,
                history: safeHistory,
                prompt: `${systemPrompt}\n\nPergunta do aluno: ${prompt}`
            });

            if (!text) {
                logger.warn('Gemini returned empty text or was blocked');
                text = 'Desculpe, não consegui gerar uma resposta para isso. Poderia reformular sua pergunta?';
            }

            logger.info(`Chat response generated successfully for user ${user.id}`);

            res.status(200).json({
                success: true,
                content: text,
                credits: existingUser.credits
            });
        } catch (respError: any) {
            // REFUND CREDITS if it's a transient failure
            logger.error('Error during Gemini generation, refunding credits:', respError);

            existingUser.credits = currentCredits; // Restore original credits
            await userRepository.save(existingUser);

            if (respError.message?.includes('SAFETY')) {
                return res.status(200).json({
                    success: true,
                    content: 'Desculpe, mas não posso responder a essa pergunta por questões de segurança ou política de conteúdo. Vamos tentar outro assunto escolar?',
                    credits: existingUser.credits
                });
            }

            throw respError;
        }
    } catch (error: any) {
        logger.error('Error in Gemini controller:', error);

        // Log more details if it's a Gemini error
        if (error.response) {
            logger.error('Gemini error response data:', JSON.stringify(error.response.data));
        }

        res.status(500).json({
            success: false,
            message: 'Erro ao processar sua pergunta. Tente novamente.',
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack,
                detail: error.response?.data
            } : undefined,
        });
    }
};
