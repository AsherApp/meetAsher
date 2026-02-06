import { Router } from 'express';
import { container } from '../config/inversify.config';
import { AuthController } from '../controllers/AuthController';
import { TYPES } from '../constants/types';
import { 
    registerValidation, 
    loginValidation, 
    changePasswordValidation 
} from '../validations/schemas/AuthValidation';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { validateBody } from '../middlewares/bodyValidate';



class AuthRoutes {
    private router: Router;
    private controller: AuthController;

    constructor() {
        this.router = Router();
        this.controller = container.get<AuthController>(TYPES.AuthController);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Public routes
        this.router.post('/register', validateBody(registerValidation), this.controller.register.bind(this.controller));
        this.router.post('/login', validateBody(loginValidation), this.controller.login.bind(this.controller));
        this.router.post('/request-password-reset', this.controller.requestPasswordReset.bind(this.controller));
        
        // Protected routes
        this.router.post('/logout', authMiddleware, this.controller.logout.bind(this.controller));
        this.router.post('/change-password', authMiddleware, validateBody(changePasswordValidation), this.controller.changePassword.bind(this.controller));
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default new AuthRoutes().getRouter();