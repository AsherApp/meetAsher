import { injectable } from 'inversify';
import { IUserRepository } from '../validations/interfaces/IUser';
import { UserModel, IUserDocument, IUser } from '../models/UserModel';
import { Types } from 'mongoose';

@injectable()
export class UserRepository implements IUserRepository {
    async create(userData: Partial<IUser>): Promise<IUserDocument> {
        const user = new UserModel(userData);
        return await user.save();
    }

    async findByEmail(email: string): Promise<IUserDocument | null> {
        return await UserModel.findOne({ email, isDeleted: false });
    }

    async findById(id: string): Promise<IUserDocument | null> {
        return await UserModel.findOne({ _id: new Types.ObjectId(id), isDeleted: false });
    }

    async findByUserId(userID: string): Promise<IUserDocument | null> {
        return await UserModel.findOne({ userID, isDeleted: false });
    }

    async update(id: string, updateData: Partial<IUser>): Promise<IUserDocument | null> {
        return await UserModel.findOneAndUpdate(
            { _id: new Types.ObjectId(id), isDeleted: false },
            { $set: updateData },
            { new: true }
        );
    }

    async delete(id: string): Promise<boolean> {
        const result = await UserModel.findOneAndUpdate(
            { _id: new Types.ObjectId(id) },
            { $set: { isDeleted: true, isActive: false } },
            { new: true }
        );
        return !!result;
    }

    async findByGoogleId(googleId: string): Promise<IUserDocument | null> {
        return await UserModel.findOne({ googleId, isDeleted: false });
    }

    async updateLoginHistory(userId: string, sessionData: any): Promise<void> {
        await UserModel.findOneAndUpdate(
            { _id: new Types.ObjectId(userId) },
            {
                $push: {
                    loginHistory: {
                        $each: [sessionData],
                        $slice: -20 // Keep last 20 sessions
                    }
                },
                $set: { lastActiveAt: new Date() }
            }
        );
    }

    async updateActivityLog(userId: string, action: string, endpoint?: string): Promise<void> {
        await UserModel.findOneAndUpdate(
            { _id: new Types.ObjectId(userId) },
            {
                $push: {
                    activityLog: {
                        $each: [{ timestamp: new Date(), action, endpoint }],
                        $slice: -100 // Keep last 100 activities
                    }
                }
            }
        );
    }
}