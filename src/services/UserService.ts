import { inject, injectable } from 'inversify';
import { IUserRepository } from '../validations/interfaces/IUser';
import { IUserDocument } from '../models/UserModel';
import { TYPES } from '../constants/types';

export interface IUserService {
    getUserProfile(userId: string): Promise<IUserDocument | null>;
    updateProfile(userId: string, updateData: any): Promise<IUserDocument | null>;
    updateSecurityQuestion(userId: string, question: string, answer: string): Promise<void>;
}

@injectable()
export class UserService implements IUserService {
    constructor(
        @inject(TYPES.UserRepository) private userRepository: IUserRepository
    ) {}

    async getUserProfile(userId: string): Promise<IUserDocument | null> {
        return await this.userRepository.findById(userId);
    }

    async updateProfile(userId: string, updateData: any): Promise<IUserDocument | null> {
        const allowedFields = ['phoneNumber', 'recoveryEmail', 'hint'];
        const filteredData: any = {};

        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredData[key] = updateData[key];
            }
        });

        return await this.userRepository.update(userId, filteredData);
    }

    async updateSecurityQuestion(userId: string, question: string, answer: string): Promise<void> {
        await this.userRepository.update(userId, {
            securityQuestion: question,
            securityAnswer: answer
        });
    }
}