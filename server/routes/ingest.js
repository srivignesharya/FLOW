import { Router } from 'express';
import multer from 'multer';
import PDFParser from 'pdf2json';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody, textIngestSchema } from '../middleware/validation.js';
import { aiServiceLimiter } from '../middleware/rateLimiter.js';
import {
  callAiCompletion,
  hasGemini,
  SYSTEM_INSTRUCTION
} from '../services/gemini.js';
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

// Chunk text into slices of maxChars with overlap to stay under strict Groq TPM limits
const chunkDocumentText = (text, maxChars = 10000, overlap = 800) => {
  if (text.length <= maxChars) return [text];
  const chunks = [];
  let startIndex = 0;
  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + maxChars, text.length);
    chunks.push(text.slice(startIndex, endIndex));
    if (endIndex >= text.length) break;
    startIndex += (maxChars - overlap);
  }
  return chunks;
};

// Unified task extractor supporting high-capacity Gemini or safe Groq chunking
const extractTasksFromContent = async (text, dateStr, isFile = true) => {
  // 1. If Gemini is available, Gemini 2.5 Flash has a 1,000,000-token context window
  // and handles entire multi-page documents in a single shot with full semantic context
  if (hasGemini()) {
    try {
      console.log(`[INGEST] Processing ${text.length} characters using Gemini 2.5 Flash (1M token context window)`);
      const prompt = `Today's date is ${dateStr}. Analyze this academic document thoroughly and extract ALL tasks, assignments, exams, announcements, and deadlines.
If the document contains lecture notes, formula sheets, or practice question sets without explicit submission dates, extract key study units, practice problem sets, or revision topics as actionable study commitments (taskType: "reading" or "assignment").
Return a JSON object in this exact format:
{
  "tasks": [
    {
      "title": "Task or study topic title",
      "subject": "Subject name",
      "deadline": "ISO 8601 string or date within next 7 days",
      "priority": "high" | "medium" | "low",
      "estimatedMinutes": 60,
      "description": "Details of task or revision topics",
      "taskType": "assignment" | "exam" | "reading" | "announcement"
    }
  ]
}

Document Text:
${text}`;

      const aiResponseText = await callAiCompletion({
        prompt,
        systemPrompt: SYSTEM_INSTRUCTION,
        preferGemini: true,
        jsonMode: true,
        temperature: 0.1
      });

      const rawTaskList = extractTasksFromAiResponse(aiResponseText);
      const valid = sanitizeTaskBatch(rawTaskList, isFile ? 'Academic Document' : 'Text Syllabus');
      if (valid && valid.length > 0) {
        return valid;
      }
    } catch (geminiErr) {
      console.warn(`⚠️ [INGEST GEMINI FAILED]: ${geminiErr.message}. Gracefully falling back to chunked Groq extraction...`);
    }
  }

  // 2. If only Groq is available (free-tier 8,000 TPM limit):
  // Partition into safe chunks under 10,000 characters (~2,500 tokens)
  const chunks = chunkDocumentText(text, 10000, 800);
  console.log(`[INGEST] Processing ${text.length} characters across ${chunks.length} chunks via Groq`);

  const allRawTasks = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[INGEST] Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
    const prompt = `Today's date is ${dateStr}. Analyze part ${i + 1} of ${chunks.length} of this academic document and extract any tasks, assignments, exams, announcements, or deadlines found in this section.
If this excerpt contains practice questions, study units, or revision topics without explicit dates, extract them as actionable study commitments (taskType: "reading" or "assignment").
Return a JSON object in this exact format:
{
  "tasks": [
    {
      "title": "Task or study topic title",
      "subject": "Subject name",
      "deadline": "ISO 8601 string or date within next 7 days",
      "priority": "high" | "medium" | "low",
      "estimatedMinutes": 60,
      "description": "Details of task or revision topics",
      "taskType": "assignment" | "exam" | "reading" | "announcement"
    }
  ]
}

Document Excerpt:
${chunk}`;

    try {
      const chunkResponse = await callAiCompletion({
        prompt,
        systemPrompt: SYSTEM_INSTRUCTION,
        jsonMode: true,
        temperature: 0.1
      });
      const parsedChunkTasks = extractTasksFromAiResponse(chunkResponse);
      if (Array.isArray(parsedChunkTasks)) {
        allRawTasks.push(...parsedChunkTasks);
      }
    } catch (chunkErr) {
      console.warn(`⚠️ [INGEST CHUNK ${i + 1} ERROR]:`, chunkErr.message);
    }
  }

  // Deduplicate tasks from multiple chunks by title and deadline
  const seenKeys = new Set();
  const dedupedRawTasks = [];
  for (const t of allRawTasks) {
    const key = `${(t.title || '').trim().toLowerCase()}_${t.deadline || ''}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      dedupedRawTasks.push(t);
    }
  }

  return sanitizeTaskBatch(dedupedRawTasks, isFile ? 'Academic Document' : 'Text Syllabus');
};

// ============================================================
// POST /api/v1/ingest/file
// Upload a PDF or image → OCR/Parser → Resilient AI → Smart Priority Engine
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

    // Clean up excessive newlines, tab spaces, and page break marks
    extractedText = (extractedText || '')
      .replace(/----------------Page \(\d+\) Break----------------/g, '\n\n')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    console.log(`[PDF] Extracted text length: ${extractedText.length} characters`);

    if (extractedText.length === 0) {
      return res.status(200).json({ document: null, tasks: [], message: 'Could not extract readable text from this file.' });
    }

    // Extract tasks with resilient AI (Gemini 2.5 Flash 1M context or chunked Groq)
    const validTasks = await extractTasksFromContent(extractedText, dateStr, true);

    console.log(`[EXTRACTION] File "${req.file.originalname}": ${validTasks.length} valid tasks extracted`);

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

      // Ensure priority strictly adheres to DB constraint ('high', 'medium', 'low')
      let dbPriority = (smartPriority.priority || 'medium').toLowerCase();
      if (dbPriority === 'critical') dbPriority = 'high';
      if (!['high', 'medium', 'low'].includes(dbPriority)) dbPriority = 'medium';

      return {
        user_id: userId,
        document_id: doc.id,
        title: t.title,
        subject: t.subject || 'General',
        deadline: t.deadline,
        weightage: t.weightage || 0,
        priority: dbPriority,
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
// Paste text → Resilient AI extracts tasks → saves to DB
// ============================================================
router.post('/text', requireAuth, aiServiceLimiter, validateBody(textIngestSchema), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { textContent } = req.body;
    const dateStr = new Date().toISOString();

    const cleanedText = (textContent || '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Extract tasks with resilient AI
    const validTasks = await extractTasksFromContent(cleanedText, dateStr, false);

    console.log(`[EXTRACTION] Text excerpt: ${validTasks.length} valid tasks extracted`);

    // Save document record for text ingestion
    const { data: doc, error: docErr } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: userId,
        file_name: `Text Ingest — ${new Date().toLocaleString()}`,
        file_type: 'text',
        raw_text_content: cleanedText
      })
      .select()
      .single();

    if (docErr) throw docErr;

    if (validTasks.length === 0) {
      return res.status(200).json({ document: doc, tasks: [], message: 'No academic commitments detected in the provided text.' });
    }

    const tasksToInsert = validTasks.map(t => {
      console.log(`[EXTRACTION] Inserting task: "${t.title}" (${t.subject})`);

      let dbPriority = (t.priority || 'medium').toLowerCase();
      if (dbPriority === 'critical') dbPriority = 'high';
      if (!['high', 'medium', 'low'].includes(dbPriority)) dbPriority = 'medium';

      return {
        user_id: userId,
        document_id: doc.id,
        title: t.title,
        subject: t.subject || 'General',
        deadline: t.deadline,
        weightage: t.weightage || 0,
        priority: dbPriority,
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
