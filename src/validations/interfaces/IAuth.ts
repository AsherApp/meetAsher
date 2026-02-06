import { IUserDocument } from '../../models/UserModel';

export interface IAuthService {
    register(userData: {
        email: string;
        password: string;
        name: string;
        phoneNumber?: string;
        role?: string;
    }): Promise<{ user: IUserDocument; token: string }>;

    login(credentials: {
        email: string;
        password: string;
        ipAddress: string;
        userAgent: string;
        deviceId?: string;
    }): Promise<{ user: IUserDocument; token: string; sessionToken: string }>;

    logout(userId: string, sessionToken: string): Promise<void>;
    
    validateToken(token: string): Promise<any>;
    
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    
    requestPasswordReset(email: string): Promise<string>;
    
    resetPassword(token: string, newPassword: string): Promise<void>;
}