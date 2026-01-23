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

    // If user already has a profile picture, delete the old one
    if (existingUser.profilePicture) {
      deleteFile(existingUser.profilePicture);
    }

    // Update user's profile picture path
    const relativePath = path.relative('uploads', req.file.path);
    const dbPath = relativePath.replace(/\\/g, '/');
    existingUser.profilePicture = dbPath;

    logger.info(`Updating profile picture for user ${userId} to: ${dbPath}`);

    // Save the updated user using save() (triggers subscribers)
    await userRepository.save(existingUser);

    // Fallback: Use direct update to ensure database persistence if save() has issues with specific fields
    await userRepository.update(userId, { profilePicture: dbPath });

    logger.info(`Profile picture persisted in DB for user ${userId}. Refreshing user data...`);

    // Reload user to verify persistence and get updated timestamps
    const updatedUser = await userRepository.findOneBy({ id: userId });

    // Return the updated user data (without sensitive information)
    const { password, ...userData } = updatedUser || existingUser;

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      user: userData,
    });
  } catch (error) {
    logger.error('Error updating profile picture:', error);

    // Try to delete the uploaded file in case of error
    if (req.file?.path) {
      deleteFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error updating profile picture',
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

    // Update fields
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
    logger.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    // Get user from authenticated request
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    // Get user repository and find user by ID
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

    // Return user data
    res.status(200).json({
      success: true,
      user: userData,
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
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

    // Bypass deduction for premium users
    if (existingUser.status === 'premium') {
      return res.status(200).json({
        success: true,
        message: 'Unlimited credits for premium users',
        credits: existingUser.credits
      });
    }

    // Convert decimal from DB to number just in case
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
    logger.error('Error deducting credits:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deduzir créditos',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Function to serve profile pictures
export const serveProfilePicture = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['profilePicture']
    });

    if (!user || !user.profilePicture) {
      return res.status(404).json({
        success: false,
        message: 'Profile picture not found for this user',
      });
    }

    // Try multiple path resolutions to be robust
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
            logger.error(`Error sending file at ${filePath}:`, err);
          }
        });
        fileSent = true;
        break;
      }
    }

    if (!fileSent) {
      logger.error(`Profile picture file not found at any expected location for user ${userId}. Path from DB: ${user.profilePicture}`);
      return res.status(404).json({
        success: false,
        message: 'Profile picture file not found on server',
      });
    }

  } catch (error) {
    logger.error('Error serving profile picture:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving profile picture',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};
