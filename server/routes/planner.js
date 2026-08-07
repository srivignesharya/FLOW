import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { aiServiceLimiter } from '../middleware/rateLimiter.js';
import { ai, PRO_MODEL, studyPlanSchema, getAiInstance, rotateAiKey } from '../services/gemini.js';
import { supabaseAdmin } from '../services/supabase.js';

const router = Router();

// ============================================================
// POST /api/v1/planner/generate
// Uses Gemini Pro to generate an optimised 7-day study plan
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

Student Capacity: ${studyHours} hours (${studyHours * 60} minutes) of focused study per day.

Active Tasks (sorted by deadline, urgent first):
${JSON.stringify(tasks, null, 2)}

Instructions:
1. Prioritize high-priority tasks and those with nearest deadlines.
2. Distribute study blocks logically — don't front-load all content.
3. Include breaks implicitly (plan around the available minutes, not the full day).
4. Break large tasks (>120 min estimated) across multiple days.
5. Each focusGoal should be specific and actionable (e.g., "Complete chapters 3-4 of Biology textbook", not just "Study Biology").
6. Include today and the next 6 days with real calendar dates in the "day" field.
`;

    let aiResponse;
    try {
      const activeAi = getAiInstance();
      aiResponse = await activeAi.models.generateContent({
        model: PRO_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: studyPlanSchema,
          temperature: 0.2
        }
      });
    } catch (apiErr) {
      console.warn(`⚠️ [PLANNER GEMINI PRIMARY FAILED]: ${apiErr.message}. Rotating key and retrying with fallback model...`);
      rotateAiKey();
      const rotatedAi = getAiInstance();
      aiResponse = await rotatedAi.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: studyPlanSchema,
          temperature: 0.2
        }
      });
    }

    const planData = JSON.parse(aiResponse.text);

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
// Returns the most recently generated active study plan
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
    res.json(data || null);
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

    const updatedPlan = { ...schedule.generated_plan };

    if (updatedPlan.dailyPlans && updatedPlan.dailyPlans[dayIndex]) {
      const blocks = updatedPlan.dailyPlans[dayIndex].blocks;
      const targetBlock = blocks.find((b) => b.id === blockId);
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
