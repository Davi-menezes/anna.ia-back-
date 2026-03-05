import { Request, Response } from 'express';
import { User } from '../entities/User';
import { logger } from '../utils/logger';
import { deleteFile } from '../utils/fileUpload';
import path from 'path';
import AppDataSource from '../config/data-source';
import { FindOptionsWhere } from 'typeorm';

// A declaração de tipo para Request está em src/types/express/index.d.ts

export const updateProfilePicture = async (req: Request, res: Response) => {
  try {
    // Verifica se um arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado',
      });
    }

    // Obtém o usuário a partir do token
    const user = req.user;
    if (!user) {
      // Remove o arquivo enviado se não houver usuário autenticado
      await deleteFile(req.file.path);
      return res.status(401).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    const userId = user.id;

    // Encontra o usuário no banco de dados
    const userRepository = AppDataSource.getRepository(User);
    const existingUser = await userRepository.findOneBy({ id: userId });

    if (!existingUser) {
      // Remove o arquivo enviado se o usuário não existir
      await deleteFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Se o usuário já tem foto de perfil, remove a antiga
    if (existingUser.profilePicture) {
      deleteFile(existingUser.profilePicture);
    }

    // Atualiza o caminho da foto de perfil no banco
    const relativePath = path.relative('uploads', req.file.path);
    const dbPath = relativePath.replace(/\\/g, '/');
    existingUser.profilePicture = dbPath;

    logger.info(`Atualizando foto de perfil do usuário ${userId} para: ${dbPath}`);

    // Salva via save() para acionar os subscribers do TypeORM
    await userRepository.save(existingUser);

    // Garante persistência mesmo que o save() não atualize o campo específico
    await userRepository.update(userId, { profilePicture: dbPath });

    logger.info(`Foto de perfil persistida no banco para usuário ${userId}. Recarregando dados...`);

    // Recarrega o usuário para obter os timestamps atualizados
    const updatedUser = await userRepository.findOneBy({ id: userId });

    // Retorna os dados do usuário sem informações sensíveis
    const { password, ...userData } = updatedUser || existingUser;

    res.status(200).json({
      success: true,
      message: 'Foto de perfil atualizada com sucesso',
      user: userData,
    });
  } catch (error) {
    logger.error('Erro ao atualizar foto de perfil:', error);

    // Tenta remover o arquivo enviado em caso de erro
    if (req.file?.path) {
      deleteFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar foto de perfil',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    const { birthDate, education, location, mainGoal } = req.body;
    const userRepository = AppDataSource.getRepository(User);
    const existingUser = await userRepository.findOneBy({ id: user.id });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Atualiza os campos fornecidos
    if (birthDate !== undefined) existingUser.birthDate = birthDate ? new Date(birthDate) : undefined;
    if (education !== undefined) existingUser.education = education;
    if (location !== undefined) existingUser.location = location;
    if (mainGoal !== undefined) existingUser.mainGoal = mainGoal;

    await userRepository.save(existingUser);

    const { password, ...userData } = existingUser;

    res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      user: userData,
    });
  } catch (error) {
    logger.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    // Obtém o usuário da requisição autenticada
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    // Busca o usuário completo no banco de dados
    const userRepository = AppDataSource.getRepository(User);
    const userData = await userRepository.findOne({
      where: { id: user.id },
      select: ['id', 'name', 'email', 'profilePicture', 'status', 'birthDate', 'education', 'location', 'mainGoal', 'credits', 'createdAt', 'updatedAt']
    });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Retorna os dados do usuário
    res.status(200).json({
      success: true,
      user: userData,
    });
  } catch (error) {
    logger.error('Erro ao buscar perfil do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfil do usuário',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export const deductCredits = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A quantidade de créditos deve ser um número positivo',
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const existingUser = await userRepository.findOneBy({ id: user.id });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Converte decimal do banco para número
    const currentCredits = Number(existingUser.credits);

    if (currentCredits < amount) {
      return res.status(403).json({
        success: false,
        message: 'Créditos insuficientes',
        code: 'OUT_OF_CREDITS'
      });
    }

    const newCredits = currentCredits - amount;
    existingUser.credits = Math.round(newCredits * 100) / 100;
    await userRepository.save(existingUser);

    res.status(200).json({
      success: true,
      message: `${amount} créditos deduzidos com sucesso`,
      credits: existingUser.credits
    });
  } catch (error) {
    logger.error('Erro ao deduzir créditos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deduzir créditos',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Serve a foto de perfil do usuário pelo ID
export const serveProfilePicture = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    if (!userId) {
      // Retorna avatar padrão quando não há ID
      return res.sendFile(
        path.join(__dirname, '../../public/default-avatar.png')
      );
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['profilePicture']
    });

    if (!user || !user.profilePicture) {
      // Retorna avatar padrão em vez de 404
      logger.info(`Usuário ${userId} sem foto de perfil, servindo avatar padrão`);
      return res.sendFile(
        path.join(__dirname, '../../public/default-avatar.png')
      );
    }

    // Se for URL do Google, redireciona diretamente
    if (user.profilePicture.startsWith('http://') || user.profilePicture.startsWith('https://')) {
      logger.info(`Redirecionando para foto do Google do usuário ${userId}`);
      return res.redirect(user.profilePicture);
    }

    // Tenta múltiplos caminhos para garantir robustez
    const possiblePaths = [
      path.join(__dirname, '../../uploads', user.profilePicture),
      path.join(__dirname, '../../uploads/profile-pictures', path.basename(user.profilePicture)),
      path.join(process.cwd(), 'uploads', user.profilePicture),
      path.join(process.cwd(), 'uploads/profile-pictures', path.basename(user.profilePicture))
    ];

    let fileSent = false;
    for (const filePath of possiblePaths) {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath, (err) => {
          if (err && !res.headersSent) {
            logger.error(`Erro ao enviar arquivo em ${filePath}:`, err);
          }
        });
        fileSent = true;
        break;
      }
    }

    if (!fileSent) {
      // Arquivo não encontrado — serve avatar padrão
      logger.warn(`Foto de perfil não encontrada para o usuário ${userId}. Caminho no banco: ${user.profilePicture}. Servindo avatar padrão.`);
      return res.sendFile(
        path.join(__dirname, '../../public/default-avatar.png')
      );
    }

  } catch (error) {
    logger.error('Erro ao servir foto de perfil:', error);
    // Em caso de erro, também serve o avatar padrão
    return res.sendFile(
      path.join(__dirname, '../../public/default-avatar.png')
    );
  }
};

