
import { Router } from 'express';
import { container } from '../config/inversify.config';
import { MeetingController } from '../controllers/Meeting.controller';
import { TYPES } from '../constants/types';


class MeetingRoutes {
    private router: Router;
    private controller: MeetingController;

    constructor() {
        this.router = Router();
        this.controller = container.get<MeetingController>(TYPES.MeetingController);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {

        this.router.post('/', this.controller.createMeeting.bind(this.controller));
        this.router.get('/:meetingId', this.controller.getMeeting.bind(this.controller));
        this.router.get('/user/:userId', this.controller.getUserMeetings.bind(this.controller));
        this.router.post('/:meetingId/end', this.controller.endMeeting.bind(this.controller));
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default new MeetingRoutes().getRouter();