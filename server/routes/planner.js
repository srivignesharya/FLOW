import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { aiServiceLimiter } from '../middleware/rateLimiter.js';
import { callAiCompletion, studyPlanSchema } from '../services/gemini.js';
import { supabaseAdmin } from '../services/supabase.js';

const router = Router();

// Helper to normalize any arbitrary study plan structure (e.g. studyPlan, focusGoals, days) into the standard schema
export const normalizeStudyPlan = (rawPlan) => {
  if (!rawPlan || typeof rawPlan !== 'object') return null;

  // Extract raw daily plan array
  let rawDays = [];
  if (Array.isArray(rawPlan)) {
    rawDays = rawPlan;
  } else if (Array.isArray(rawPlan.dailyPlans)) {
    rawDays = rawPlan.dailyPlans;
  } else if (Array.isArray(rawPlan.studyPlan)) {
    rawDays = rawPlan.studyPlan;
  } else if (Array.isArray(rawPlan.schedule)) {
    rawDays = rawPlan.schedule;
  } else if (Array.isArray(rawPlan.days)) {
    rawDays = rawPlan.days;
  } else if (Array.isArray(rawPlan.plan)) {
    rawDays = rawPlan.plan;
  } else if (rawPlan.study_plan && Array.isArray(rawPlan.study_plan)) {
    rawDays = rawPlan.study_plan;
  } else {
    const foundArray = Object.values(rawPlan).find(v => Array.isArray(v));
    if (foundArray) rawDays = foundArray;
  }

  if (!rawDays || rawDays.length === 0) return null;

  const scheduleSummary = rawPlan.scheduleSummary || rawPlan.summary || rawPlan.overview || rawPlan.strategy || 'AI-Optimized 7-Day Academic Study Breakdown tailored to your task priorities and daily capacity.';

  const dailyPlans = rawDays.map((dayItem, dayIdx) => {
    let dayLabel = dayItem.day || dayItem.date || dayItem.dayName;
    if (!dayLabel) {
      const d = new Date(Date.now() + dayIdx * 24 * 3600 * 1000);
      dayLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    } else {
      const parsed = Date.parse(dayLabel);
      if (!isNaN(parsed) && String(dayLabel).includes('-')) {
        const d = new Date(dayLabel);
        dayLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      }
    }

    let rawBlocks = [];
    if (Array.isArray(dayItem.blocks)) {
      rawBlocks = dayItem.blocks;
    } else if (Array.isArray(dayItem.focusGoals)) {
      rawBlocks = dayItem.focusGoals;
    } else if (Array.isArray(dayItem.tasks)) {
      rawBlocks = dayItem.tasks;
    } else if (Array.isArray(dayItem.sessions)) {
      rawBlocks = dayItem.sessions;
    } else if (Array.isArray(dayItem.items)) {
      rawBlocks = dayItem.items;
    }

    let runningMinuteOffset = 9 * 60; // 09:00 AM base

    const blocks = rawBlocks.map((b, bIdx) => {
      const duration = Number(b.durationMinutes || b.estimated_minutes || b.minutes || b.duration || 60) || 60;
      
      const startH = Math.floor(runningMinuteOffset / 60);
      const startM = runningMinuteOffset % 60;
      const endOffset = runningMinuteOffset + duration;
      const endH = Math.floor(endOffset / 60);
      const endM = endOffset % 60;

      const formatTime = (h, m) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        const displayM = m < 10 ? `0${m}` : m;
        return `${displayH < 10 ? '0' + displayH : displayH}:${displayM} ${ampm}`;
      };

      const startTime = b.startTime || formatTime(startH, startM);
      const endTime = b.endTime || formatTime(endH, endM);
      runningMinuteOffset = endOffset + 15; // 15 min rest between blocks

      const title = (b.taskTitle || b.title || b.name || b.task || 'Study Session').toString().trim();
      const subject = (b.subject || b.course || 'General').toString().trim();
      const focusGoal = (b.focusGoal || b.note || b.description || b.goal || b.action || `Focus on ${title}`).toString().trim();
      let priority = (b.priority || 'medium').toString().toLowerCase();
      if (!['high', 'medium', 'low'].includes(priority)) priority = 'medium';

      return {
        id: b.id || b.taskId || `block-${dayIdx}-${bIdx}`,
        taskId: b.taskId || b.id || null,
        taskTitle: title,
        subject,
        startTime,
        endTime,
        durationMinutes: duration,
        priority,
        focusGoal,
        completed: Boolean(b.completed)
      };
    });

    const totalAllocatedMinutes = Number(dayItem.totalAllocatedMinutes) || blocks.reduce((acc, blk) => acc + blk.durationMinutes, 0);

    return {
      day: String(dayLabel),
      totalAllocatedMinutes,
      blocks
    };
  });

  return {
    scheduleSummary,
    dailyPlans
  };
};

