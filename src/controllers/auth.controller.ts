import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, UserStatus } from '../entities/User';
import AppDataSource from '../config/data-source';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { sendVerificationEmail } from '../services/email.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, birthDate, education, location, mainGoal } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    // Verifica se o usuário já existe
    const existingUser = await userRepository.findOneBy({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este e-mail já está em uso.',
        code: 'EMAIL_IN_USE'
      });
    }

    // Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Cria um novo usuário
    const user = userRepository.create({
      name,
      email,
      password: hashedPassword,
      status: UserStatus.CREATED,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      education,
      location,
      mainGoal,
      credits: 5.0
    });

    // Gera o token de verificação
    const verificationToken = user.generateEmailVerificationToken();
    await userRepository.save(user);

    // Envia o e-mail de verificação
    await sendVerificationEmail(user.email, verificationToken, user.name);

    // Retorna a resposta sem informações sensíveis
    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso! Por favor, verifique seu e-mail para ativar sua conta.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        profilePicture: user.profilePicture,
        birthDate: user.birthDate,
        education: user.education,
        location: user.location,
        mainGoal: user.mainGoal,
        credits: user.credits
      }
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
    const userRepository = AppDataSource.getRepository(User);

    // Verifica se o usuário existe
    const user = await userRepository.findOneBy({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Este e-mail não está cadastrado.',
        code: 'INVALID_EMAIL'
      });
    }

    // Verifica se a senha está correta
    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta.',
        code: 'INVALID_PASSWORD'
      });
    }

    // Verifica o status da conta
    if (user.status === UserStatus.CREATED) {
      return res.status(403).json({
        success: false,
        message: 'Por favor, verifique seu e-mail para ativar sua conta.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Cria o token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        profilePicture: user.profilePicture,
        birthDate: user.birthDate,
        education: user.education,
        location: user.location,
        mainGoal: user.mainGoal,
        credits: user.credits
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

// Interface para o usuário retornado pelo Passport
interface PassportUser {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  googleId?: string;
  profilePicture?: string;
}

export const googleCallback = async (req: Request, res: Response) => {
  try {
    // O Passport adiciona o usuário ao objeto de requisição
    const user = req.user as unknown as PassportUser;

    // Cria o token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    // Redireciona para o frontend com o token
    // Usa a URL de callback do frontend da configuração do Google
    const frontendUrl = config.oauth.google.frontendCallbackURL || config.frontendUrl;
    res.redirect(`${frontendUrl}?token=${token}`);
  } catch (error) {
    logger.error('Erro no callback do Google:', error);
    const frontendUrl = config.oauth.google.frontendCallbackURL || config.frontendUrl;
    res.redirect(`${frontendUrl}?error=Erro ao autenticar com o Google`);
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - Auth middleware adds user object
    const userId = (req.user as any).id;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    // Remove sensitive data manually since .select() is Mongoose specific
    const { password, ...safeUser } = user;

    res.status(200).json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    logger.error('Erro ao buscar usuário atual:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar informações do usuário.'
    });
  }
};