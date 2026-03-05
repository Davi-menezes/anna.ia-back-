import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { routeNotFound } from './middlewares/route-not-found';
import { errorHandler } from './middlewares/error-handler';
import { logger } from './utils/logger';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import geminiRoutes from './routes/gemini.routes';
import studyPlanRoutes from './routes/study-plan.routes';
import paymentRoutes from './routes/payment.routes';
import flashcardsRoutes from './routes/flashcards.routes';
import questionGoalsRoutes from './routes/question-goals.routes';
import flashcardsEnhancedRoutes from './routes/flashcards-enhanced.routes';
import studyPlanEnhancedRoutes from './routes/study-plan-enhanced.routes';
import simuladoRoutes from './routes/simulado.routes';

// Importa configuração do Passport
import './config/passport';

export function createApp(): Application {
  const app = express();

  // Middlewares de segurança
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  // Configuração de CORS
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:3000',
    'https://annaia.vercel.app',
    /\.vercel\.app$/ // Permite qualquer subdomínio da Vercel (previews)
  ];
  const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Permite requisições sem origem (como mobile apps ou curl)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) return allowed.test(origin);
        return allowed === origin;
      });

      if (!isAllowed) {
        logger.warn(`CORS BLOQUEADO: Origem ${origin} não autorizada.`);
        const msg = `A política CORS para ${origin} não permite acesso.`;
        return callback(new Error(msg), false);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'stripe-signature'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600, // tempo em segundos que o navegador pode cachear a resposta de preflight
    optionsSuccessStatus: 204 // Alguns navegadores (Chrome, Firefox) esperam 204 para OPTIONS
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions)); // Habilitar preflight para todas as rotas

  // Middleware para Webhook do Stripe (precisa do corpo raw para verificar assinatura)
  app.use('/api/payments/stripe-webhook', express.raw({ type: 'application/json' }));

  // Limite maior necessário para envio de imagens em base64 via chat (até 7 MB → ~9,3 MB em base64)
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Inicializa o Passport
  app.use(passport.initialize());

  // Middleware de log de requisições
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Rate limiting para Chat (GEMINI) - 15 requisições por minuto por IP
  const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 15,
    message: {
      success: false,
      message: 'Muitas requisições no chat. Tente novamente em alguns segundos.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Rate limiting para Flashcards - 10 requisições por minuto por IP
  const flashcardsLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 10,
    message: {
      success: false,
      message: 'Muitas requisições para gerar flashcards. Tente novamente em alguns segundos.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Endpoint de verificação de saúde do servidor
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/api/v1/diagnostics/gemini', (req, res) => {
    res.status(200).json({
      success: true,
      gemini: {
        mode: 'rest_v1',
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        apiKeyPresent: !!config.gemini.apiKey,
      },
    });
  });

  // Redirecionamento de segurança do OAuth Google (URIs antigas sem /v1)
  app.get('/api/auth/google/callback', (req, res) => {
    logger.info('Redirecionando callback OAuth antigo para /v1');
    const queryString = new URLSearchParams(req.query as any).toString();
    res.redirect(301, `${config.apiPrefix}/auth/google/callback?${queryString}`);
  });

  // Log das configurações de rota
  logger.info(`Google Callback URL: ${config.oauth.google.callbackURL}`);

  // Rotas da API
  app.use(`${config.apiPrefix}/auth`, authRoutes);
  app.use(`${config.apiPrefix}/users`, userRoutes);
  
  // Aplicar rate limiting nas rotas do chat (gemini)
  app.use(`${config.apiPrefix}/gemini`, chatLimiter, geminiRoutes);
  
  app.use(`${config.apiPrefix}/study-plans`, studyPlanRoutes);
  app.use(`${config.apiPrefix}/flashcards`, flashcardsRoutes);
  
  // Aplicar rate limiting nas rotas de flashcards enhanced
  app.use(`${config.apiPrefix}/flashcards-enhanced`, flashcardsLimiter, flashcardsEnhancedRoutes);
  
  app.use(`${config.apiPrefix}/study-plan-enhanced`, studyPlanEnhancedRoutes);
  app.use(`${config.apiPrefix}/question-goals`, questionGoalsRoutes);
  app.use(`${config.apiPrefix}/simulado`, simuladoRoutes);

  // Payment routes (webhook não deve ter o prefixo da API para facilitar a configuração no Mercado Pago)
  app.use('/api/payments', paymentRoutes);

  // Servir arquivos enviados pelos usuários
  app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (res, filePath) => {
      // Define cabeçalhos de cache para imagens
      if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') ||
        filePath.endsWith('.png') || filePath.endsWith('.gif')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    }
  }));

  // Handler de rota não encontrada (404)
  app.use(routeNotFound);

  // Handler global de erros
  app.use(errorHandler);

  return app;
}