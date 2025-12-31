import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { sendVerificationEmail } from '../services/email.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Verifica se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este e-mail já está em uso.'
      });
    }

    // Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Cria um novo usuário
    const user = new User({
      name,
      email,
      password: hashedPassword,
      isEmailVerified: false
    });

    // Gera o token de verificação
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Envia o e-mail de verificação
    await sendVerificationEmail(user.email, verificationToken, user.name);

    // Cria o token JWT (sem incluir informações sensíveis)
    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.jwt.secret,
      { expiresIn: '24h' } // Tempo de expiração fixo em 24 horas
    );

    // Retorna a resposta sem informações sensíveis
    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso! Por favor, verifique seu e-mail para ativar sua conta.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture
      },
      token
    });
  } catch (error) {
    logger.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar a conta. Por favor, tente novamente.'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Verifica se o usuário existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas.'
      });
    }

    // Verifica se a senha está correta
    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas.'
      });
    }

    // Verifica se o e-mail foi verificado
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Por favor, verifique seu e-mail para ativar sua conta.'
      });
    }

    // Cria o token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.jwt.secret,
      { expiresIn: '24h' } // Tempo de expiração fixo em 24 horas
    );

    // Retorna a resposta sem informações sensíveis
    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture
      },
      token
    });
  } catch (error) {
    logger.error('Erro ao fazer login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login. Por favor, tente novamente.'
    });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - O passport adiciona o usuário ao objeto de requisição
    const user = req.user as any;
    
    // Cria o token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.jwt.secret,
      { expiresIn: '24h' } // Tempo de expiração fixo em 24 horas
    );

    // Redireciona para o frontend com o token
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    logger.error('Erro no callback do Google:', error);
    res.redirect(`${config.frontendUrl}/auth/callback?error=Erro ao autenticar com o Google`);
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - O middleware de autenticação adiciona o usuário ao objeto de requisição
    const user = await User.findById(req.user.id).select('-password -__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Erro ao buscar usuário atual:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar informações do usuário.'
    });
  }
};