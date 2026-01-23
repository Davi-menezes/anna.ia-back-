import { Request, Response } from 'express';
import { handleStripeWebhook, handleMercadoPagoWebhook } from '../services/payment.service';
import Stripe from 'stripe';
import { config } from '../config/config';

let stripeInstance: Stripe | null = null;

const getStripe = () => {
  if (!stripeInstance) {
    if (!config.stripe.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in the environment');
    }
    stripeInstance = new Stripe(config.stripe.secretKey);
  }
  return stripeInstance;
};

const NOT_IMPLEMENTED_MESSAGE = 'Checkout removido: pagamentos agora são realizados por links externos.';

export const createPreference = async (req: Request, res: Response) => {
  res.status(410).json({ success: false, message: NOT_IMPLEMENTED_MESSAGE });
};

export const processPayment = async (req: Request, res: Response) => {
  res.status(410).json({ success: false, message: NOT_IMPLEMENTED_MESSAGE });
};

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = config.stripe.webhookSecret;

  if (!sig || !endpointSecret) {
    console.error('Stripe signature or endpoint secret missing');
    return res.status(400).send('Webhook Error: Missing signature or secret');
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Stripe signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Processar o evento
  try {
    const result = await handleStripeWebhook(event);
    if (result.success) {
      return res.status(200).json({ received: true });
    } else {
      console.error('Erro ao processar evento do Stripe:', result.error);
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Erro no processamento do webhook do Stripe:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

export const mercadopagoWebhook = async (req: Request, res: Response) => {
  // O Mercado Pago envia topic e id na query string
  const topic = (req.query.topic as string) || (req.query.type as string);
  const id = (req.query.id as string) || (req.query['data.id'] as string);

  if (!topic || !id) {
    // Às vezes o MP envia uma notificação vazia para testar o endpoint
    return res.status(200).send('OK');
  }

  try {
    const result = await handleMercadoPagoWebhook(topic, id);
    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      console.error('Erro ao processar webhook do Mercado Pago:', result.error);
      // Retornamos 200 para evitar que o MP continue tentando infinitamente se for um erro esperado
      return res.status(200).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Erro no processamento do webhook do Mercado Pago:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

