
import { Container } from 'inversify';
import { TYPES } from '../constants/types';
import { MeetingRepository } from '../repositories/MeetingRepository';
import { MeetingService } from '../services/MeetingService';
import { MeetingController } from '../controllers/Meeting.controller';
import { WebRTCSignalingService } from '../services/WebRTCSignaling.service';
import { UserController } from '../controllers/UserController';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { UserRepository } from '../repositories/UserRepository';

const container = new Container();

container.bind<MeetingRepository>(TYPES.MeetingRepository).to(MeetingRepository);
container.bind<MeetingService>(TYPES.MeetingService).to(MeetingService);
container.bind<MeetingController>(TYPES.MeetingController).to(MeetingController);
container.bind<WebRTCSignalingService>(TYPES.WebRTCSignalingService).to(WebRTCSignalingService);
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<AuthService>(TYPES.AuthService).to(AuthService);

export { container };