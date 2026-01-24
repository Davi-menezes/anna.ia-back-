import nodemailer from 'nodemailer';
import { config } from '../config/config';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  service: 'gmail', // Use o atalho oficial para o Gmail
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// Verifica a conexão na inicialização
transporter.verify((error, success) => {
  if (error) {
    logger.error('❌ Erro de conexão SMTP (Gmail):', error);
  } else {
    logger.info('✅ Servidor de e-mail pronto para enviar mensagens');
  }
});

export const sendVerificationEmail = async (email: string, token: string, name: string): Promise<void> => {
  const verificationUrl = `${config.frontendUrl}/verify-email/${token}`;

  logger.info(`Iniciando tentativa de e-mail: ${email} via ${config.smtp.host}:${config.smtp.port} (SSL: ${config.smtp.secure})`);

  // MOCK EMAIL IF NO CREDENTIALS
  if (!config.smtp.user || !config.smtp.pass) {
    logger.warn('⚠️ SMTP credentials missing. Mocking email sending.');
    logger.info(`📧 [MOCK EMAIL] To: ${email} | Subject: Verifique seu e-mail`);
    logger.info(`🔗 Verification URL: ${verificationUrl}`);
    return;
  }

  const mailOptions = {
    from: `"Anna IA" <${config.smtp.from}>`,
    to: email,
    subject: 'Verifique seu e-mail - Anna IA',
    html: `
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`E-mail de verificação enviado para ${email}`);
  } catch (error) {
    logger.error(`Erro ao enviar e-mail de verificação para ${email}:`, error);
    // Don't crash the registration flow if email fails in dev, but maybe we should? 
    // For now, let's allow it to fail if credentials WERE provided but failed.
    throw new Error('Falha ao enviar e-mail de verificação');
  }
};

export const sendPasswordResetEmail = async (email: string, token: string, name: string): Promise<void> => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  // MOCK EMAIL IF NO CREDENTIALS
  if (!config.smtp.user || !config.smtp.pass) {
    logger.warn('⚠️ SMTP credentials missing. Mocking password reset email.');
    logger.info(`📧 [MOCK EMAIL] To: ${email} | Subject: Redefinição de Senha`);
    logger.info(`🔗 Reset URL: ${resetUrl}`);
    return;
  }

  const mailOptions = {
    from: `"Anna IA" <${config.smtp.from}>`,
    to: email,
    subject: 'Redefinição de Senha - Anna IA',
    html: `
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`E-mail de redefinição de senha enviado para ${email}`);
  } catch (error) {
    logger.error(`Erro ao enviar e-mail de redefinição de senha para ${email}:`, error);
    throw new Error('Falha ao enviar e-mail de redefinição de senha');
  }
};
