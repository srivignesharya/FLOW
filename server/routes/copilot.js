import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody, copilotQuerySchema } from '../middleware/validation.js';
import { ai, PRO_MODEL, FALLBACK_MODEL, getAiInstance, rotateAiKey, hasGemini, getGeminiClient, GEMINI_FLASH_MODEL } from '../services/gemini.js';
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

    // Cleanly format tasks into human-readable compact bullets rather than raw JSON dump
    const simplifiedTasks = (tasks && tasks.length > 0)
      ? tasks.slice(0, 12).map(t =>
          `• "${t.title}" [${t.subject || 'General'}] — Due: ${t.deadline ? new Date(t.deadline).toLocaleDateString() : 'N/A'} (Priority: ${t.priority}, Est: ${t.estimated_minutes || 60}m)`
        ).join('\n')
      : 'No active tasks registered.';

    const isDocumentAttached = documentId && docContext !== 'No specific document selected.';

    const systemContext = `
You are LEMON, an intelligent academic and personal assistant inside FLOW (Powered by IMV).

STRICT INSTRUCTION REGARDING CONTEXT & RELEVANCE:
1. RELEVANCE TO QUERY: Answer the user's specific question directly, concisely, and naturally.
   - If the user asks a general question (e.g. "What is photosynthesis?", "Write a python script for quicksort", "Explain quantum tunneling", "Hello"), answer that specific question accurately and directly.
   - Do NOT shoehorn or force upcoming tasks, deadlines, or study recommendations unless the user explicitly asks about their tasks, schedule, priorities, deadlines, or what they should do today.
2. ACCURACY & HONESTY: If you do not know the answer or if the question is ambiguous, honestly admit it rather than hallucinating facts.
3. CONVERSATIONAL MEMORY: Maintain natural context with the recent conversation history. Do not repeat previous answers or regurgitate unchanged generic templates.
4. TONE & STRUCTURE:
   - Clear, polite, intellectually sharp, and structured.
   - Use Markdown formatting with bold titles or code blocks where appropriate.
   - Keep answers focused and avoid unnecessary conversational filler (e.g., "Certainly! Here is...").

${isDocumentAttached ? `ATTACHED DOCUMENT CONTENT (Ground your answer on this document when relevant):\n${docContext}\n` : ''}
${tasks && tasks.length > 0 ? `BACKGROUND STUDENT TASKS (ONLY reference if user query is about their schedule, tasks, or priorities):\n${simplifiedTasks}\n` : ''}
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
          temperature: 0.3,
          max_tokens: 750
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
      if (hasGemini()) {
        console.log(`🔄 [IMVISION]: Groq attempts failed. Failing over to Gemini 2.5 Flash...`);
        try {
          const gemini = getGeminiClient();
          const geminiPrompt = groqMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
          const completion = await gemini.models.generateContent({
            model: GEMINI_FLASH_MODEL,
            contents: geminiPrompt,
            config: { temperature: 0.4 }
          });
          reply = completion.text || '';
          lastError = null;
        } catch (geminiErr) {
          console.error(`[IMVISION GEMINI FAILOVER ERROR]:`, geminiErr.message);
        }
      }
    }

    if (lastError && !reply) {
      console.error(`[IMVISION FATAL]: All AI attempts failed. Last error:`, lastError.message);
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
