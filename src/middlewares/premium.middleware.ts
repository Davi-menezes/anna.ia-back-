import { Request, Response, NextFunction } from 'express';
import { UserStatus } from '../entities/User';

export const verifyPremium = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Não autorizado',
        });
    }

    if (user.status !== UserStatus.PREMIUM) {
        return res.status(403).json({
            success: false,
            message: 'Esta funcionalidade é exclusiva para assinantes Premium.',
            code: 'PREMIUM_REQUIRED'
        });
    }

    next();
};
