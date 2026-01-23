import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import passport from 'passport';
import { config } from './config/config';
import { routeNotFound } from './middlewares/route-not-found';
import { errorHandler } from './middlewares/error-handler';
import { logger } from './utils/logger';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import geminiRoutes from './routes/gemini.routes';
import studyPlanRoutes from './routes/study-plan.routes';
import paymentRoutes from './routes/payment.routes';

// Import Passport Configuration
import './config/passport';

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  // CORS configuration
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

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize Passport
  app.use(passport.initialize());

  // Logging middleware
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Google OAuth Fail-safe Redirect (handles old URIs without /v1)
  app.get('/api/auth/google/callback', (req, res) => {
    logger.info('Redirecting old OAuth callback to v1');
    const queryString = new URLSearchParams(req.query as any).toString();
    res.redirect(301, `${config.apiPrefix}/auth/google/callback?${queryString}`);
  });

  // Log configurations
  logger.info(`Google Callback URL: ${config.oauth.google.callbackURL}`);

  // API routes
  app.use(`${config.apiPrefix}/auth`, authRoutes);
  app.use(`${config.apiPrefix}/users`, userRoutes);
  app.use(`${config.apiPrefix}/gemini`, geminiRoutes);
  app.use(`${config.apiPrefix}/study-plans`, studyPlanRoutes);

  // Payment routes (webhook não deve ter o prefixo da API para facilitar a configuração no Mercado Pago)
  app.use('/api/payments', paymentRoutes);

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (res, filePath) => {
      // Set appropriate headers for security
      if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') ||
        filePath.endsWith('.png') || filePath.endsWith('.gif')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    }
  }));

  // 404 handler
  app.use(routeNotFound);

  // Error handler
  app.use(errorHandler);

  return app;
}