
import { injectable, inject } from 'inversify';
import { MeetingRepository } from '../repositories/MeetingRepository.js';
import { TYPES } from '../constants/types.js';
import {
  CreateMeetingDto,
  JoinMeetingDto,
  IMeeting,
  IParticipant,
  ParticipantRole,
  ParticipantStatus,
  MeetingStatus,
  IChatMessage
} from '../validations/interfaces/IMeet.js';
import bcrypt from 'bcrypt';

@injectable()
export class MeetingService {
  constructor(
    @inject(TYPES.MeetingRepository)
    private meetingRepository: MeetingRepository
  ) {}

  /**
   * Create a new meeting
   */
  async createMeeting(data: CreateMeetingDto): Promise<IMeeting> {
    // Hash password if required
    if (data.settings?.requirePassword && data.settings.password) {
      data.settings.password = await bcrypt.hash(data.settings.password, 10);
    }

    const meeting = await this.meetingRepository.create(data);
    return meeting.toObject();
  }

  /**
   * Get meeting by ID
   */
  async getMeeting(meetingId: string): Promise<IMeeting | null> {
    const meeting = await this.meetingRepository.findById(meetingId);
    return meeting ? meeting.toObject() : null;
  }

  /**
   * Join a meeting
   */
  async joinMeeting(data: JoinMeetingDto): Promise<{
    success: boolean;
    meeting?: IMeeting;
    participant?: IParticipant;
    message?: string;
  }> {
    const meeting = await this.meetingRepository.findById(data.meetingId);

    if (!meeting) {
      return { success: false, message: 'Meeting not found' };
    }

    // Check if meeting is active or can be started
    if (meeting.status === MeetingStatus.ENDED) {
      return { success: false, message: 'Meeting has ended' };
    }

    if (meeting.status === MeetingStatus.CANCELLED) {
      return { success: false, message: 'Meeting has been cancelled' };
    }

    // Check password if required
    if (meeting.settings.requirePassword && meeting.settings.password) {
      if (!data.password) {
        return { success: false, message: 'Password required' };
      }

      const isPasswordValid = await bcrypt.compare(
        data.password,
        meeting.settings.password
      );

      if (!isPasswordValid) {
        return { success: false, message: 'Invalid password' };
      }
    }

    // Check if max participants reached
    const activeParticipants = meeting.participants.filter(
      p => p.status === ParticipantStatus.JOINED
    );

    if (activeParticipants.length >= meeting.settings.maxParticipants) {
      return { success: false, message: 'Meeting is full' };
    }

    // Check if user already in meeting
    const existingParticipant = meeting.participants.find(
      p => p.userId === data.userId
    );

    if (existingParticipant && existingParticipant.status === ParticipantStatus.JOINED) {
      return { success: false, message: 'Already in meeting' };
    }

    // Determine role
    const role = meeting.hostId === data.userId
      ? ParticipantRole.HOST
      : ParticipantRole.PARTICIPANT;

    // Create participant
    const participant: IParticipant = {
      userId: data.userId,
      name: data.name,
      email: data.email,
      role,
      status: meeting.settings.waitingRoom && role !== ParticipantRole.HOST
        ? ParticipantStatus.WAITING
        : ParticipantStatus.JOINED,
      joinedAt: new Date(),
      isMuted: false,
      isVideoOff: false,
      isHandRaised: false
    };

    // Add participant
    const updatedMeeting = await this.meetingRepository.addParticipant(
      data.meetingId,
      participant
    );

    // Start meeting if host joins
    if (role === ParticipantRole.HOST && meeting.status === MeetingStatus.SCHEDULED) {
      await this.meetingRepository.updateStatus(data.meetingId, MeetingStatus.ACTIVE);
    }

    return {
      success: true,
      meeting: updatedMeeting?.toObject(),
      participant
    };
  }

  /**
   * Leave meeting
   */
  async leaveMeeting(meetingId: string, userId: string): Promise<IMeeting | null> {
    const meeting = await this.meetingRepository.removeParticipant(meetingId, userId);

    if (meeting) {
      // End meeting if host leaves or no active participants
      const activeParticipants = meeting.participants.filter(
        p => p.status === ParticipantStatus.JOINED
      );

      if (activeParticipants.length === 0) {
        await this.meetingRepository.updateStatus(meetingId, MeetingStatus.ENDED);
      }
    }

    return meeting ? meeting.toObject() : null;
  }

  /**
   * Update participant settings
   */
  async updateParticipant(
    meetingId: string,
    userId: string,
    updates: Partial<IParticipant>
  ): Promise<IMeeting | null> {
    const meeting = await this.meetingRepository.updateParticipant(
      meetingId,
      userId,
      updates
    );

    return meeting ? meeting.toObject() : null;
  }

  /**
   * Send chat message
   */
  async sendChatMessage(
    meetingId: string,
    message: Omit<IChatMessage, 'id' | 'timestamp'>
  ): Promise<IChatMessage> {
    const chatMessage: IChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    await this.meetingRepository.addChatMessage(meetingId, chatMessage);

    return chatMessage;
  }

  /**
   * End meeting
   */
  async endMeeting(meetingId: string, hostId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    const meeting = await this.meetingRepository.findById(meetingId);

    if (!meeting) {
      return { success: false, message: 'Meeting not found' };
    }

    if (meeting.hostId !== hostId) {
      return { success: false, message: 'Only host can end meeting' };
    }

    await this.meetingRepository.updateStatus(meetingId, MeetingStatus.ENDED);

    return { success: true };
  }

  /**
   * Toggle recording
   */
  async toggleRecording(
    meetingId: string,
    isRecording: boolean
  ): Promise<IMeeting | null> {
    const meeting = await this.meetingRepository.toggleRecording(meetingId, isRecording);
    return meeting ? meeting.toObject() : null;
  }

  /**
   * Get user's meetings
   */
  async getUserMeetings(userId: string): Promise<IMeeting[]> {
    const meetings = await this.meetingRepository.findUserMeetings(userId);
    return meetings.map(m => m.toObject());
  }

  /**
   * Admit participant from waiting room
   */
  async admitParticipant(
    meetingId: string,
    userId: string,
    hostId: string
  ): Promise<{ success: boolean; message?: string }> {
    const meeting = await this.meetingRepository.findById(meetingId);

    if (!meeting) {
      return { success: false, message: 'Meeting not found' };
    }

    if (meeting.hostId !== hostId) {
      return { success: false, message: 'Only host can admit participants' };
    }

    await this.meetingRepository.updateParticipant(meetingId, userId, {
      status: ParticipantStatus.JOINED
    });

    return { success: true };
  }
}