// ============================================================
// POST /api/v1/planner/generate
// Uses Gemini Pro / Resilient AI to generate an optimised 7-day study plan
// ============================================================
router.post('/generate', requireAuth, aiServiceLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch user study preferences
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('preferred_study_hours_per_day, full_name')
      .eq('id', userId)
      .single();

    const studyHours = profile?.preferred_study_hours_per_day || 4;
    const studentName = profile?.full_name || 'Student';

    // Fetch all active (non-completed) tasks sorted by deadline
    const { data: tasks, error: tasksErr } = await supabaseAdmin
      .from('tasks')
      .select('id, title, subject, deadline, weightage, priority, estimated_minutes, task_type, status')
      .eq('user_id', userId)
      .neq('status', 'completed')
      .order('deadline', { ascending: true });

    if (tasksErr) throw tasksErr;

    if (!tasks || tasks.length === 0) {
      return res.status(400).json({
        error: 'No active pending tasks available. Add some tasks first before generating a study plan.'
      });
    }

    const today = new Date().toISOString();

    const prompt = `
Today is ${today}. Generate a comprehensive, realistic 7-day study plan for ${studentName}.

Student Daily Capacity: ${studyHours} hours (${studyHours * 60} minutes) of focused study per day.

Active Tasks (sorted by deadline, urgent first):
${JSON.stringify(tasks, null, 2)}

Instructions:
1. Prioritize high-priority tasks and those with nearest deadlines.
2. Distribute study blocks logically across the 7 days.
3. Break large tasks (>120 min estimated) across multiple study blocks.
4. Each focusGoal should be specific and actionable.
5. Include today and the next 6 days with human-readable calendar dates in the "day" field (e.g. "Monday, Oct 16").

Return a valid JSON object with this EXACT structure:
{
  "scheduleSummary": "High-level strategic summary of the 7-day study trajectory",
  "dailyPlans": [
    {
      "day": "Monday, Oct 16",
      "totalAllocatedMinutes": 180,
      "blocks": [
        {
          "id": "b-1",
          "taskId": "task-uuid-here",
          "taskTitle": "Task or Topic Name",
          "subject": "Subject Name",
          "startTime": "09:00 AM",
          "endTime": "10:30 AM",
          "durationMinutes": 90,
          "priority": "high",
          "focusGoal": "Specific actionable focus for this session",
          "completed": false
        }
      ]
    }
  ]
}
`;

    const systemPrompt = 'You are Flow AI, an expert academic study planner built by IMV. Output ONLY raw valid JSON conforming to the requested structure.';
    const aiResponseText = await callAiCompletion({
      prompt,
      systemPrompt,
      jsonMode: true,
      temperature: 0.2
    });

    let rawData = {};
    try {
      rawData = JSON.parse(aiResponseText);
    } catch (e) {
      const match = aiResponseText.match(/\{[\s\S]*\}/);
      if (match) {
        try { rawData = JSON.parse(match[0]); } catch (e2) {}
      }
    }

    // Pass through defensive normalizer to guarantee perfect schema
    const planData = normalizeStudyPlan(rawData) || rawData;

    // Deactivate old schedules
    await supabaseAdmin
      .from('study_schedules')
      .update({ is_active: false })
      .eq('user_id', userId);

    // Save new schedule
    const { data: scheduleRecord, error: schedErr } = await supabaseAdmin
      .from('study_schedules')
      .insert({
        user_id: userId,
        generated_plan: planData,
        is_active: true
      })
      .select()
      .single();

    if (schedErr) throw schedErr;

    res.json(scheduleRecord);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/v1/planner/current
// Returns the most recently generated active study plan (normalized)
// ============================================================
router.get('/current', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('study_schedules')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.json(null);

    // Defensively normalize the stored generated_plan so legacy/differently-formatted plans display perfectly
    const normalizedPlan = normalizeStudyPlan(data.generated_plan);
    if (normalizedPlan) {
      data.generated_plan = normalizedPlan;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PATCH /api/v1/planner/toggle-block
// Toggles block completion state in active schedule
// ============================================================
router.patch('/toggle-block', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { blockId, dayIndex, completed } = req.body;

    // Fetch active schedule
    const { data: schedule, error: fetchErr } = await supabaseAdmin
      .from('study_schedules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchErr || !schedule) {
      return res.status(404).json({ error: 'Active schedule not found' });
    }

    const normalized = normalizeStudyPlan(schedule.generated_plan) || schedule.generated_plan;
    const updatedPlan = { ...normalized };

    if (updatedPlan.dailyPlans && updatedPlan.dailyPlans[dayIndex]) {
      const blocks = updatedPlan.dailyPlans[dayIndex].blocks || [];
      const targetBlock = blocks.find((b) => b.id === blockId || b.taskId === blockId);
      if (targetBlock) {
        targetBlock.completed = completed;
      }
    }

    const { data: updatedRecord, error: updateErr } = await supabaseAdmin
      .from('study_schedules')
      .update({ generated_plan: updatedPlan })
      .eq('id', schedule.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json(updatedRecord);
  } catch (err) {
    next(err);
  }
});

export default router;
