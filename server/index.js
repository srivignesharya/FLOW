import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import ingestRoutes from './routes/ingest.js';
import taskRoutes from './routes/tasks.js';
import plannerRoutes from './routes/planner.js';
import copilotRoutes from './routes/copilot.js';

import { standardLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './utils/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// SECURITY & PARSING MIDDLEWARE
// ============================================================
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(standardLimiter);

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/ingest', ingestRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/planner', plannerRoutes);
app.use('/api/v1/copilot', copilotRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'flow-server',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ============================================================
// GLOBAL ERROR HANDLER (must be last)
// ============================================================
app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`\n⚡ [FLOW SERVER] Running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Client URL:  ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
});
