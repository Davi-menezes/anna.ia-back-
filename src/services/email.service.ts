import { Resend } from 'resend';
import { config } from '../config/config';
import { logger } from '../utils/logger';

const resend = new Resend(config.resend.apiKey);

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!config.resend.apiKey) {
    logger.warn('⚠️ Resend API key missing. Mocking email sending.');
    logger.info(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: config.resend.from,
      to,
      subject,
      html,
    });

    if (error) {
      logger.error(`❌ Resend API Error:`, error);
      throw new Error(`Resend Error: ${error.message}`);
    }

    logger.info(`✅ Email sent successfully to ${to}. ID: ${data?.id}`);
  } catch (error) {
    logger.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, token: string, name: string): Promise<void> => {
  const verificationUrl = `${config.frontendUrl}/verify-email/${token}`;

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Olá ${name}!</h2>
        <p>Obrigado por se cadastrar no Anna IA. Por favor, verifique seu endereço de e-mail clicando no botão abaixo:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verificar E-mail
          </a>
        </div>
        
        <p>Ou copie e cole este link no seu navegador:</p>
        <p>${verificationUrl}</p>
        
        <p>Se você não se cadastrou no Anna IA, por favor, ignore este e-mail.</p>
        
        <p>Atenciosamente,<br>Equipe Anna IA</p>
      </div>
    `;

  await sendEmail(email, 'Verifique seu e-mail - Anna IA', html);
};

export const sendPasswordResetEmail = async (email: string, token: string, name: string): Promise<void> => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Olá ${name}!</h2>
        <p>Você solicitou a redefinição de senha. Clique no botão abaixo para criar uma nova senha:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #2196F3; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            Redefinir Senha
          </a>
        </div>
        
        <p>Ou copie e cole este link no seu navegador:</p>
        <p>${resetUrl}</p>
        
        <p>Se você não solicitou a redefinição de senha, por favor, ignore este e-mail.</p>
        <p>Este link expirará em 1 hora.</p>
        
        <p>Atenciosamente,<br>Equipe Anna IA</p>
      </div>
    `;

  await sendEmail(email, 'Redefinição de Senha - Anna IA', html);
};
