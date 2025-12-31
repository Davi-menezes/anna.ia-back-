import nodemailer from 'nodemailer';
import { config } from '../config/config';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export const sendVerificationEmail = async (email: string, token: string, name: string): Promise<void> => {
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  
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
    throw new Error('Falha ao enviar e-mail de verificação');
  }
};

export const sendPasswordResetEmail = async (email: string, token: string, name: string): Promise<void> => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  
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
