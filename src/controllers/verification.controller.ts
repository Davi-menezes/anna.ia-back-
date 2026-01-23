import { Request, Response } from 'express';
import { User, UserStatus } from '../entities/User';
import AppDataSource from '../config/data-source';
import { sendVerificationEmail } from '../services/email.service';
import { logger } from '../utils/logger';
import { MoreThan } from 'typeorm';

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    // Suporta tanto path parameter quanto query parameter
    const token = req.params.token || req.query.token as string;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de verificação não fornecido.'
      });
    }

    logger.info(`Tentativa de verificação de email com token: ${token.substring(0, 10)}...`);
    const userRepository = AppDataSource.getRepository(User);

    // Primeiro, tenta encontrar o usuário apenas pelo token (para debug)
    const userByToken = await userRepository.findOne({
      where: {
        emailVerificationToken: token
      }
    });

    if (!userByToken) {
      logger.warn(`Token não encontrado: ${token.substring(0, 10)}...`);
      return res.status(400).json({
        success: false,
        message: 'Token de verificação inválido ou expirado.'
      });
    }

    // Verifica se o token não expirou
    if (!userByToken.emailVerificationExpires || userByToken.emailVerificationExpires <= new Date()) {
      logger.warn(`Token expirado para usuário: ${userByToken.email}`);
      return res.status(400).json({
        success: false,
        message: 'Token de verificação expirado. Por favor, solicite um novo link.'
      });
    }

    const user = userByToken;

    // Atualiza o usuário
    user.status = UserStatus.VERIFIED;
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await userRepository.save(user);

    logger.info(`E-mail verificado com sucesso para o usuário: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'E-mail verificado com sucesso!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status
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
    const userRepository = AppDataSource.getRepository(User);

    // Encontra o usuário pelo e-mail
    const user = await userRepository.findOneBy({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum usuário encontrado com este e-mail.'
      });
    }

    // Verifica se o usuário já foi verificado
    if (user.status === UserStatus.VERIFIED || user.status === UserStatus.PREMIUM) {
      return res.status(400).json({
        success: false,
        message: 'Este e-mail já foi verificado.'
      });
    }

    // Gera um novo token de verificação
    const verificationToken = user.generateEmailVerificationToken();
    await userRepository.save(user);

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
