import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
// Reload timestamp: 2026-09-15 01:05

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import franchisePortalRoutes from './routes/franchisePortalRoutes.js';
import { verifyAdminSession } from './middlewares/authMiddleware.js';
import { autoMigrate } from './utils/autoMigrate.js';
import { startAccountDeletionJob } from './jobs/accountDeletionJob.js';
import { registerUser, unregisterUser, getSocketId, getOnlineKeys } from './utils/onlineTracker.js';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Serve uploaded files statically with CORS enabled
const staticUploadOptions = {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
};
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), staticUploadOptions));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'), staticUploadOptions));

// ==========================================
// SCALABILITY & SECURITY MIDDLEWARES
// ==========================================

app.use(helmet());
app.use(compression());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 2000, 
  standardHeaders: true, 
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter);

const allowedOrigins = [
  'http://localhost:5173',
  'https://kerala.bharathmarriage.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ==========================================
// ROUTES (Universal mounting for cPanel Passenger & Local dev)
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/', authRoutes);

app.use('/api/users', userRoutes);
app.use('/users', userRoutes);
app.use('/api/chats', userRoutes);
app.use('/chats', userRoutes);

app.use('/api/admin', verifyAdminSession, adminRoutes);
app.use('/admin', verifyAdminSession, adminRoutes);

app.use('/api/payments', paymentRoutes);
app.use('/payments', paymentRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/payment', paymentRoutes);

app.use('/api/franchise', franchisePortalRoutes);
app.use('/franchise', franchisePortalRoutes);

app.use('/api/public', publicRoutes);
app.use('/public', publicRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('[SERVER GLOBAL ERROR]', err);
  res.status(500).json({ error: err.message || 'Something went wrong on the server!' });
});

// ==========================================
// SOCKET.IO WEBRTC SIGNALING
// ==========================================
const io = new Server(httpServer, {
  path: '/api/socket.io',
  cors: {
    origin: true,
    credentials: true,
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  socket.on('register', (data) => {
    if (!data) return;
    let pid = null;
    let uid = null;

    if (typeof data === 'string' || typeof data === 'number') {
      pid = data.toString().toLowerCase();
    } else if (typeof data === 'object') {
      if (data.profile_id) pid = data.profile_id.toString().toLowerCase();
      if (data.id) uid = data.id.toString().toLowerCase();
    }

    registerUser(pid, uid, socket.id);
    if (pid || uid) {
      socket.broadcast.emit('USER_STATUS_CHANGE', {
        profileId: pid,
        userId: uid,
        online: true
      });
    }
  });

  // WebRTC Relay Events
  socket.on('OFFER_CALL', (data) => {
    const targetId = data.targetId?.toString().toLowerCase();
    const targetProfileId = data.targetProfileId?.toString().toLowerCase();
    
    const targetSocketId = getSocketId(targetId) || getSocketId(targetProfileId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc_signaling', { ...data, type: 'OFFER_CALL' });
    } else {
      socket.emit('webrtc_signaling', {
        type: 'USER_UNAVAILABLE',
        targetId: targetId || targetProfileId,
        message: 'The member is currently offline or unreachable. Please try calling again later.'
      });
    }
  });

  ['ANSWER_CALL', 'ICE_CANDIDATE', 'END_CALL'].forEach(eventType => {
    socket.on(eventType, (data) => {
      const targetId = data.targetId?.toString().toLowerCase();
      const targetProfileId = data.targetProfileId?.toString().toLowerCase();
      
      const targetSocketId = getSocketId(targetId) || getSocketId(targetProfileId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_signaling', { ...data, type: eventType });
      }
    });
  });

  socket.on('disconnect', async () => {
    const result = await unregisterUser(socket.id);
    if (result && result.wentOffline) {
      socket.broadcast.emit('USER_STATUS_CHANGE', {
        profileId: result.profileId,
        userId: result.userId,
        online: false
      });
    }
  });
});

// Trigger database auto-migration and background tasks immediately on startup (for cPanel Passenger & local dev)
autoMigrate().catch(err => console.error('[Startup AutoMigrate Error]', err));
startAccountDeletionJob();

// Start the server
httpServer.listen(PORT, () => {
  console.log(`Optimized backend server & Socket.IO running on port ${PORT}`);
});

export default httpServer;

