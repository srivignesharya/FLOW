import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody, manualTaskSchema } from '../middleware/validation.js';
import { supabaseAdmin } from '../services/supabase.js';
import { sanitizeAndValidateTask } from '../utils/taskValidator.js';

const router = Router();

// ============================================================
// GET /api/v1/tasks
// List authenticated user's tasks (with optional filters)
// ============================================================
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, subject, priority } = req.query;

    let query = supabaseAdmin
      .from('tasks')
      .select('*, documents(file_name, file_type)')
      .eq('user_id', req.user.id);

    if (status) query = query.eq('status', status);
    if (subject) query = query.eq('subject', subject);
    if (priority) query = query.eq('priority', priority);

    const { data, error } = await query.order('deadline', { ascending: true });
    if (error) throw error;

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/v1/tasks
// Create a manual task (without document upload)
// ============================================================
router.post('/', requireAuth, validateBody(manualTaskSchema), async (req, res, next) => {
  try {
    const rawTask = req.body;
    const cleanTask = sanitizeAndValidateTask(rawTask, 0, rawTask.subject || 'General');

    if (!cleanTask || !cleanTask.title) {
      return res.status(400).json({ error: 'Task title is required and cannot be empty.' });
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        user_id: req.user.id,
        title: cleanTask.title,
        subject: cleanTask.subject,
        deadline: cleanTask.deadline,
        weightage: cleanTask.weightage,
        priority: cleanTask.priority,
        estimated_minutes: cleanTask.estimatedMinutes,
        description: cleanTask.description,
        task_type: cleanTask.taskType
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PATCH /api/v1/tasks/:id
// Update task fields (status, priority, deadline, etc.)
// ============================================================
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const allowedFields = ['status', 'priority', 'deadline', 'estimated_minutes', 'description', 'title', 'subject', 'weightage', 'task_type'];
    const updatePayload = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updatePayload[field] = req.body[field];
    });

    // Also handle camelCase from frontend
    if (req.body.estimatedMinutes !== undefined) updatePayload.estimated_minutes = req.body.estimatedMinutes;
    if (req.body.taskType !== undefined) updatePayload.task_type = req.body.taskType;

    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updatePayload)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id) // ownership check
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Task not found or access denied' });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// DELETE /api/v1/tasks/:id
// ============================================================
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { error, count } = await supabaseAdmin
      .from('tasks')
      .delete({ count: 'exact' })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    if (count === 0) return res.status(404).json({ error: 'Task not found or access denied' });

    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
