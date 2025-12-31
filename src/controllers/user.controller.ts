import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';
import { deleteFile } from '../utils/fileUpload';
import path from 'path';

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
    
    const userId = user._id;

    // Encontra o usuário no banco de dados
    const existingUser = await User.findById(userId);
    
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
    // Store the relative path to make it work with different environments
    const relativePath = path.relative('uploads', req.file.path);
    existingUser.profilePicture = relativePath.replace(/\\/g, '/'); // Convert Windows paths to forward slashes
    
    await existingUser.save();

    // Return the updated user data (without sensitive information)
    const { password, ...userData } = existingUser.toObject();
    
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
    
    // Fetch fresh user data from database
    const userData = await User.findById(user._id).select('-password');
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

// Function to serve profile pictures
export const serveProfilePicture = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const user = await User.findById(userId);
    
    if (!user || !user.profilePicture) {
      return res.status(404).json({
        success: false,
        message: 'Profile picture not found',
      });
    }

    // Construct the full path to the file
    const filePath = path.join(__dirname, '../../uploads', user.profilePicture);
    
    // Send the file
    res.sendFile(filePath, (err) => {
      if (err) {
        logger.error('Error serving profile picture:', err);
        if (!res.headersSent) {
          res.status(404).json({
            success: false,
            message: 'Error serving profile picture',
          });
        }
      }
    });
  } catch (error) {
    logger.error('Error serving profile picture:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving profile picture',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};
