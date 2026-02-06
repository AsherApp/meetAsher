import { IUserDocument } from '../models/UserModel';

declare global {
  namespace Express {
    interface User extends IUserDocument { }
    interface Request {
      user?: User;
    }
  }
}