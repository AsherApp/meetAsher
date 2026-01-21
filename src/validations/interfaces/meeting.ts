import { Types } from "mongoose";

export enum MeetingStatus {
    SCHEDULED = 'scheduled',
    ACTIVE = 'active',
    ENDED = 'ended',
    CANCELLED = 'cancelled'
}

export enum ParticipantRole {
    HOST = 'host',
    CO_HOST = 'co-host',
    PARTICIPANT = 'participant'
}

export enum ParticipantStatus {
    JOINED = 'joined',
    LEFT = 'left',
    WAITING = 'waiting',
    REMOVED = 'removed'
}

export interface IMeeting {
    meetingId: string;
    title: string;
    description?: string;
    hostId: string;
    scheduledAt?: Date;
    startedAt?: Date;
    endedAt?: Date;
    duration?: number;
    status: MeetingStatus;
    participants: IParticipant[];
    settings: IMeetingSettings;
    recordingUrl?: string;
    isRecording: boolean;
    chatMessages: IChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IParticipant {
    userId: string;
    name: string;
    email?: string;
    role: ParticipantRole;
    status: ParticipantStatus;
    joinedAt: Date;
    leftAt?: Date;
    isMuted: boolean;
    isVideoOff: boolean;
    isHandRaised: boolean;
    socketId?: string;
    peerId?: string;
}

export interface IMeetingSettings {
    allowParticipantVideo: boolean;
    allowParticipantAudio: boolean;
    allowChat: boolean;
    allowScreenShare: boolean;
    waitingRoom: boolean;
    recordMeeting: boolean;
    maxParticipants: number;
    requirePassword: boolean;
    password?: string;
}

export interface IChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: Date;
    isPrivate: boolean;
    recipientId?: string;
}

export interface SignalingMessage {
    type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'user-joined' | 'user-left';
    from: string;
    to?: string;
    meetingId: string;
    data?: any;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
    participant?: IParticipant;
}

export interface CreateMeetingDto {
    title: string;
    description?: string;
    hostId: string;
    scheduledAt?: Date;
    duration?: number;
    settings?: Partial<IMeetingSettings>;
}

export interface JoinMeetingDto {
    meetingId: string;
    userId: string;
    name: string;
    email?: string;
    password?: string;
}