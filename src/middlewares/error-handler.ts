import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { logger } from '../utils/logger';

export const errorHandler: ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    
    if (process.env.NODE_ENV === 'development') {
        logger.error(err.stack);
    }

    res.status(statusCode).json({
        success: false,
        message,
        error: {
            statusCode,
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
}
