import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin, isUserAdmin } from '../middleware/adminMiddleware.js';
import { supabaseAdmin } from '../services/supabase.js';
import {
  callAiCompletion,
  hasGemini,
  getGeminiClient,
  PRO_MODEL,
  FALLBACK_MODEL,
  GEMINI_FLASH_MODEL
} from '../services/gemini.js';
import { sendDeadlineReminder } from '../services/emailService.js';

const router = Router();

// ============================================================
// 1. GET /api/v1/admin/check
// Lightweight endpoint to check if authenticated user is admin
// ============================================================
router.get('/check', requireAuth, async (req, res) => {
  try {
    const isAdmin = isUserAdmin(req.user);
    res.json({
      isAdmin,
      email: req.user.email,
      userId: req.user.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// All subsequent routes require admin rights
router.use(requireAuth, requireAdmin);

// ============================================================
// 2. GET /api/v1/admin/stats
// High-level KPI aggregations, charts, and system status
// ============================================================
router.get('/stats', async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Users count from Auth
    const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });
    if (usersErr) throw usersErr;
    const totalUsers = usersData?.users?.length || 0;
    const recentSignups = (usersData?.users || []).filter(u => u.created_at >= sevenDaysAgo).length;

    // 2. Total Documents Ingested
    const { count: totalDocs, error: docErr } = await supabaseAdmin
      .from('documents')
      .select('*', { count: 'exact', head: true });
    if (docErr) throw docErr;

    // 3. Tasks Breakdown
    const { data: tasksData, error: taskErr } = await supabaseAdmin
      .from('tasks')
      .select('status, priority, created_at');
    if (taskErr) throw taskErr;

    const totalTasks = tasksData?.length || 0;
    const completedTasks = tasksData?.filter(t => t.status === 'completed').length || 0;
    const pendingTasks = tasksData?.filter(t => t.status === 'pending').length || 0;
    const highPriorityTasks = tasksData?.filter(t => t.priority === 'high').length || 0;

    // 4. Copilot Total Messages
    const { count: totalMessages, error: msgErr } = await supabaseAdmin
      .from('copilot_messages')
      .select('*', { count: 'exact', head: true });
    if (msgErr) throw msgErr;

    // 5. Active Study Schedules
    const { count: activeSchedules, error: schedErr } = await supabaseAdmin
      .from('study_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    if (schedErr) throw schedErr;

    // 6. Generate 7-day activity trend
    const dayLabels = [];
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dayLabels.push(key);
      trendMap[key] = { date: key, label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }), tasks: 0, users: 0 };
    }

    (usersData?.users || []).forEach(u => {
      const key = (u.created_at || '').slice(0, 10);
      if (trendMap[key]) trendMap[key].users += 1;
    });

    (tasksData || []).forEach(t => {
      const key = (t.created_at || '').slice(0, 10);
      if (trendMap[key]) trendMap[key].tasks += 1;
    });

    const activityTrend = dayLabels.map(k => trendMap[k]);

    // 7. System Health Status
    const emailConfigured = Boolean(process.env.RESEND_API_KEY || (process.env.EMAIL_USER && process.env.EMAIL_PASS));

    const systemHealth = {
      groq: {
        status: process.env.GROQ_API_KEY ? 'active' : 'missing_key',
        primaryModel: PRO_MODEL,
        fallbackModel: FALLBACK_MODEL
      },
      gemini: {
        status: hasGemini() ? 'active' : 'inactive',
        model: GEMINI_FLASH_MODEL
      },
      database: {
        status: 'healthy',
        provider: 'Supabase PostgreSQL'
      },
      emailService: {
        status: emailConfigured ? 'active' : 'unconfigured',
        provider: process.env.RESEND_API_KEY ? 'Resend API' : 'Gmail SMTP',
        sender: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'flowbyimv@gmail.com'
      }
    };

    res.json({
      summary: {
        totalUsers,
        recentSignups,
        totalDocs: totalDocs || 0,
        totalTasks,
        completedTasks,
        pendingTasks,
        highPriorityTasks,
        totalMessages: totalMessages || 0,
        activeSchedules: activeSchedules || 0
      },
      activityTrend,
      systemHealth
    });
  } catch (err) {
    console.error('[ADMIN STATS ERROR]:', err);
    next(err);
  }
});

