import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { stripeWebhook, mercadopagoWebhook } from '../controllers/payment.controller';

const router = Router();

// Rate limiting para webhook - limita a 100 requisições por hora por IP
const webhookLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100, // limite de 100 requisições por hora
  message: {
    success: false,
    error: 'Muitas tentativas de webhook. Tente novamente em uma hora.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Permite burst limitado para webhooks legítimos
  skip: (req) => {
    return false;
  }
});

// Webhook do Stripe
router.post('/stripe-webhook', stripeWebhook);

// Webhook do Mercado Pago
router.post('/mercadopago-webhook', mercadopagoWebhook);

export default router;

