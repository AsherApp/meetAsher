import { IUser, IUserDocument } from '../../models/UserModel';

export interface IUserRepository {
    create(userData: Partial<IUser>): Promise<IUserDocument>;
    findByEmail(email: string): Promise<IUserDocument | null>;
    findById(id: string): Promise<IUserDocument | null>;
    findByUserId(userID: string): Promise<IUserDocument | null>;
    update(id: string, updateData: Partial<IUser>): Promise<IUserDocument | null>;
    delete(id: string): Promise<boolean>;
    findByGoogleId(googleId: string): Promise<IUserDocument | null>;
    updateLoginHistory(userId: string, sessionData: any): Promise<void>;
    updateActivityLog(userId: string, action: string, endpoint?: string): Promise<void>;
}