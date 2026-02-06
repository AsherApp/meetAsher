import { Request, Response, NextFunction } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../constants/types';
import { IAuthService } from '../validations/interfaces/IAuth';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const authService = container.get<IAuthService>(TYPES.AuthService);
        const decoded = await authService.validateToken(token);
        
        (req as any).user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};