
import { injectable } from 'inversify';
import { MeetingModel, IMeetingDocument } from '../models/Meeting.model';
import {
  CreateMeetingDto,
  IMeeting,
  MeetingStatus,
  IParticipant,
  IChatMessage
} from '../validations/interfaces/meeting';

@injectable()
export class MeetingRepository {
  /**
   * Create a new meeting
   */
  async create(data: CreateMeetingDto): Promise<IMeetingDocument> {
    const meeting = new MeetingModel({
      title: data.title,
      description: data.description,
      hostId: data.hostId,
      scheduledAt: data.scheduledAt,
      duration: data.duration,
      status: MeetingStatus.SCHEDULED,
      settings: {
        allowParticipantVideo: true,
        allowParticipantAudio: true,
        allowChat: true,
        allowScreenShare: true,
        waitingRoom: false,
        recordMeeting: false,
        maxParticipants: 100,
        requirePassword: false,
        ...data.settings
      },
      participants: [],
      chatMessages: []
    });

    return await meeting.save();
  }

  /**
   * Find meeting by ID
   */
  async findById(meetingId: string): Promise<IMeetingDocument | null> {
    return await MeetingModel.findOne({ meetingId });
  }

  /**
   * Find meetings by host ID
   */
  async findByHostId(hostId: string): Promise<IMeetingDocument[]> {
    return await MeetingModel.find({ hostId })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  /**
   * Find user's meetings (as participant or host)
   */
  async findUserMeetings(userId: string): Promise<IMeetingDocument[]> {
    return await MeetingModel.find({
      $or: [
        { hostId: userId },
        { 'participants.userId': userId }
      ]
    }).sort({ createdAt: -1 }).limit(50);
  }

  /**
   * Update meeting status
   */
  async updateStatus(
    meetingId: string,
    status: MeetingStatus
  ): Promise<IMeetingDocument | null> {
    const update: any = { status };

    if (status === MeetingStatus.ACTIVE) {
      update.startedAt = new Date();
    } else if (status === MeetingStatus.ENDED) {
      update.endedAt = new Date();
    }

    return await MeetingModel.findOneAndUpdate(
      { meetingId },
      update,
      { new: true }
    );
  }

  /**
   * Add participant to meeting
   */
  async addParticipant(
    meetingId: string,
    participant: IParticipant
  ): Promise<IMeetingDocument | null> {
    return await MeetingModel.findOneAndUpdate(
      { meetingId },
      { $push: { participants: participant } },
      { new: true }
    );
  }

  /**
   * Remove participant from meeting
   */
  async removeParticipant(
    meetingId: string,
    userId: string
  ): Promise<IMeetingDocument | null> {
    return await MeetingModel.findOneAndUpdate(
      { meetingId, 'participants.userId': userId },
      {
        $set: {
          'participants.$.status': 'left',
          'participants.$.leftAt': new Date()
        }
      },
      { new: true }
    );
  }

  /**
   * Update participant
   */
  async updateParticipant(
    meetingId: string,
    userId: string,
    updates: Partial<IParticipant>
  ): Promise<IMeetingDocument | null> {
    const setFields: any = {};
    Object.keys(updates).forEach(key => {
      setFields[`participants.$.${key}`] = (updates as any)[key];
    });

    return await MeetingModel.findOneAndUpdate(
      { meetingId, 'participants.userId': userId },
      { $set: setFields },
      { new: true }
    );
  }

  /**
   * Add chat message
   */
  async addChatMessage(
    meetingId: string,
    message: IChatMessage
  ): Promise<IMeetingDocument | null> {
    return await MeetingModel.findOneAndUpdate(
      { meetingId },
      { $push: { chatMessages: message } },
      { new: true }
    );
  }

  /**
   * Toggle recording
   */
  async toggleRecording(
    meetingId: string,
    isRecording: boolean
  ): Promise<IMeetingDocument | null> {
    return await MeetingModel.findOneAndUpdate(
      { meetingId },
      { isRecording },
      { new: true }
    );
  }

  /**
   * Get active meetings
   */
  async getActiveMeetings(): Promise<IMeetingDocument[]> {
    return await MeetingModel.find({
      status: MeetingStatus.ACTIVE
    }).sort({ startedAt: -1 });
  }

  /**
   * Delete meeting
   */
  async delete(meetingId: string): Promise<boolean> {
    const result = await MeetingModel.deleteOne({ meetingId });
    return result.deletedCount > 0;
  }
}