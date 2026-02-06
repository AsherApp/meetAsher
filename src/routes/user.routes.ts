import { Router } from 'express';
import { container } from '../config/inversify.config';
import { UserController } from '../controllers/UserController';
import { TYPES } from '../constants/types';
import { authMiddleware } from '../middlewares/AuthMiddleware';

class UserRoutes {
    private router: Router;
    private controller: UserController;

    constructor() {
        this.router = Router();
        this.controller = container.get<UserController>(TYPES.UserController);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // All routes require authentication
        this.router.use(authMiddleware);
        
        this.router.get('/profile', this.controller.getProfile.bind(this.controller));
        this.router.put('/profile', this.controller.updateProfile.bind(this.controller));
        this.router.put('/security-question', this.controller.updateSecurityQuestion.bind(this.controller));
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default new UserRoutes().getRouter();