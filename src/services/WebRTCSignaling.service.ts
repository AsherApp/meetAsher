import { Server as SocketIOServer, Socket } from 'socket.io';
import { injectable, inject } from 'inversify';
import { MeetingService } from './MeetingService';
import { TYPES } from '../constants/types';
import { SignalingMessage, ParticipantStatus } from '../validations/interfaces/IMeet';

interface SocketData {
  userId: string;
  meetingId: string;
  name: string;
}

@injectable()
export class WebRTCSignalingService {
  private io: SocketIOServer | null = null;
  private meetings: Map<string, Map<string, Socket>> = new Map();

  constructor(
    @inject(TYPES.MeetingService)
    private meetingService: MeetingService
  ) {}

  /**
   * Initialize Socket.IO server
   */
  initialize(io: SocketIOServer): void {
    this.io = io;

    io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      this.handleJoinMeeting(socket);
      this.handleOffer(socket);
      this.handleAnswer(socket);
      this.handleIceCandidate(socket);
      this.handleChatMessage(socket);
      this.handleToggleMute(socket);
      this.handleToggleVideo(socket);
      this.handleHandRaise(socket);
      this.handleScreenShare(socket);
      this.handleDisconnect(socket);
      this.handleLeaveMeeting(socket);
    });
  }

  /**
   * Handle join meeting
   */
  private handleJoinMeeting(socket: Socket): void {
    socket.on('join-meeting', async (data: {
      meetingId: string;
      userId: string;
      name: string;
      email?: string;
    }) => {
      try {
        const { meetingId, userId, name, email } = data;

        // Join meeting through service
        const result = await this.meetingService.joinMeeting({
          meetingId,
          userId,
          name,
          email
        });

        if (!result.success) {
          socket.emit('join-error', { message: result.message });
          return;
        }

        // Store socket in meetings map
        if (!this.meetings.has(meetingId)) {
          this.meetings.set(meetingId, new Map());
        }

        const meetingRoom = this.meetings.get(meetingId)!;
        meetingRoom.set(userId, socket);

        // Join socket.io room
        socket.join(meetingId);

        // Store data in socket
        socket.data = { userId, meetingId, name } as SocketData;

        // Notify user
        socket.emit('join-success', {
          meeting: result.meeting,
          participant: result.participant
        });

        // Get existing participants
        const existingParticipants = Array.from(meetingRoom.entries())
          .filter(([id]) => id !== userId)
          .map(([id, s]) => ({
            userId: id,
            socketId: s.id,
            name: (s.data as SocketData).name
          }));

        // Send existing participants to new user
        socket.emit('existing-participants', existingParticipants);

        // Notify others about new participant
        socket.to(meetingId).emit('user-joined', {
          userId,
          socketId: socket.id,
          name,
          participant: result.participant
        });

        console.log(`User ${userId} joined meeting ${meetingId}`);
      } catch (error) {
        console.error('Error joining meeting:', error);
        socket.emit('join-error', { message: 'Failed to join meeting' });
      }
    });
  }

  /**
   * Handle WebRTC offer
   */
  private handleOffer(socket: Socket): void {
    socket.on('offer', async (data: {
      to: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      const { to, offer } = data;
      const from = (socket.data as SocketData).userId;
      const meetingId = (socket.data as SocketData).meetingId;

      if (!meetingId) return;

      const meetingRoom = this.meetings.get(meetingId);
      const targetSocket = meetingRoom?.get(to);

      if (targetSocket) {
        targetSocket.emit('offer', {
          from,
          offer
        });
      }
    });
  }

  /**
   * Handle WebRTC answer
   */
  private handleAnswer(socket: Socket): void {
    socket.on('answer', async (data: {
      to: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const { to, answer } = data;
      const from = (socket.data as SocketData).userId;
      const meetingId = (socket.data as SocketData).meetingId;

      if (!meetingId) return;

      const meetingRoom = this.meetings.get(meetingId);
      const targetSocket = meetingRoom?.get(to);

      if (targetSocket) {
        targetSocket.emit('answer', {
          from,
          answer
        });
      }
    });
  }

  /**
   * Handle ICE candidate
   */
  private handleIceCandidate(socket: Socket): void {
    socket.on('ice-candidate', async (data: {
      to: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const { to, candidate } = data;
      const from = (socket.data as SocketData).userId;
      const meetingId = (socket.data as SocketData).meetingId;

      if (!meetingId) return;

      const meetingRoom = this.meetings.get(meetingId);
      const targetSocket = meetingRoom?.get(to);

      if (targetSocket) {
        targetSocket.emit('ice-candidate', {
          from,
          candidate
        });
      }
    });
  }

  /**
   * Handle chat message
   */
  private handleChatMessage(socket: Socket): void {
    socket.on('chat-message', async (data: {
      message: string;
      isPrivate?: boolean;
      recipientId?: string;
    }) => {
      const { userId, meetingId, name } = socket.data as SocketData;

      if (!meetingId) return;

      const chatMessage = await this.meetingService.sendChatMessage(meetingId, {
        senderId: userId,
        senderName: name,
        message: data.message,
        isPrivate: data.isPrivate || false,
        recipientId: data.recipientId
      });

      if (data.isPrivate && data.recipientId) {
        // Send to specific user
        const meetingRoom = this.meetings.get(meetingId);
        const targetSocket = meetingRoom?.get(data.recipientId);
        
        if (targetSocket) {
          targetSocket.emit('chat-message', chatMessage);
        }
        socket.emit('chat-message', chatMessage); // Echo to sender
      } else {
        // Broadcast to all
        this.io?.to(meetingId).emit('chat-message', chatMessage);
      }
    });
  }

  /**
   * Handle toggle mute
   */
  private handleToggleMute(socket: Socket): void {
    socket.on('toggle-mute', async (isMuted: boolean) => {
      const { userId, meetingId } = socket.data as SocketData;

      if (!meetingId) return;

      await this.meetingService.updateParticipant(meetingId, userId, { isMuted });

      socket.to(meetingId).emit('participant-muted', {
        userId,
        isMuted
      });
    });
  }

  /**
   * Handle toggle video
   */
  private handleToggleVideo(socket: Socket): void {
    socket.on('toggle-video', async (isVideoOff: boolean) => {
      const { userId, meetingId } = socket.data as SocketData;

      if (!meetingId) return;

      await this.meetingService.updateParticipant(meetingId, userId, { isVideoOff });

      socket.to(meetingId).emit('participant-video-toggled', {
        userId,
        isVideoOff
      });
    });
  }

  /**
   * Handle hand raise
   */
  private handleHandRaise(socket: Socket): void {
    socket.on('raise-hand', async (isHandRaised: boolean) => {
      const { userId, meetingId, name } = socket.data as SocketData;

      if (!meetingId) return;

      await this.meetingService.updateParticipant(meetingId, userId, { isHandRaised });

      socket.to(meetingId).emit('hand-raised', {
        userId,
        name,
        isHandRaised
      });
    });
  }

  /**
   * Handle screen share
   */
  private handleScreenShare(socket: Socket): void {
    socket.on('start-screen-share', () => {
      const { userId, meetingId } = socket.data as SocketData;

      if (!meetingId) return;

      socket.to(meetingId).emit('screen-share-started', { userId });
    });

    socket.on('stop-screen-share', () => {
      const { userId, meetingId } = socket.data as SocketData;

      if (!meetingId) return;

      socket.to(meetingId).emit('screen-share-stopped', { userId });
    });
  }

  /**
   * Handle leave meeting
   */
  private handleLeaveMeeting(socket: Socket): void {
    socket.on('leave-meeting', async () => {
      await this.handleUserLeaving(socket);
    });
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(socket: Socket): void {
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      await this.handleUserLeaving(socket);
    });
  }

  /**
   * Handle user leaving
   */
  private async handleUserLeaving(socket: Socket): Promise<void> {
    const data = socket.data as SocketData;
    
    if (!data || !data.meetingId) return;

    const { userId, meetingId } = data;

    // Remove from meetings map
    const meetingRoom = this.meetings.get(meetingId);
    if (meetingRoom) {
      meetingRoom.delete(userId);
      
      if (meetingRoom.size === 0) {
        this.meetings.delete(meetingId);
      }
    }

    // Leave socket.io room
    socket.leave(meetingId);

    // Update in database
    await this.meetingService.leaveMeeting(meetingId, userId);

    // Notify others
    socket.to(meetingId).emit('user-left', { userId });
  }
}

export default WebRTCSignalingService;