import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente
// Carrega as variáveis de ambiente do arquivo .env padrão
dotenv.config();

export const config = {
  // Configurações do servidor
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  apiPrefix: '/api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'sua_chave_secreta_aqui',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Banco de Dados
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/anna-ia',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // SMTP
  smtp: {
    host: (process.env.SMTP_HOST || 'smtp.gmail.com').replace(/"/g, ''),
    port: parseInt((process.env.SMTP_PORT || '587').replace(/"/g, ''), 10),
    secure: (process.env.SMTP_SECURE || 'false').replace(/"/g, '') === 'true',
    user: (process.env.SMTP_USER || '').replace(/"/g, ''),
    pass: (process.env.SMTP_PASS || '').replace(/"/g, ''),
    from: (process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@annaia.com').replace(/"/g, ''),
  },

  // OAuth
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 's462507580682-vqm8bl9br5c27834c4hgr4ktebj71qbh.apps.googleusercontent.com',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOCSPX-4b4Y4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback',
      frontendCallbackURL: process.env.FRONTEND_CALLBACK_URL || 'http://localhost:4200/auth/callback',
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      tenant: process.env.MICROSOFT_TENANT || 'common',
      callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3001/api/auth/microsoft/callback',
    },
  },

  // Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  // Mercado Pago
  mercadopago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-4913856119180299-010815-e07478d53a7150a5b525aa42a4d20028-1401398354',
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || 'APP_USR-fadad404-de6b-43d8-a949-7b2976282a31',
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '5b4c8978487eef0dc4957b80e834e848668677763ea8bab8fcf45c7e79d1b996',
  },
};

export type Config = typeof config;