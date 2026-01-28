import AppDataSource from '../config/data-source';
import { User } from '../entities/User';
import Stripe from 'stripe';
import { MercadoPagoConfig, Payment, MerchantOrder, PreApproval } from 'mercadopago';
import { config } from '../config/config';
import { UserStatus } from '../entities/User';

// Inicializa o cliente do Mercado Pago
const mpClient = new MercadoPagoConfig({
  accessToken: config.mercadopago.accessToken
});

// Função auxiliar para calcular créditos com base no valor pago
function calcularCreditos(valor: number): number {
  // Lógica de conversão de valor para créditos baseada em planos comuns
  // 7,90 = 10 créditos
  // 19,90 = 50 créditos
  // 39,90 = 150 créditos
  // 59,90 = Plano Premium (500)

  if (valor >= 59.90) {
    return 500; // Plano Premium
  } else if (valor >= 39.90) {
    return 150; // Plano avançado
  } else if (valor >= 19.90) {
    return 50; // Plano intermediário
  } else if (valor >= 7.90) {
    return 10; // Plano básico
  } else {
    // Para valores menores ou personalizados, 1 crédito por real
    return Math.max(1, Math.floor(valor));
  }
}

export const handleStripeWebhook = async (event: Stripe.Event) => {
  const logger = require('../utils/logger').logger;
  // ... (existing stripe logic)
  try {
    logger.info('Processing Stripe webhook event', {
      type: event.type,
      id: event.id
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const amount = (session.amount_total || 0) / 100; // Stripe uses cents

      if (!userId) {
        return { success: false, error: 'ID do usuário não encontrado na sessão' };
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      const creditsToAdd = calcularCreditos(amount);
      user.credits += creditsToAdd;
      await userRepository.save(user);

      return { success: true, message: `Pagamento via Stripe processado. ${creditsToAdd} créditos adicionados.` };
    }
    return { success: true, message: 'Evento não processado (Stripe)' };
  } catch (error) {
    return { success: false, error: 'Erro ao processar webhook do Stripe' };
  }
};

export const handleMercadoPagoWebhook = async (topic: string, id: string) => {
  const logger = require('../utils/logger').logger;
  try {
    logger.info('Processing Mercado Pago webhook', { topic, id });

    let merchantOrder;

    if (topic === 'payment') {
      const paymentClient = new Payment(mpClient);
      const payment = await paymentClient.get({ id });

      const merchantOrderClient = new MerchantOrder(mpClient);
      merchantOrder = await merchantOrderClient.get({ merchantOrderId: String(payment.order?.id) });
    } else if (topic === 'merchant_order') {
      const merchantOrderClient = new MerchantOrder(mpClient);
      merchantOrder = await merchantOrderClient.get({ merchantOrderId: id });
    } else if (topic === 'subscription_preapproval') {
      const preApprovalClient = new PreApproval(mpClient);
      const preApproval = await preApprovalClient.get({ id });

      const userId = preApproval.external_reference;
      if (!userId) {
        return { success: false, error: 'UserId (external_reference) não encontrado na assinatura' };
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return { success: false, error: 'Usuário não encontrado para assinatura' };
      }

      if (preApproval.status === 'authorized') {
        const previousCredits = user.credits;
        user.status = UserStatus.PREMIUM;
        user.credits = 500;
        await userRepository.save(user);

        logger.info('User upgraded to PREMIUM via Subscription', {
          userId,
          subscriptionId: id,
          previousCredits
        });

        return { success: true, message: 'Assinatura premium ativada com sucesso.' };
      }

      return { success: true, message: `Status da assinatura: ${preApproval.status}` };
    }

    if (!merchantOrder) {
      return { success: false, error: 'Merchant Order não encontrada' };
    }

    let paidAmount = 0;
    merchantOrder.payments?.forEach((payment: any) => {
      if (payment.status === 'approved') {
        paidAmount += payment.transaction_amount;
      }
    });

    if (paidAmount >= (merchantOrder.total_amount || 0)) {
      // O pagamento foi totalmente concluído
      // Precisamos identificar o usuário. Geralmente enviamos o userId na external_reference
      const userId = merchantOrder.external_reference;

      if (!userId) {
        logger.error('No external_reference (userId) found in Mercado Pago order', { orderId: merchantOrder.id });
        return { success: false, error: 'ID do usuário não encontrado na ordem' };
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        logger.error('User not found for Mercado Pago payment', { userId, orderId: merchantOrder.id });
        return { success: false, error: 'Usuário não encontrado' };
      }

      const creditsToAdd = calcularCreditos(paidAmount);
      const previousCredits = user.credits;

      user.credits += creditsToAdd;
      await userRepository.save(user);

      logger.info('Credits added to user via Mercado Pago', {
        userId,
        amount: paidAmount,
        creditsAdded: creditsToAdd,
        previousCredits,
        newCredits: user.credits
      });

      return {
        success: true,
        message: `Pagamento via Mercado Pago processado. ${creditsToAdd} créditos adicionados.`,
        creditsAdded: creditsToAdd
      };
    }

    return { success: true, message: 'Pagamento pendente ou parcial' };
  } catch (error) {
    logger.error('Error processing Mercado Pago webhook', {
      error: error instanceof Error ? error.message : String(error)
    });
    return { success: false, error: 'Erro ao processar webhook do Mercado Pago' };
  }
};

