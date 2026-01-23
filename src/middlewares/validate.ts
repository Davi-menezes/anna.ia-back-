import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { logger } from '../utils/logger';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorArray = errors.array();
    logger.warn('Validation failed', { 
      errors: errorArray,
      body: req.body 
    });
    
    // Criar mensagem mais detalhada
    const errorMessages = errorArray.map((err: any) => {
      const field = err.param || err.path || 'campo';
      const msg = err.msg || 'inválido';
      return `${field}: ${msg}`;
    }).join('. ');
    
    res.status(400).json({
      success: false,
      message: errorMessages || 'Erro de validação',
      errors: errorArray
    });
  };
};
