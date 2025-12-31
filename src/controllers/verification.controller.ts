import { Request, Response } from 'express';
import { User } from '../models/User';
import { sendVerificationEmail } from '../services/email.service';
import { logger } from '../utils/logger';

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Encontra o usuário com o token de verificação
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de verificação inválido ou expirado.'
      });
    }

    // Atualiza o usuário
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logger.info(`E-mail verificado com sucesso para o usuário: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'E-mail verificado com sucesso!',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    logger.error('Erro ao verificar e-mail:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar e-mail. Por favor, tente novamente.'
    });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Encontra o usuário pelo e-mail
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum usuário encontrado com este e-mail.'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Este e-mail já foi verificado.'
      });
    }

    // Gera um novo token de verificação
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Envia o e-mail de verificação
    await sendVerificationEmail(user.email, verificationToken, user.name);

    res.status(200).json({
      success: true,
      message: 'E-mail de verificação reenviado com sucesso!'
    });
  } catch (error) {
    logger.error('Erro ao reenviar e-mail de verificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao reenviar e-mail de verificação. Por favor, tente novamente.'
    });
  }
};
