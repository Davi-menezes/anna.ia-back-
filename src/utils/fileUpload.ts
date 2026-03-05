import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { logger } from './logger';

// Tipos de arquivo permitidos para upload
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Configuração de armazenamento no disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile-pictures/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// Função de filtro de tipo de arquivo
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo inválido. Apenas JPEG, JPG, PNG e GIF são permitidos.'));
  }
};

// Instância do multer com as configurações definidas
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Middleware para tratamento de erros de upload
const handleUploadErrors = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    // Erro gerado pelo próprio multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. O tamanho máximo permitido é 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    // Erro desconhecido durante o upload
    logger.error('Erro no upload do arquivo:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar arquivo'
    });
  }
  next();
};

export { upload, handleUploadErrors };

// Remove um arquivo do disco (utilizado ao trocar foto de perfil)
export const deleteFile = (filePath: string) => {
  const fs = require('fs');
  const path = require('path');

  if (!filePath) return false;

  // Normaliza o caminho para sempre começar com 'uploads/'
  const sanitizedPath = filePath.startsWith('uploads/') ? filePath : `uploads/${filePath}`;

  // Constrói o caminho absoluto relativo a src/utils/
  const fullPath = path.join(__dirname, '../../', sanitizedPath);

  // Verifica se o arquivo existe antes de tentar remover
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      return true;
    } catch (err) {
      logger.error('Erro ao deletar arquivo:', err);
      return false;
    }
  } else {
    logger.warn(`Arquivo não encontrado para exclusão: ${fullPath}`);
  }
  return false;
};
