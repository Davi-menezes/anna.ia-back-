import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../entities/User';
import { UserStatus } from '../models/User';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import AppDataSource from '../config/data-source';

interface UserResponse {
  id: string | any; // Usando 'any' temporariamente para evitar erros de tipo
  name: string;
  email: string;
  profilePicture?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

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
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.id },
      select: ['id', 'name', 'email', 'profilePicture', 'status', 'createdAt', 'updatedAt']
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Add user to request object
    const userResponse: UserResponse = {
      id: (user as any)._id || user.id, // Usando type assertion temporariamente
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    (req as any).user = userResponse; // Usando type assertion temporariamente
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