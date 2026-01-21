
import 'reflect-metadata';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import { container } from './config/inversify.config';
import { WebRTCSignalingService } from './services/WebRTCSignaling.service';
import meetingRoutes from './routes/meeting.routes';
import { TYPES } from './constants/types';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/meetings', meetingRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video-conference')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Initialize WebRTC Signaling
const signalingService = container.get<WebRTCSignalingService>(
  TYPES.WebRTCSignalingService
);
signalingService.initialize(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});