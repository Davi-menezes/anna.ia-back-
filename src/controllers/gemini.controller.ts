import { Request, Response } from 'express';
import { config } from '../config/config';
import { User } from '../entities/User';
import { ChatMessage } from '../entities/ChatMessage';
import AppDataSource from '../config/data-source';
import { logger } from '../utils/logger';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

const CHAT_MAX_HISTORY_MESSAGES = Number(process.env.CHAT_MAX_HISTORY_MESSAGES || 8);
const CHAT_MAX_PROMPT_CHARS = Number(process.env.CHAT_MAX_PROMPT_CHARS || 4000);
const CHAT_MAX_OUTPUT_TOKENS = Number(process.env.CHAT_MAX_OUTPUT_TOKENS || 4096);
const CHAT_TEMPERATURE = Number(process.env.CHAT_TEMPERATURE || 0.7);

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
    imageBase64?: string;
    imageMimeType?: string;
}): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(params.model)}:generateContent`;

    // Monta as partes do último turno do usuário (texto + imagem opcional)
    const userParts: Array<Record<string, unknown>> = [{ text: params.prompt }];
    if (params.imageBase64 && params.imageMimeType) {
        userParts.push({
            inline_data: {
                mime_type: params.imageMimeType,
                data: params.imageBase64
            }
        });
    }

    const contents = [
        ...(params.history || []).map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        { role: 'user', parts: userParts }
    ];

    logger.info(`Gemini mode=rest_v1 model=${params.model} url=${url}`);

    const res = await fetch(`${url}?key=${encodeURIComponent(params.apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents,
            generationConfig: {
                maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
                temperature: CHAT_TEMPERATURE,
            }
        })
    });

    const raw = await res.text();
    if (!res.ok) {
        if (res.status === 429) {
            throw new Error(`GEMINI_QUOTA_EXCEEDED: ${raw}`);
        }
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
    imageBase64?: string;
    imageMimeType?: string;
}, attempt: number = 0): Promise<string> {
    try {
        return await generateWithGeminiV1(params);
    } catch (err: any) {
        const msg = String(err?.message || err);
        const isQuotaError = msg.includes('GEMINI_QUOTA_EXCEEDED') || msg.includes('429');
        const isNotFoundError = msg.includes('Gemini v1 error (404)');

        if (isQuotaError && attempt < 2) {
            const delay = 2000 * (attempt + 1);
            logger.warn(`Gemini quota exceeded (429). Retrying in ${delay}ms... (attempt ${attempt + 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return await generateWithGeminiV1AutoModel(params, attempt + 1);
        }

        if (isNotFoundError || (isQuotaError && params.model !== 'gemini-1.5-flash')) {
            const fallbackModel = isNotFoundError ? null : 'gemini-1.5-flash';

            if (isNotFoundError) {
                logger.warn(`Gemini model not found: ${params.model}. Attempting ListModels fallback.`);
                const models = await listGeminiV1Models(params.apiKey);
                const selectedFallback = pickGeminiV1Model(models);
                logger.warn(`Gemini fallback model selected: ${selectedFallback}`);
                return await generateWithGeminiV1({ ...params, model: selectedFallback });
            } else {
                logger.warn(`Gemini quota exceeded for ${params.model}. Falling back to gemini-1.5-flash.`);
                return await generateWithGeminiV1AutoModel({ ...params, model: 'gemini-1.5-flash' }, 0);
            }
        }

        throw err;
    }
}

export const generateResponse = async (req: Request, res: Response) => {
    try {
        const { prompt, history, imageBase64, imageMimeType } = req.body;
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

        if (!prompt && !imageBase64) {
            return res.status(400).json({
                success: false,
                message: 'O prompt ou uma imagem são obrigatórios',
            });
        }

        if (imageBase64 && imageBase64.length > 10_000_000) {
            return res.status(413).json({
                success: false,
                message: 'Imagem muito grande. Envie imagens com menos de 7 MB.',
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

        // Todos os usuários, incluindo premium, consomem créditos
        if (currentCredits < creditCost) {
            logger.warn(`User ${user.id} out of credits: ${currentCredits} < ${creditCost}`);
            return res.status(403).json({
                success: false,
                message: 'Créditos insuficientes para usar o chat',
                code: 'OUT_OF_CREDITS'
            });
        }

        // Deduz créditos antes de chamar a IA
        const newCredits = currentCredits - creditCost;
        existingUser.credits = Math.round(newCredits * 100) / 100;
        await userRepository.save(existingUser);

        let text = '';
        try {
            const systemPrompt = `Atue como um Professor Profissional Altamente Qualificado e Especialista em Didática.

SUA PERSONALIDADE E MÉTODO:
- Você é paciente, encorajador e extremamente claro.
- **IMPORTANTE**: Responda à pergunta do aluno de forma DIRETA, COMPLETA e PRECISA logo no início. NÃO use introduções excessivamente longas ou genéricas antes de fornecer a informação solicitada.
- **REGRAS DE FORMATAÇÃO ESTRITAS**:
    - **USE LaTeX** para TODAS as fórmulas matemáticas, equações e símbolos científicos.
    - Para fórmulas na linha (inline), use EXATAMENTE o formato: $fórmula$ — exemplo: $\\sqrt{4} = 2$, $x^2$, $2 \\times 2 = 4$.
    - Para blocos destacados (display), use EXATAMENTE o formato: $$fórmula$$ — exemplo: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
    - NUNCA use parênteses simples (fórmula) para delimitar LaTeX. Use SEMPRE $ ou $$.
    - Use Markdown para estruturar a resposta: **negrito** para ênfase, títulos com ## e listas se necessário.
    - Evite separadores como "***" ou "---" em excesso.
- Explique os conceitos de forma DETALHADA, mas usando linguagem SIMPLES e INTUITIVA.
- Use analogias do dia a dia para facilitar o entendimento.
- Se a pergunta envolver fórmulas ou cálculos (como Bhaskara ou Raízes), forneça a fórmula completa, o passo a passo da resolução e o resultado final de forma bem estruturada.
- O objetivo é que o aluno saia da conversa tendo entendido o "porquê" e o "como", não apenas a resposta.

REGRA FUNDAMENTAL — NUNCA DÊ SÓ A RESPOSTA:
- Se o aluno pedir apenas o resultado ("me dê só a resposta", "qual é o resultado", "só me fala a resposta", "me dá a solução logo", "sem explicação" ou variantes), recuse e explique o motivo:
  "Meu papel é te ensinar, não apenas fornecer respostas prontas! Isso não te ajudaria a aprender. Vamos resolver juntos passo a passo — você vai entender e conseguirá resolver sozinho nas próximas vezes. Pode me enviar o problema completo?"

REGRAS ESTRITAS DE CONTEÚDO:
- Você ACEITA APENAS perguntas relacionadas a MATÉRIAS ESCOLARES (Português, Matemática, História, Geografia, Biologia, Química, Física, Filosofia, Sociologia, Inglês, Literatura, Redação) e preparação para VESTIBULARES/ENEM.
- Se o usuário perguntar sobre qualquer outro assunto, recuse educadamente com a mensagem padrão abaixo.

MENSAGEM DE RECUSA PADRÃO (fora do escopo escolar):
"Desculpe, mas como seu professor virtual, meu foco é exclusivamente ajudar você em seus estudos e matérias escolares. Vamos voltar para o aprendizado? O que você está estudando hoje?"`;

            const historyRaw = (history || []).map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                content: msg.content
            }));

            const firstUserIndex = historyRaw.findIndex((m: { role: 'user' | 'model'; content: string }) => m.role === 'user');
            const trimmedHistory = firstUserIndex >= 0 ? historyRaw.slice(firstUserIndex) : [];
            const safeHistory = trimmedHistory.slice(Math.max(0, trimmedHistory.length - CHAT_MAX_HISTORY_MESSAGES));

            const normalizedPrompt = String(prompt || '').slice(0, CHAT_MAX_PROMPT_CHARS);

            logger.info(`Chat payload sizes: promptChars=${normalizedPrompt.length} historyMessages=${safeHistory.length}`);

            text = await generateWithGeminiV1AutoModel({
                apiKey: config.gemini.apiKey,
                model: GEMINI_MODEL,
                history: safeHistory,
                prompt: `${systemPrompt}\n\nPergunta do aluno: ${normalizedPrompt}`,
                imageBase64: imageBase64 || undefined,
                imageMimeType: imageMimeType || undefined,
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
        // Estorna créditos em caso de falha transitória
        logger.error('Erro na geração Gemini, estornando créditos:', respError);

        existingUser.credits = currentCredits; // Restaura os créditos originais
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
        logger.error('CRITICAL ERROR in generateResponse:', {
            message: error.message,
            stack: error.stack,
            userId: req.user?.id,
            promptLength: req.body?.prompt?.length
        });

        const errorMessage = error.message || '';
        if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid')) {
            return res.status(503).json({
                success: false,
                message: 'Configuração da IA inválida no servidor. Verifique a GEMINI_API_KEY no ambiente de produção.',
                code: 'GEMINI_API_KEY_INVALID'
            });
        }

        if (errorMessage.includes('GEMINI_QUOTA_EXCEEDED') || errorMessage.includes('429')) {
            return res.status(429).json({
                success: false,
                message: 'O serviço de IA está temporariamente indisponível devido a alta demanda (limite de cota excedido). Por favor, tente novamente em alguns minutos.',
                code: 'GEMINI_QUOTA_EXCEEDED'
            });
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
