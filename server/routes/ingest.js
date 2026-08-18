import { Router } from 'express';
import multer from 'multer';
import PDFParser from 'pdf2json';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody, textIngestSchema } from '../middleware/validation.js';
import { aiServiceLimiter } from '../middleware/rateLimiter.js';
import { getAiInstance, rotateAiKey, FLASH_MODEL, FALLBACK_MODEL, SYSTEM_INSTRUCTION, taskExtractionSchema } from '../services/gemini.js';
import { supabaseAdmin } from '../services/supabase.js';
import { calculateSmartPriority } from '../services/priorityEngine.js';
import { performVisionOcr } from '../services/ocrService.js';
import { sanitizeTaskBatch } from '../utils/taskValidator.js';

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

// Helper to safely extract task array from arbitrary AI response structure
const extractTasksFromAiResponse = (aiResponseText) => {
  let parsedData = null;
  try {
    parsedData = JSON.parse(aiResponseText);
  } catch (e) {
    const jsonMatch = aiResponseText.match(/\[[\s\S]*\]/) || aiResponseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { parsedData = JSON.parse(jsonMatch[0]); } catch (e2) {}
    }
  }

  let rawList = [];
  if (Array.isArray(parsedData)) {
    rawList = parsedData;
  } else if (parsedData && typeof parsedData === 'object') {
    if (Array.isArray(parsedData.tasks)) rawList = parsedData.tasks;
    else if (Array.isArray(parsedData.commitments)) rawList = parsedData.commitments;
    else if (Array.isArray(parsedData.assignments)) rawList = parsedData.assignments;
    else if (Array.isArray(parsedData.data)) rawList = parsedData.data;
    else {
      const foundArray = Object.values(parsedData).find(v => Array.isArray(v));
      if (foundArray) rawList = foundArray;
    }
  }
  return rawList;
};

