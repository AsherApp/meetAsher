import { inject, injectable } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { IUserService } from '../services/UserService';
import { TYPES } from '../constants/types';

@injectable()
export class UserController {
    constructor(
        @inject(TYPES.UserService) private userService: IUserService
    ) {}

    async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const user = await this.userService.getUserProfile(userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        userID: user.userID,
                        role: user.role,
                        status: user.status,
                        phoneNumber: user.phoneNumber,
                        recoveryEmail: user.recoveryEmail,
                        verified: user.verified,
                        createdAt: user.createdAt
                    }
                }
            });
        } catch (error: any) {
            next(error);
        }
    }

    async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const updatedUser = await this.userService.updateProfile(userId, req.body);
            if (!updatedUser) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: updatedUser._id,
                        email: updatedUser.email,
                        phoneNumber: updatedUser.phoneNumber,
                        recoveryEmail: updatedUser.recoveryEmail,
                        hint: updatedUser.hint
                    }
                }
            });
        } catch (error: any) {
            next(error);
        }
    }

    async updateSecurityQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const { securityQuestion, securityAnswer } = req.body;

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            await this.userService.updateSecurityQuestion(userId, securityQuestion, securityAnswer);

            res.status(200).json({
                success: true,
                message: 'Security question updated successfully'
            });
        } catch (error: any) {
            next(error);
        }
    }
}