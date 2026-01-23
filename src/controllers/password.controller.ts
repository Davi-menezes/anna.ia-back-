import { Request, Response } from 'express';
import AppDataSource from '../config/data-source';
import { User } from '../entities/User';
import { MoreThan } from 'typeorm';
import { sendPasswordResetEmail } from '../services/email.service';
import { config } from '../config/config';

const userRepository = AppDataSource.getRepository(User);

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Encontrar usuário pelo e-mail
    const user = await userRepository.findOne({ where: { email } });

    // Se o usuário não existir, retornar erro conforme solicitado pelo usuário
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Este e-mail não está cadastrado em nosso sistema.'
      });
    }

    // Gerar token de redefinição
    const token = user.generatePasswordResetToken();
    await userRepository.save(user);

    // Enviar e-mail com o link de redefinição
    await sendPasswordResetEmail(user.email, token, user.name);

    res.status(200).json({
      success: true,
      message: 'Um e-mail com as instruções para redefinir sua senha foi enviado.'
    });
  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    res.status(500).json({
      success: false,
      message: 'Ocorreu um erro ao processar sua solicitação.'
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    // Encontrar usuário pelo token de redefinição
    const user = await userRepository.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: MoreThan(new Date())
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado.'
      });
    }

    // Atualizar senha e limpar token
    await user.setPassword(password);
    await userRepository.save(user);

    res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({
      success: false,
      message: 'Ocorreu um erro ao redefinir sua senha.'
    });
  }
};
