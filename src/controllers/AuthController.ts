import { inject, injectable } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../validations/interfaces/IAuth';
import { TYPES } from '../constants/types';


@injectable()
export class AuthController {
    constructor(
        @inject(TYPES.AuthService) private authService: IAuthService
    ) {}

    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {


            const { email, password, name, phoneNumber, role } = req.body;
            
            const result = await this.authService.register({
                email,
                password,
                name,
                phoneNumber,
                role
            });

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: result.user._id,
                        email: result.user.email,
                        userID: result.user.userID,
                        role: result.user.role,
                        verified: result.user.verified
                    },
                    token: result.token
                }
            });
        } catch (error: any) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {


            const { email, password } = req.body;
            const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';

            const result = await this.authService.login({
                email,
                password,
                ipAddress: ipAddress.toString(),
                userAgent,
                deviceId: req.headers['device-id'] as string
            });

            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: result.user._id,
                        email: result.user.email,
                        userID: result.user.userID,
                        role: result.user.role,
                        status: result.user.status
                    },
                    token: result.token,
                    sessionToken: result.sessionToken
                }
            });
        } catch (error: any) {
            res.status(401).json({
                success: false,
                error: error.message
            });
        }
    }

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const sessionToken = req.headers['x-session-token'] as string;

            if (!userId || !sessionToken) {
                res.status(400).json({ error: 'Missing user or session token' });
                return;
            }

            await this.authService.logout(userId, sessionToken);

            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error: any) {
            next(error);
        }
    }

    async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const { currentPassword, newPassword } = req.body;

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            await this.authService.changePassword(userId, currentPassword, newPassword);

            res.status(200).json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body;
            const token = await this.authService.requestPasswordReset(email);

            res.status(200).json({
                success: true,
                message: 'Password reset instructions sent',
                // In production, don't send token in response
                token // Remove this in production
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }
}