// ============================================================
// 3. GET /api/v1/admin/users
// Comprehensive student & user directory with stats
// ============================================================
router.get('/users', async (req, res, next) => {
  try {
    const { search = '', role = 'all', page = 1, limit = 50 } = req.query;

    // Fetch Auth Users
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });
    if (authErr) throw authErr;

    // Fetch Profiles
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('*');
    if (profErr) throw profErr;

    // Fetch Task & Document counts
    const { data: tasks } = await supabaseAdmin.from('tasks').select('user_id, status');
    const { data: docs } = await supabaseAdmin.from('documents').select('user_id');
    const { data: messages } = await supabaseAdmin.from('copilot_messages').select('user_id');

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    const taskCountMap = new Map();
    const docCountMap = new Map();
    const msgCountMap = new Map();

    (tasks || []).forEach(t => {
      taskCountMap.set(t.user_id, (taskCountMap.get(t.user_id) || 0) + 1);
    });
    (docs || []).forEach(d => {
      docCountMap.set(d.user_id, (docCountMap.get(d.user_id) || 0) + 1);
    });
    (messages || []).forEach(m => {
      msgCountMap.set(m.user_id, (msgCountMap.get(m.user_id) || 0) + 1);
    });

    let combinedUsers = (authData?.users || []).map(u => {
      const prof = profileMap.get(u.id);
      const isAdm = isUserAdmin(u) || prof?.role === 'admin';
      return {
        id: u.id,
        email: u.email,
        fullName: prof?.full_name || u.user_metadata?.full_name || u.user_metadata?.name || 'Student',
        avatarUrl: prof?.avatar_url || u.user_metadata?.avatar_url || null,
        institution: prof?.academic_institution || 'Not Specified',
        preferredStudyHours: prof?.preferred_study_hours_per_day || 4,
        role: isAdm ? 'admin' : 'student',
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at || u.created_at,
        emailConfirmed: Boolean(u.email_confirmed_at),
        tasksCount: taskCountMap.get(u.id) || 0,
        documentsCount: docCountMap.get(u.id) || 0,
        messagesCount: msgCountMap.get(u.id) || 0
      };
    });

    // Apply Filter & Search
    if (role !== 'all') {
      combinedUsers = combinedUsers.filter(u => u.role === role);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      combinedUsers = combinedUsers.filter(u =>
        u.email.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.institution.toLowerCase().includes(q)
      );
    }

    // Sort by newest
    combinedUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const total = combinedUsers.length;
    const paginated = combinedUsers.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    res.json({
      users: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (err) {
    console.error('[ADMIN USERS ERROR]:', err);
    next(err);
  }
});

// ============================================================
// 4. PATCH /api/v1/admin/users/:id/role
// Promote or demote user role
// ============================================================
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "admin" or "student"' });
    }

    // Update Supabase Auth user metadata
    const { data: updatedUser, error: authErr } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { role }
    });
    if (authErr) throw authErr;

    // Update profile if column exists (ignore error if column not in schema)
    try {
      await supabaseAdmin.from('profiles').update({ role }).eq('id', id);
    } catch (_) {}

    res.json({
      success: true,
      message: `User role updated to ${role} successfully.`,
      user: updatedUser.user
    });
  } catch (err) {
    console.error('[ADMIN ROLE UPDATE ERROR]:', err);
    next(err);
  }
});

