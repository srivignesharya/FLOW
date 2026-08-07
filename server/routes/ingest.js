import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody, textIngestSchema } from '../middleware/validation.js';
import { aiServiceLimiter } from '../middleware/rateLimiter.js';
import { getAiInstance, rotateAiKey, FLASH_MODEL, FALLBACK_MODEL, SYSTEM_INSTRUCTION, taskExtractionSchema } from '../services/gemini.js';
import { supabaseAdmin } from '../services/supabase.js';
import { calculateSmartPriority } from '../services/priorityEngine.js';
import { performVisionOcr } from '../services/ocrService.js';

// Multer: store files in memory (no disk writes), max 100 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: PDF, PNG, JPEG, WebP`));
    }
  }
});

const router = Router();

// ============================================================
// POST /api/v1/ingest/file
// Upload a PDF or image → Vision OCR Preprocessing → Gemini → Smart Priority Engine
// ============================================================
router.post('/file', requireAuth, aiServiceLimiter, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document or image file uploaded' });
    }

    const userId = req.user.id;
    const dateStr = new Date().toISOString();
    const base64Data = req.file.buffer.toString('base64');

    // Phase 1: Pre-process scanned PDFs/images with Vision OCR if image or scanned
    let ocrText = '';
    if (req.file.mimetype.includes('image') || req.file.originalname.toLowerCase().includes('scanned')) {
      ocrText = await performVisionOcr(req.file.buffer, req.file.mimetype);
    }

    const prompt = `Today's date is ${dateStr}. Analyze this academic document ${ocrText ? '(OCR Preprocessed Text included below)' : ''} thoroughly and extract ALL tasks, assignments, exams, announcements, and deadlines. Include estimated study/completion time for each.\n${ocrText ? `OCR Text:\n${ocrText}` : ''}`;

    let aiResponse;
    let lastError;
    const keysCount = (process.env.GEMINI_API_KEY_2 ? 2 : 1) + (process.env.GEMINI_API_KEY_3 ? 1 : 0);

    for (let attempt = 0; attempt < keysCount + 1; attempt++) {
      try {
        const activeAi = getAiInstance();
        const targetModel = attempt === 0 ? FLASH_MODEL : FALLBACK_MODEL;
        aiResponse = await activeAi.models.generateContent({
          model: targetModel,
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType: req.file.mimetype, data: base64Data } },
                { text: prompt }
              ]
            }
          ],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: taskExtractionSchema,
            temperature: 0.1
          }
        });
        lastError = null;
        break; // Success!
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ [INGEST FILE ATTEMPT ${attempt + 1} FAILED]: ${err.message}. Rotating key...`);
        rotateAiKey();
      }
    }

    if (lastError && !aiResponse) {
      throw lastError;
    }

    const parsedData = JSON.parse(aiResponse.text);

    if (!parsedData.tasks || parsedData.tasks.length === 0) {
      return res.status(200).json({ document: null, tasks: [], message: 'No academic tasks detected in this document.' });
    }

    // Save document record
    const { data: doc, error: docErr } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: userId,
        file_name: req.file.originalname,
        file_type: req.file.mimetype.includes('pdf') ? 'pdf' : 'image',
        file_path: `${userId}/${Date.now()}_${req.file.originalname}`
      })
      .select()
      .single();

    if (docErr) throw docErr;

    // Phase 2 & 7: Map and process tasks through Smart Priority & Explainable AI Engine
    const tasksToInsert = parsedData.tasks.map(t => {
      const smartPriority = calculateSmartPriority({
        deadline: t.deadline,
        weightage: t.weightage || 0,
        estimatedMinutes: t.estimatedMinutes || 60,
        taskType: t.taskType || 'assignment',
        remainingTasksCount: parsedData.tasks.length
      });

      return {
        user_id: userId,
        document_id: doc.id,
        title: t.title,
        subject: t.subject || 'General',
        deadline: t.deadline,
        weightage: t.weightage || 0,
        priority: smartPriority.priority,
        estimated_minutes: t.estimatedMinutes || 60,
        description: `${t.description || ''}\n\n💡 AI Priority Analysis: ${smartPriority.reasoning}`.trim(),
        task_type: t.taskType || 'assignment'
      };
    });

    const { data: insertedTasks, error: taskErr } = await supabaseAdmin
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (taskErr) throw taskErr;

    res.json({ document: doc, tasks: insertedTasks });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/v1/ingest/text
// Paste text → Gemini extracts tasks → saves to DB
// ============================================================
router.post('/text', requireAuth, aiServiceLimiter, validateBody(textIngestSchema), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { textContent } = req.body;
    const dateStr = new Date().toISOString();

    const prompt = `Today's date is ${dateStr}. Extract all academic tasks, deadlines, and commitments from the following text:\n\n${textContent}`;

    let aiResponse;
    let lastError;
    const keysCount = (process.env.GEMINI_API_KEY_2 ? 2 : 1) + (process.env.GEMINI_API_KEY_3 ? 1 : 0);

    for (let attempt = 0; attempt < keysCount + 1; attempt++) {
      try {
        const activeAi = getAiInstance();
        const targetModel = attempt === 0 ? FLASH_MODEL : FALLBACK_MODEL;
        aiResponse = await activeAi.models.generateContent({
          model: targetModel,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: taskExtractionSchema,
            temperature: 0.1
          }
        });
        lastError = null;
        break; // Success!
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ [INGEST TEXT ATTEMPT ${attempt + 1} FAILED]: ${err.message}. Rotating key...`);
        rotateAiKey();
      }
    }

    if (lastError && !aiResponse) {
      throw lastError;
    }

    const parsedData = JSON.parse(aiResponse.text);

    if (!parsedData.tasks || parsedData.tasks.length === 0) {
      return res.status(200).json({ document: null, tasks: [], message: 'No academic tasks detected in the provided text.' });
    }

    // Save document record for text ingestion
    const { data: doc, error: docErr } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: userId,
        file_name: `Text Ingest — ${new Date().toLocaleString()}`,
        file_type: 'text',
        raw_text_content: textContent
      })
      .select()
      .single();

    if (docErr) throw docErr;

    const tasksToInsert = parsedData.tasks.map(t => ({
      user_id: userId,
      document_id: doc.id,
      title: t.title,
      subject: t.subject || 'General',
      deadline: t.deadline,
      weightage: t.weightage || 0,
      priority: t.priority,
      estimated_minutes: t.estimatedMinutes || 60,
      description: t.description || '',
      task_type: t.taskType || 'assignment'
    }));

    const { data: insertedTasks, error: taskErr } = await supabaseAdmin
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (taskErr) throw taskErr;

    res.json({ document: doc, tasks: insertedTasks });
  } catch (err) {
    next(err);
  }
});

export default router;
