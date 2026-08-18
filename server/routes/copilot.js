import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody, copilotQuerySchema } from '../middleware/validation.js';
import { ai, PRO_MODEL, FALLBACK_MODEL, getAiInstance, rotateAiKey } from '../services/gemini.js';
import { supabaseAdmin } from '../services/supabase.js';

const router = Router();

// ============================================================
// POST /api/v1/copilot/chat
// Context-aware AI chat using Gemini Pro
// ============================================================
router.post('/chat', requireAuth, validateBody(copilotQuerySchema), async (req, res, next) => {
  const reqStart = Date.now();
  try {
    const userId = req.user.id;
    const { query, documentId } = req.body;

    console.log(`\n============================================================`);
    console.log(`[IMVISION] Request received from user ${userId}`);
    console.log(`[IMVISION] Query: "${query}"`);
    console.log(`[IMVISION] Document Attached: ${documentId || 'None'}`);

    // Build document context if a specific document is selected
    let docContext = 'No specific document selected.';
    if (documentId) {
      const { data: doc } = await supabaseAdmin
        .from('documents')
        .select('file_name, file_type, raw_text_content')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (doc) {
        docContext = `Document: "${doc.file_name}" (${doc.file_type})\n${
          doc.raw_text_content
            ? `Content:\n${doc.raw_text_content.slice(0, 3000)}`
            : 'Binary file — no raw text available.'
        }`;
      }
    }

    // Fetch recent chat history for multi-turn context (last 10 messages)
    const { data: history } = await supabaseAdmin
      .from('copilot_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentHistory = (history || []).reverse();

    // Fetch user's tasks for broader academic context
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('title, subject, deadline, priority, status, estimated_minutes')
      .eq('user_id', userId)
      .neq('status', 'completed')
      .order('deadline', { ascending: true })
      .limit(20);

    // Fetch active study schedule context
    const { data: activeSchedule } = await supabaseAdmin
      .from('study_schedules')
      .select('generated_plan')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch user profile preferences
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, preferred_study_hours_per_day, academic_institution')
      .eq('id', userId)
      .single();

    const todayStr = new Date().toISOString();
    console.log(`[IMVISION] Context loaded: ${tasks?.length || 0} active tasks | Active schedule: ${Boolean(activeSchedule)} | Profile: "${profile?.full_name || 'Student'}"`);

    const systemContext = `
You are IMvision, the intelligent academic assistant inside FLOW (Built by IMV).

Answer the user's question directly and accurately.

Student Profile:
Name: ${profile?.full_name || 'Student'}
Institution: ${profile?.academic_institution || 'Unspecified'}
Daily Study Capacity: ${profile?.preferred_study_hours_per_day || 4} hours/day
Current Date & Time: ${todayStr}

Student's Stored Tasks & Deadlines:
${JSON.stringify(tasks || [], null, 2)}

Student's Active 7-Day Study Plan:
${JSON.stringify(activeSchedule?.generated_plan || 'No active plan generated yet.', null, 2)}

${docContext !== 'No specific document selected.' ? `Selected Document Context:\n${docContext}` : ''}

Key Instructions:
1. If the user asks a general academic question (e.g. "What is AI?", "Explain recursion", "What is Bayes theorem?"), answer directly, concisely, and accurately with clear academic explanations and code/diagrams where helpful. You DO NOT need stored tasks to answer general questions.
2. If the user asks about their schedule or deadlines (e.g. "What should I study today?", "Which assignment is due next?"), reference the student's stored tasks and active study plan.
3. If the user asks about an attached document, reference the Selected Document Context.
4. Format all responses cleanly using Markdown headers, bullet points, and code blocks.
`;

    // Build conversation messages for Groq format
    const groqMessages = [
      { role: 'system', content: systemContext },
      ...recentHistory.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })),
      { role: 'user', content: query }
    ];

    let reply = '';
    let lastError;

    for (let attempt = 0; attempt < 3; attempt++) {
      const targetModel = attempt === 0 ? PRO_MODEL : FALLBACK_MODEL;
      console.log(`[IMVISION] Calling AI provider: Groq | Attempt ${attempt + 1} | Model: ${targetModel}`);
      try {
        const activeAi = getAiInstance();
        const completion = await activeAi.chat.completions.create({
          model: targetModel,
          messages: groqMessages,
          temperature: 0.4
        });
        reply = completion.choices[0]?.message?.content || '';
        lastError = null;
        console.log(`[IMVISION] AI response received: ${reply.length} chars in ${Date.now() - reqStart}ms`);
        break;
      } catch (err) {
        lastError = err;
        console.error(`[IMVISION ERROR] Attempt ${attempt + 1} failed: ${err.message}`);
        rotateAiKey();
      }
    }

    if (lastError && !reply) {
      console.error(`[IMVISION FATAL]: All Groq attempts failed. Last error:`, lastError.message);
      return res.status(503).json({
        error: 'IMvision is temporarily unavailable. Please try again.',
        details: lastError.message
      });
    }

    // Persist both user message and assistant reply
    await supabaseAdmin.from('copilot_messages').insert([
      { user_id: userId, document_id: documentId || null, role: 'user', content: query },
      { user_id: userId, document_id: documentId || null, role: 'assistant', content: reply }
    ]);

    console.log(`[IMVISION] Returning response to frontend (${Date.now() - reqStart}ms total)`);
    console.log(`============================================================\n`);
    res.json({ reply });
  } catch (err) {
    console.error(`[IMVISION UNHANDLED ERROR]:`, err.message);
    next(err);
  }
});

// ============================================================
// GET /api/v1/copilot/history
// Returns last 50 messages for the authenticated user
// ============================================================
router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('copilot_messages')
      .select('*, documents(file_name)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/copilot/history
 * Clears all chat history for the user.
 */
router.delete('/history', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('copilot_messages')
      .delete()
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