// ============================================================
// POST /api/v1/ingest/file
// Upload a PDF or image → Vision OCR Preprocessing → Groq → Smart Priority Engine
// ============================================================
router.post('/file', requireAuth, aiServiceLimiter, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document or image file uploaded' });
    }

    const userId = req.user.id;
    const dateStr = new Date().toISOString();

    console.log(`[PDF] File received: ${req.file.originalname}`);
    console.log(`[PDF] File size: ${req.file.size} bytes`);
    console.log(`[PDF] MIME type: ${req.file.mimetype}`);
    console.log(`[PDF] Text extraction started`);

    let extractedText = '';
    
    if (req.file.mimetype === 'application/pdf') {
      try {
        extractedText = await new Promise((resolve, reject) => {
          const pdfParser = new PDFParser(null, 1);
          pdfParser.on("pdfParser_dataError", errData => {
            console.error(`[PDF] Parser Error:`, errData.parserError);
            reject(errData.parserError);
          });
          pdfParser.on("pdfParser_dataReady", () => {
            resolve(pdfParser.getRawTextContent());
          });
          pdfParser.parseBuffer(req.file.buffer);
        });
      } catch (err) {
        console.error(`[PDF] PDF parsing failed: ${err}`);
      }
    } else if (req.file.mimetype.includes('image') || req.file.originalname.toLowerCase().includes('scanned')) {
      extractedText = await performVisionOcr(req.file.buffer, req.file.mimetype);
    }

    // Clean up excessive newlines and page break marks from pdf2json
    extractedText = extractedText.replace(/----------------Page \(\d+\) Break----------------/g, '\n\n').trim();

    console.log(`[PDF] Extracted text length: ${extractedText.length} characters`);

    if (extractedText.trim().length === 0) {
      return res.status(200).json({ document: null, tasks: [], message: 'Could not extract readable text from this PDF.' });
    }

    console.log(`[EXTRACTION] Sending ${extractedText.length} characters to AI`);

    const prompt = `Today's date is ${dateStr}. Analyze this academic document thoroughly and extract ALL tasks, assignments, exams, announcements, and deadlines.
Return a JSON array of tasks with fields: title, subject, deadline (ISO 8601), priority (critical/high/medium/low), estimatedMinutes (number), description, taskType (assignment/exam/reading/announcement).\nDocument Text:\n${extractedText}`;

    let aiResponseText = '';
    let lastError;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const activeAi = getAiInstance();
        const targetModel = attempt === 0 ? FLASH_MODEL : FALLBACK_MODEL;
        const completion = await activeAi.chat.completions.create({
          model: targetModel,
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1
        });
        aiResponseText = completion.choices[0]?.message?.content || '{}';
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ [INGEST FILE ATTEMPT ${attempt + 1} FAILED]: ${err.message}. Rotating key...`);
        rotateAiKey();
      }
    }

    if (lastError && !aiResponseText) {
      throw lastError;
    }

    console.log(`[EXTRACTION] AI response received`);
    const rawTaskList = extractTasksFromAiResponse(aiResponseText);
    console.log(`[EXTRACTION] Parsed commitments: ${rawTaskList.length}`);
    const validTasks = sanitizeTaskBatch(rawTaskList, 'Academic Document');

    console.log(`[EXTRACTION] File "${req.file.originalname}": ${rawTaskList.length} raw parsed, ${validTasks.length} valid`);

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

    if (validTasks.length === 0) {
      return res.status(200).json({ document: doc, tasks: [], message: 'No academic commitments detected in this file.' });
    }

    // Map and process tasks through Smart Priority Engine
    const tasksToInsert = validTasks.map(t => {
      const smartPriority = calculateSmartPriority({
        deadline: t.deadline,
        weightage: t.weightage || 0,
        estimatedMinutes: t.estimatedMinutes || 60,
        taskType: t.taskType || 'assignment',
        remainingTasksCount: validTasks.length
      });

      console.log(`[EXTRACTION] Inserting task: "${t.title}" (${t.subject}) - Priority: ${smartPriority.priority}`);

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
        task_type: t.taskType || 'assignment',
        notification_sent: false
      };
    });

    const { data: insertedTasks, error: taskErr } = await supabaseAdmin
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (taskErr) throw taskErr;

    res.json({ document: doc, tasks: insertedTasks });
  } catch (err) {
    console.error(`[INGEST FILE ERROR]:`, err.message);
    next(err);
  }
});

// ============================================================
// POST /api/v1/ingest/text
// Paste text → Groq extracts tasks → saves to DB
// ============================================================
router.post('/text', requireAuth, aiServiceLimiter, validateBody(textIngestSchema), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { textContent } = req.body;
    const dateStr = new Date().toISOString();

    const prompt = `Today's date is ${dateStr}. Extract all academic tasks, assignments, exams, and deadlines from the following announcement/syllabus text:\n\n${textContent}\n\nReturn a JSON array of task objects with fields: title, subject, deadline (ISO 8601), priority (critical/high/medium/low), estimatedMinutes (number), description, taskType (assignment/exam/reading/announcement).`;

    let aiResponseText = '';
    let lastError;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const activeAi = getAiInstance();
        const targetModel = attempt === 0 ? FLASH_MODEL : FALLBACK_MODEL;
        const completion = await activeAi.chat.completions.create({
          model: targetModel,
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1
        });
        aiResponseText = completion.choices[0]?.message?.content || '{}';
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ [INGEST TEXT ATTEMPT ${attempt + 1} FAILED]: ${err.message}. Rotating key...`);
        rotateAiKey();
      }
    }

    if (lastError && !aiResponseText) {
      console.error(`[INGEST TEXT FATAL ERROR]: AI request failed:`, lastError.message);
      return res.status(503).json({ error: 'Unable to analyse this content. Please try again.' });
    }

    const rawTaskList = extractTasksFromAiResponse(aiResponseText);
    const validTasks = sanitizeTaskBatch(rawTaskList, 'Text Syllabus');

    console.log(`[EXTRACTION] Text excerpt: ${rawTaskList.length} raw parsed, ${validTasks.length} valid`);

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

    if (validTasks.length === 0) {
      return res.status(200).json({ document: doc, tasks: [], message: 'No academic commitments detected in the provided text.' });
    }

    const tasksToInsert = validTasks.map(t => {
      console.log(`[EXTRACTION] Inserting task: "${t.title}" (${t.subject})`);
      return {
        user_id: userId,
        document_id: doc.id,
        title: t.title,
        subject: t.subject || 'General',
        deadline: t.deadline,
        weightage: t.weightage || 0,
        priority: t.priority,
        estimated_minutes: t.estimatedMinutes || 60,
        description: t.description || '',
        task_type: t.taskType || 'assignment',
        notification_sent: false
      };
    });

    const { data: insertedTasks, error: taskErr } = await supabaseAdmin
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (taskErr) throw taskErr;

    res.json({ document: doc, tasks: insertedTasks });
  } catch (err) {
    console.error(`[INGEST TEXT UNHANDLED ERROR]:`, err.message);
    next(err);
  }
});

export default router;
