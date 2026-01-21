
import { Container } from 'inversify';
import { TYPES } from '../constants/types';
import { MeetingRepository } from '../repositories/Meeting.repository.ts';
import { MeetingService } from '../services/Meeting.service';
import { MeetingController } from '../controllers/Meeting.controller';
import { WebRTCSignalingService } from '../services/WebRTCSignaling.service';

const container = new Container();

container.bind<MeetingRepository>(TYPES.MeetingRepository).to(MeetingRepository);
container.bind<MeetingService>(TYPES.MeetingService).to(MeetingService);
container.bind<MeetingController>(TYPES.MeetingController).to(MeetingController);
container.bind<WebRTCSignalingService>(TYPES.WebRTCSignalingService).to(WebRTCSignalingService);

export { container };