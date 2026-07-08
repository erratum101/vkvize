import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import quizRoutes from './routes/quizzes';
import sessionRoutes from './routes/sessions';
import categoryRoutes from './routes/categories';
import uploadRoutes from './routes/upload';
import { setupSocket } from './socket';

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

const configuredOrigins = CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
const localDevOriginPattern =
  /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;

function isVercelAppOrigin(origin: string) {
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin: string | undefined) {
  if (!origin) return true;
  if (configuredOrigins.includes(origin)) return true;
  if (isVercelAppOrigin(origin)) return true;
  return process.env.NODE_ENV !== 'production' && localDevOriginPattern.test(origin);
}

const corsOptions = {
  origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
    callback(null, isAllowedOrigin(origin));
  },
};

const io = new Server(server, {
  cors: { ...corsOptions, methods: ['GET', 'POST'] },
});

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);

setupSocket(io);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

export { io };
