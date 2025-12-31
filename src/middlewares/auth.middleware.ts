import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';
import { config } from '../config/config';

// A declaração de tipo para Request está agora em src/types/express/index.d.ts

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Pega o token do cabeçalho
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido',
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verifica o token
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
    
    // Busca o usuário pelo ID do token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Adiciona o usuário ao objeto de requisição
    req.user = user;
    next();
  } catch (err) {
    logger.error('Erro de autenticação:', err);
    
    let message = 'Token inválido';
    if (err instanceof jwt.TokenExpiredError) {
      message = 'Token expirado';
    } else if (err instanceof jwt.JsonWebTokenError) {
      message = 'Token inválido';
    }
    
    res.status(401).json({
      success: false,
      message,
    });
  }
};

// Alias para compatibilidade com código existente
export const authenticate = verifyToken;