// ============================================================
// 5. DELETE /api/v1/admin/users/:id
// Completely delete a user and all their records
// ============================================================
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account.' });
    }

    // Clean up dependent tables
    await supabaseAdmin.from('copilot_messages').delete().eq('user_id', id);
    await supabaseAdmin.from('study_schedules').delete().eq('user_id', id);
    await supabaseAdmin.from('tasks').delete().eq('user_id', id);
    await supabaseAdmin.from('documents').delete().eq('user_id', id);
    await supabaseAdmin.from('profiles').delete().eq('id', id);

    // Remove from Auth
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authErr) throw authErr;

    res.json({ success: true, message: 'User permanently deleted.' });
  } catch (err) {
    console.error('[ADMIN DELETE USER ERROR]:', err);
    next(err);
  }
});

// ============================================================
// 6. GET /api/v1/admin/documents
// All uploaded documents across users
// ============================================================
router.get('/documents', async (req, res, next) => {
  try {
    const { data: docs, error } = await supabaseAdmin
      .from('documents')
      .select('id, user_id, file_name, file_type, created_at, raw_text_content, profiles(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Get count of tasks created from each document
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('document_id');

    const taskCountMap = new Map();
    (tasks || []).forEach(t => {
      if (t.document_id) {
        taskCountMap.set(t.document_id, (taskCountMap.get(t.document_id) || 0) + 1);
      }
    });

    const enrichedDocs = (docs || []).map(d => ({
      id: d.id,
      fileName: d.file_name,
      fileType: d.file_type,
      createdAt: d.created_at,
      userEmail: d.profiles?.email || 'Unknown',
      userName: d.profiles?.full_name || 'Student',
      hasText: Boolean(d.raw_text_content && d.raw_text_content.length > 0),
      textLength: d.raw_text_content ? d.raw_text_content.length : 0,
      tasksGenerated: taskCountMap.get(d.id) || 0
    }));

    res.json(enrichedDocs);
  } catch (err) {
    console.error('[ADMIN DOCUMENTS ERROR]:', err);
    next(err);
  }
});

// ============================================================
// 7. GET /api/v1/admin/documents/:id/preview
// Inspect extracted text content of any document
// ============================================================
router.get('/documents/:id/preview', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: doc, error } = await supabaseAdmin
      .from('documents')
      .select('id, file_name, file_type, raw_text_content, created_at')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 8. DELETE /api/v1/admin/documents/:id
// Purge an uploaded document
// ============================================================
router.delete('/documents/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('documents').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Document purged successfully.' });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 9. POST /api/v1/admin/test-ai
// Interactive AI Benchmark / Playground for testing prompts & latency
// ============================================================
router.post('/test-ai', async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { prompt = 'Analyze study priorities for next week.', modelProvider = 'auto' } = req.body;

    const preferGemini = modelProvider === 'gemini';
    const completion = await callAiCompletion({
      prompt,
      preferGemini,
      temperature: 0.3
    });

    const durationMs = Date.now() - startTime;
    res.json({
      success: true,
      durationMs,
      characters: completion.length,
      estimatedTokens: Math.ceil(completion.length / 4),
      providerUsed: preferGemini ? 'Gemini 2.5 Flash' : 'Groq Llama 3.3',
      output: completion
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    res.status(500).json({
      success: false,
      durationMs,
      error: err.message
    });
  }
});

// ============================================================
// 10. POST /api/v1/admin/broadcast-email
// Send direct email notification to a student
// ============================================================
router.post('/broadcast-email', async (req, res, next) => {
  try {
    const { recipientEmail, subject, message } = req.body;

    if (!recipientEmail || !subject || !message) {
      return res.status(400).json({ error: 'Recipient email, subject, and message are required.' });
    }

    const emailSent = await sendDeadlineReminder({
      toEmail: recipientEmail,
      userName: 'Student',
      assignmentTitle: subject,
      subject: 'Administrator Announcement',
      priority: 'high',
      deadlineFormatted: new Date().toLocaleDateString(),
      estimatedStudyTime: 'Notice',
      throwOnError: true
    });

    res.json({
      success: true,
      message: `Announcement dispatched to ${recipientEmail}`,
      details: emailSent
    });
  } catch (err) {
    console.error('[ADMIN BROADCAST ERROR]:', err);
    next(err);
  }
});

export default router;
