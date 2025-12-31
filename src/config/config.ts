import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente
dotenv.config({
  path: path.resolve(process.cwd(), process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development')
});

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
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'no-reply@annaia.com',
  },

  // OAuth
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      tenant: process.env.MICROSOFT_TENANT || 'common',
      callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3001/api/auth/microsoft/callback',
    },
  },

  // Mercado Pago
  mercadoPago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
  },

  // Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
};

export type Config = typeof config;