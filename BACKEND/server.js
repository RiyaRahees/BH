import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { verifyAdminSession } from './middlewares/authMiddleware.js';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// SCALABILITY & SECURITY MIDDLEWARES
// ==========================================

// 1. Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet());

// 2. Compress all responses for performance
app.use(compression());

// 3. Rate limiting to prevent brute-force and DDoS attacks
// Limits each IP to 2000 requests per 15 minutes (accommodates 15s polling)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 2000, 
  standardHeaders: true, 
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter);

// 4. Standard Middlewares
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
app.use(express.json()); // Built-in body parser
app.use(cookieParser());

// ==========================================
// ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', verifyAdminSession, adminRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Optimized backend server running on port ${PORT}`);
});
