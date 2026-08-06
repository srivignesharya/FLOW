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
import { requireAuth } from './middleware/authMiddleware.js';
import { sendTestEmail } from './services/emailService.js';
import { supabaseAdmin } from './services/supabase.js';

import { initReminderScheduler } from './jobs/reminderJob.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy headers (Render, Cloudflare, NGINX)
app.set('trust proxy', 1);

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

// Test Email Endpoint with Detailed Execution Timing
app.post('/api/v1/test-email', requireAuth, async (req, res) => {
  const reqStart = performance.now();
  console.log(`\n⏱️ [API REQUEST START]: POST /api/v1/test-email received at ${new Date().toISOString()}`);

  try {
    const userEmail = req.user.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'User email not found in authentication token' });
    }

    // Measure Profile Lookup
    const profileStart = performance.now();
    let userName = req.user.user_metadata?.full_name || 'Student';
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', req.user.id)
      .single();

    if (profile?.full_name) {
      userName = profile.full_name;
    }
    const profileDurationMs = (performance.now() - profileStart).toFixed(2);
    console.log(`⏱️ [PROFILE LOOKUP TIME]: ${profileDurationMs} ms`);

    // Measure Email Dispatch
    const emailStart = performance.now();
    const emailResult = await sendTestEmail({ toEmail: userEmail, userName });
    const emailDurationMs = (performance.now() - emailStart).toFixed(2);

    const totalResponseMs = (performance.now() - reqStart).toFixed(2);

    console.log('\n============================================================');
    console.log('📊 [TEST EMAIL PERFORMANCE REPORT]:');
    console.log(`   1. Profile DB Lookup:        ${profileDurationMs} ms`);
    console.log(`   2. SMTP sendMail Execution:   ${emailResult?.smtpDurationMs || emailDurationMs} ms`);
    console.log(`   3. Total Email Service:       ${emailDurationMs} ms`);
    console.log(`   4. Total API Response Time:   ${totalResponseMs} ms (${(totalResponseMs / 1000).toFixed(2)} seconds)`);
    console.log('============================================================\n');

    return res.json({
      success: true,
      message: `Test email sent successfully to ${userEmail}`,
      metrics: {
        profileLookupMs: Number(profileDurationMs),
        smtpDurationMs: Number(emailResult?.smtpDurationMs || emailDurationMs),
        totalResponseMs: Number(totalResponseMs),
        totalResponseSeconds: Number((totalResponseMs / 1000).toFixed(2))
      }
    });
  } catch (err) {
    const totalResponseMs = (performance.now() - reqStart).toFixed(2);
    console.error(`❌ [POST /api/v1/test-email ERROR after ${totalResponseMs} ms]:`, err.message);

    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to send test email',
      metrics: {
        totalResponseMs: Number(totalResponseMs),
        totalResponseSeconds: Number((totalResponseMs / 1000).toFixed(2))
      }
    });
  }
});

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

  // Start deadline reminder scheduler
  initReminderScheduler();
});
