import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function routeNotFound(req: Request, res: Response, next: NextFunction) {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    logger.warn(`404 - ${error.message}`);
    res.status(404).json({
        success: false,
        message: 'Route not found',
        error: {
            statusCode: 404,
            message: `Cannot ${req.method} ${req.originalUrl}`
        }
    });
}
