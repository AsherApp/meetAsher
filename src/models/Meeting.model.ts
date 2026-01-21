
import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  IMeeting,
  MeetingStatus,
  ParticipantRole,
  ParticipantStatus
} from '../validations/interfaces/meeting';



// export interface IMeetingDocument extends IMeeting, Document {}
export interface IMeetingDocument extends IMeeting, Document<Types.ObjectId> {}

const ParticipantSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  role: {
    type: String,
    enum: Object.values(ParticipantRole),
    default: ParticipantRole.PARTICIPANT
  },
  status: {
    type: String,
    enum: Object.values(ParticipantStatus),
    default: ParticipantStatus.WAITING
  },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date },
  isMuted: { type: Boolean, default: false },
  isVideoOff: { type: Boolean, default: false },
  isHandRaised: { type: Boolean, default: false },
  socketId: { type: String },
  peerId: { type: String }
}, { _id: false });

const MeetingSettingsSchema = new Schema({
  allowParticipantVideo: { type: Boolean, default: true },
  allowParticipantAudio: { type: Boolean, default: true },
  allowChat: { type: Boolean, default: true },
  allowScreenShare: { type: Boolean, default: true },
  waitingRoom: { type: Boolean, default: false },
  recordMeeting: { type: Boolean, default: false },
  maxParticipants: { type: Number, default: 100 },
  requirePassword: { type: Boolean, default: false },
  password: { type: String }
}, { _id: false });

const ChatMessageSchema = new Schema({
  id: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false },
  recipientId: { type: String }
}, { _id: false });

const MeetingSchema = new Schema<IMeetingDocument>({
  meetingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  hostId: {
    type: String,
    required: true,
    index: true
  },
  scheduledAt: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  duration: {
    type: Number
  },
  status: {
    type: String,
    enum: Object.values(MeetingStatus),
    default: MeetingStatus.SCHEDULED,
    index: true
  },
  participants: {
    type: [ParticipantSchema],
    default: []
  },
  settings: {
    type: MeetingSettingsSchema,
    required: true
  },
  recordingUrl: {
    type: String
  },
  isRecording: {
    type: Boolean,
    default: false
  },
  chatMessages: {
    type: [ChatMessageSchema],
    default: []
  }
}, {
  timestamps: true
});

// Indexes for better query performance
MeetingSchema.index({ meetingId: 1 });
MeetingSchema.index({ hostId: 1, status: 1 });
MeetingSchema.index({ 'participants.userId': 1 });
MeetingSchema.index({ scheduledAt: 1 });

// Generate unique meeting ID

MeetingSchema.pre('save', async function () {
  if (this.isNew && !this.meetingId) {
    this.meetingId = generateMeetingId();
  }
});


function generateMeetingId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segments = 3;
  const segmentLength = 4;
  
  const id = Array.from({ length: segments }, () =>
    Array.from({ length: segmentLength }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('')
  ).join('-');
  
  return id;
}

export const MeetingModel = mongoose.model<IMeetingDocument>('Meeting', MeetingSchema);