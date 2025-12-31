import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { logger } from './logger';

// Define the allowed file types
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile-pictures/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// File filter function
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and GIF are allowed.'));
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Middleware for handling file upload errors
const handleUploadErrors = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File size too large. Maximum size is 5MB.' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  } else if (err) {
    // An unknown error occurred
    logger.error('File upload error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Error uploading file' 
    });
  }
  next();
};

export { upload, handleUploadErrors };

// Function to delete a file
// This will be used to delete old profile pictures when a new one is uploaded
export const deleteFile = (filePath: string) => {
  const fs = require('fs');
  const path = require('path');
  
  // Construct the full path to the file
  const fullPath = path.join(__dirname, '../../', filePath);
  
  // Check if file exists before trying to delete
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      return true;
    } catch (err) {
      logger.error('Error deleting file:', err);
      return false;
    }
  }
  return false;
};
