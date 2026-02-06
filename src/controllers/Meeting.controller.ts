
import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { MeetingService } from '../services/MeetingService';
import { TYPES } from '../constants/types';
import { AuthenticatedRequest } from '../types/customRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';

@injectable()
export class MeetingController {
  constructor(
    @inject(TYPES.MeetingService)
    private meetingService: MeetingService
  ) { }

  createMeeting = asyncHandler(async (req: Request, res: Response) =>{
    const meeting = await this.meetingService.createMeeting(req.body);
    return res.status(201).json(
      ApiResponse.created(
        meeting
      )
    )
  })

  getMeeting =  asyncHandler( async (req: AuthenticatedRequest, res: Response) =>{
      const meeting = await this.meetingService.getMeeting(req.params.meetingId);
      if (!meeting) {
        return res.status(404).json({ success: false, message: 'Meeting not found' });
      }
      return res.status(200).json(
        ApiResponse.success(meeting)
      );
  })

  getUserMeetings = asyncHandler( async (req: AuthenticatedRequest, res: Response) =>{
      const meetings = await this.meetingService.getUserMeetings(req.params.userId);
      res.status(200).json(ApiResponse.success(meetings));

  })

  endMeeting = asyncHandler( async (req: AuthenticatedRequest, res: Response) =>{
      const result = await this.meetingService.endMeeting(
        req.params.meetingId,
        req.body.hostId
      );
      return res.status(200).json({ success: result.success, message: result.message });
  
  })
}