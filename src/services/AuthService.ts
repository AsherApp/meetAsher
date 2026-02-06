import { inject, injectable } from 'inversify';
import { IAuthService } from '../validations/interfaces/IAuth';
import { IUserRepository } from     '../validations/interfaces/IUser';
import { IUserDocument, UserStatus, ActionType, UserRole } from '../models/UserModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { TYPES } from '../constants/types';

@injectable()
export class AuthService implements IAuthService {
    constructor(
        @inject(TYPES.UserRepository) private userRepository: IUserRepository
    ) {}

    private generateToken(userId: string): string {
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
    }

    private generateSessionToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    async register(userData: {
        email: string;
        password: string;
        name: string;
        phoneNumber?: string;
        role?: string;
    }): Promise<{ user: IUserDocument; token: string }> {
        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Create user
        const user = await this.userRepository.create({
            email: userData.email,
            password: userData.password,
            phoneNumber: userData.phoneNumber,
            role: userData.role as UserRole || UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
            verified: false,
            twoFactorEnabled: false,
            isActive: true,
            isDeleted: false,
            lastActiveAt: new Date()
        });

        // Generate token
        const token = this.generateToken(user._id.toString());

        // Log activity
        await this.userRepository.updateActivityLog(
            user._id.toString(),
            ActionType.AUTHENTICATE,
            '/api/auth/register'
        );

        return { user, token };
    }

    async login(credentials: {
        email: string;
        password: string;
        ipAddress: string;
        userAgent: string;
        deviceId?: string;
    }): Promise<{ user: IUserDocument; token: string; sessionToken: string }> {
        const user = await this.userRepository.findByEmail(credentials.email);
        if (!user) {
            // Log unauthorized attempt
            const fakeUser = await this.userRepository.findByEmail(credentials.email);
            if (fakeUser) {
                await this.userRepository.updateActivityLog(
                    fakeUser._id.toString(),
                    ActionType.UNAUTHORIZED_ACCESS_ATTEMPT,
                    '/api/auth/login'
                );
            }
            throw new Error('Invalid credentials');
        }

        // Check if user is active
        if (!user.isActive || user.isDeleted) {
            throw new Error('Account is disabled');
        }

        // Verify password
        const isValidPassword = await user.comparePassword(credentials.password);
        if (!isValidPassword) {
            await this.userRepository.updateActivityLog(
                user._id.toString(),
                ActionType.UNAUTHORIZED_ACCESS_ATTEMPT,
                '/api/auth/login'
            );
            throw new Error('Invalid credentials');
        }

        // Generate tokens
        const token = this.generateToken(user._id.toString());
        const sessionToken = this.generateSessionToken();

        // Update login history
        const loginSession = {
            timestamp: new Date(),
            ipAddress: credentials.ipAddress,
            userAgent: credentials.userAgent,
            deviceId: credentials.deviceId,
            sessionToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };

        await this.userRepository.updateLoginHistory(user._id.toString(), loginSession);

        // Update user status
        await this.userRepository.update(user._id.toString(), {
            status: UserStatus.ACTIVE,
            lastActiveAt: new Date()
        });

        // Log activity
        await this.userRepository.updateActivityLog(
            user._id.toString(),
            ActionType.AUTHENTICATE,
            '/api/auth/login'
        );

        return { user, token, sessionToken };
    }

    async logout(userId: string, sessionToken: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Remove session from login history (simplified - in production, you'd want to mark as expired)
        await this.userRepository.update(userId, {
            status: UserStatus.OFFLINE,
            lastActiveAt: new Date()
        });

        await this.userRepository.updateActivityLog(
            userId,
            ActionType.AUTHENTICATE,
            '/api/auth/logout'
        );
    }

    async validateToken(token: string): Promise<any> {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            return decoded;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const isValid = await user.comparePassword(currentPassword);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }

        await this.userRepository.update(userId, { password: newPassword });
    }

    async requestPasswordReset(email: string): Promise<string> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }

        // Generate reset token (simplified)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        // In production, store this token in database and send email
        console.log(`Password reset token for ${email}: ${resetToken}`);

        return resetToken;
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        // Validate token and update password
        // This is simplified - in production, verify token from database
        throw new Error('Not implemented');
    }
}