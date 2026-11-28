import { Router } from 'express';
import multer from 'multer';
import PDFParser from 'pdf2json';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import PDFDocument from 'pdfkit';
import { requireAuth } from '../middleware/authMiddleware.js';
import { supabaseAdmin } from '../services/supabase.js';
import { callAiCompletion, hasGemini } from '../services/gemini.js';
import { performVisionOcr } from '../services/ocrService.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: PDF, PNG, JPEG, WebP`));
    }
  }
});

const router = Router();

// Robust In-Memory Fallback Store if Supabase study_exams table is not yet created in user DB
const memoryExams = new Map(); // userId -> array of exams

// Helper: Extract Text from PDF buffer using pdf2json or pdf-parse
const extractTextFromPdf = (buffer) => {
  return new Promise((resolve) => {
    try {
      const pdfParser = new PDFParser(null, 1);
      pdfParser.on('pdfParser_dataError', async () => {
        try {
          const fallback = await pdfParse(buffer);
          resolve(fallback.text || '');
        } catch {
          resolve('');
        }
      });
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        try {
          const rawText = pdfParser.getRawTextContent();
          if (rawText && rawText.trim().length > 30) {
            resolve(rawText);
          } else {
            pdfParse(buffer).then(res => resolve(res.text || '')).catch(() => resolve(''));
          }
        } catch {
          resolve('');
        }
      });
      pdfParser.parseBuffer(buffer);
    } catch {
      pdfParse(buffer).then(res => resolve(res.text || '')).catch(() => resolve(''));
    }
  });
};

// ============================================================
// 1. GET /api/v1/study/exams — List all exams for student
// ============================================================
router.get('/exams', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    // 1. Try Supabase
    const { data: dbExams, error } = await supabaseAdmin
      .from('study_exams')
      .select('*, study_topics(count), study_questions(count), study_flashcards(count)')
      .eq('user_id', userId)
      .order('exam_date', { ascending: true });

    if (!error && dbExams) {
      return res.json(dbExams);
    }

    // 2. Return In-Memory fallback for this user
    const userExams = memoryExams.get(userId) || [];
    res.json(userExams);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 2. POST /api/v1/study/exams — Create new exam
// ============================================================
router.post('/exams', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subject, exam_name, exam_date, syllabus_text, target_score } = req.body;

    if (!subject || !exam_name || !exam_date) {
      return res.status(400).json({ error: 'Subject, exam name, and target date are required.' });
    }

    const newExamObj = {
      id: `exam-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      subject: subject.trim(),
      exam_name: exam_name.trim(),
      exam_date: new Date(exam_date).toISOString(),
      syllabus_text: syllabus_text || '',
      target_score: Number(target_score) || 85,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      topics: [],
      questions: [],
      flashcards: []
    };

    // Try Supabase insert
    try {
      const { data, error } = await supabaseAdmin
        .from('study_exams')
        .insert({
          user_id: userId,
          subject: newExamObj.subject,
          exam_name: newExamObj.exam_name,
          exam_date: newExamObj.exam_date,
          syllabus_text: newExamObj.syllabus_text,
          target_score: newExamObj.target_score
        })
        .select()
        .single();

      if (!error && data) {
        return res.status(201).json(data);
      }
    } catch (dbErr) {
      console.warn('[FLOW STUDY] Supabase insert fallback to in-memory store:', dbErr.message);
    }

    // Store in-memory
    const existing = memoryExams.get(userId) || [];
    existing.unshift(newExamObj);
    memoryExams.set(userId, existing);

    res.status(201).json(newExamObj);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 3. GET /api/v1/study/exams/:id — Single exam workspace
// ============================================================
router.get('/exams/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // 1. Try Supabase
    try {
      const { data: exam, error } = await supabaseAdmin
        .from('study_exams')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (!error && exam) {
        const [topicsRes, questionsRes, flashcardsRes] = await Promise.all([
          supabaseAdmin.from('study_topics').select('*').eq('exam_id', id).order('created_at', { ascending: true }),
          supabaseAdmin.from('study_questions').select('*').eq('exam_id', id).order('priority', { ascending: true }),
          supabaseAdmin.from('study_flashcards').select('*').eq('exam_id', id).order('created_at', { ascending: true })
        ]);

        return res.json({
          exam,
          topics: topicsRes.data || [],
          questions: questionsRes.data || [],
          flashcards: flashcardsRes.data || []
        });
      }
    } catch {}

    // 2. Memory Fallback
    const userExams = memoryExams.get(userId) || [];
    const found = userExams.find(e => e.id === id);
    if (!found) {
      return res.status(404).json({ error: 'Exam workspace not found.' });
    }

    res.json({
      exam: found,
      topics: found.topics || [],
      questions: found.questions || [],
      flashcards: found.flashcards || []
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 4. POST /api/v1/study/exams/:id/upload-docs — Upload PDF / Image
// ============================================================
router.post('/exams/:id/upload-docs', requireAuth, upload.array('files', 5), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { docType = 'syllabus' } = req.body; // 'syllabus' or 'previous_papers'

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Please select at least one PDF or image file.' });
    }

    let combinedExtractedText = '';
    const uploadedFileSummaries = [];

    for (const file of req.files) {
      console.log(`[FLOW STUDY UPLOAD] Parsing ${file.originalname} (${file.mimetype}, ${(file.size / 1024).toFixed(1)} KB)`);
      let text = '';
      if (file.mimetype === 'application/pdf') {
        text = await extractTextFromPdf(file.buffer);
      } else if (file.mimetype.startsWith('image/')) {
        text = await performVisionOcr(file.buffer, file.mimetype);
      }

      if (text && text.trim().length > 0) {
        combinedExtractedText += `\n\n--- Document: ${file.originalname} (${docType.toUpperCase()}) ---\n${text.slice(0, 25000)}`;
      }

      uploadedFileSummaries.push({
        filename: file.originalname,
        size: file.size,
        charsExtracted: text ? text.length : 0
      });
    }

    if (combinedExtractedText.trim().length === 0) {
      return res.status(422).json({
        success: false,
        error: 'Could not extract readable text from the uploaded file(s). If this is a scanned PDF, please upload it as PNG/JPG images or ensure the PDF has selectable text.',
        files: uploadedFileSummaries,
        totalCharsExtracted: 0
      });
    }

    // Attach to Exam in Supabase or memory
    let dbUpdated = false;
    try {
      const { data: exam, error: fetchErr } = await supabaseAdmin
        .from('study_exams')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (!fetchErr && exam) {
        const updatedSyllabus = `${exam.syllabus_text || ''}\n${combinedExtractedText}`.trim();
        const { error: updateErr } = await supabaseAdmin
          .from('study_exams')
          .update({ syllabus_text: updatedSyllabus, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (updateErr) {
          console.error('[FLOW STUDY UPLOAD] Supabase update error:', updateErr.message);
        } else {
          dbUpdated = true;
        }
      }
    } catch (dbErr) {
      console.warn('[FLOW STUDY UPLOAD] Supabase fallback:', dbErr.message);
    }

    // In-memory update
    const userExams = memoryExams.get(userId) || [];
    const found = userExams.find(e => e.id === id);
    if (found) {
      found.syllabus_text = `${found.syllabus_text || ''}\n${combinedExtractedText}`.trim();
      found.uploadedFiles = [...(found.uploadedFiles || []), ...uploadedFileSummaries];
    }

    res.json({
      success: true,
      dbUpdated,
      message: `Extracted ${combinedExtractedText.length.toLocaleString()} characters from ${req.files.length} document(s).`,
      files: uploadedFileSummaries,
      totalCharsExtracted: combinedExtractedText.length
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 5. POST /api/v1/study/exams/:id/generate-materials — LEMON AI Ingest
// ============================================================
router.post('/exams/:id/generate-materials', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { syllabusText, previousQuestionsText } = req.body;

    let subject = 'Subject';
    let examName = 'Exam';
    let existingSyllabus = '';

    // Check DB
    try {
      const { data: exam } = await supabaseAdmin
        .from('study_exams')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (exam) {
        subject = exam.subject;
        examName = exam.exam_name;
        existingSyllabus = exam.syllabus_text || '';
      }
    } catch {}

    // Check Memory
    const userExams = memoryExams.get(userId) || [];
    const foundMem = userExams.find(e => e.id === id);
    if (foundMem) {
      subject = foundMem.subject;
      examName = foundMem.exam_name;
      existingSyllabus = foundMem.syllabus_text || existingSyllabus;
    }

    const combined = `
Subject: ${subject} (${examName})
Syllabus / Academic Material:
${syllabusText || existingSyllabus || 'Core topics in ' + subject}

Previous Examination Questions (Optional):
${previousQuestionsText || 'Formulate syllabus-recommended high-yield exam questions.'}
`;

    const prompt = `
You are LEMON, the academic intelligence engine inside FLOW (Powered by IMV).
Analyze the provided course syllabus and previous examination materials.
Formulate clear Units/Topics, AI-Prioritized Questions, and Flashcards for active learning.

REQUIREMENTS:
1. Divide syllabus into clear Units and Topics. Mark importance_level ('high', 'medium', 'low').
2. Formulate 6-8 prioritized exam questions:
   - Priority: 'high', 'medium', or 'low'.
   - Include realistic priority_reason (e.g. "Core theorem frequently asked in finals").
   - Include expected_marks (e.g. 5, 8, 10) and suggested_time_minutes.
   - Include a thorough answer_key with step-by-step points.
3. Formulate 6-10 Flashcards (concise question and memorable answer).

Return ONLY valid JSON matching this exact structure:
{
  "topics": [
    { "unit_name": "Unit 1: Fundamentals", "topic_name": "Core Principles", "importance_level": "high" }
  ],
  "questions": [
    {
      "unit_name": "Unit 1",
      "topic_name": "Core Principles",
      "question": "Explain the fundamental theorem...",
      "answer_key": "Step 1: Definition...\nStep 2: Proof & Derivation...\nStep 3: Edge Cases...",
      "priority": "high",
      "priority_reason": "High exam probability based on syllabus weighting",
      "expected_marks": 8,
      "suggested_time_minutes": 15
    }
  ],
  "flashcards": [
    {
      "topic_name": "Core Principles",
      "question": "What is...",
      "answer": "Concise key definition...",
      "difficulty": "medium"
    }
  ]
}
`;

    const aiRes = await callAiCompletion({
      systemInstruction: 'You are LEMON, an academic syllabus analysis engine. Always output valid JSON.',
      prompt: `${prompt}\n\nCONTENT TO ANALYZE:\n${combined}`,
      preferGemini: true,
      jsonMode: true
    });

    let generatedData = null;
    try {
      generatedData = JSON.parse(aiRes);
    } catch {
      const match = aiRes.match(/\{[\s\S]*\}/);
      if (match) generatedData = JSON.parse(match[0]);
    }

    if (!generatedData) {
      return res.status(502).json({ error: 'AI generation did not complete cleanly. Please retry.' });
    }

    // Prepare rows (omit id for Supabase so DB generates valid UUIDs)
    const topicsPayload = (generatedData.topics || []).map((t) => ({
      exam_id: id,
      user_id: userId,
      unit_name: t.unit_name || 'Unit 1',
      topic_name: t.topic_name || 'Topic',
      importance_level: t.importance_level || 'medium',
      is_understood: false,
      is_difficult: false
    }));

    const questionsPayload = (generatedData.questions || []).map((q) => ({
      exam_id: id,
      user_id: userId,
      unit_name: q.unit_name || 'Unit 1',
      topic_name: q.topic_name || 'Topic',
      question: q.question,
      answer_key: q.answer_key,
      priority: q.priority || 'medium',
      priority_reason: q.priority_reason || 'AI high-yield recommendation',
      expected_marks: Number(q.expected_marks) || 5,
      suggested_time_minutes: Number(q.suggested_time_minutes) || 10,
      is_attempted: false,
      attempt_verdict: null
    }));

    const flashcardsPayload = (generatedData.flashcards || []).map((f) => ({
      exam_id: id,
      user_id: userId,
      topic_name: f.topic_name || 'General',
      question: f.question,
      answer: f.answer,
      difficulty: f.difficulty || 'medium'
    }));

    let persistedTopics = [];
    let persistedQuestions = [];
    let persistedFlashcards = [];

    // Try Supabase inserts with proper error checking
    try {
      if (topicsPayload.length > 0) {
        const { data: tData, error: tErr } = await supabaseAdmin.from('study_topics').insert(topicsPayload).select();
        if (tErr) console.error('[FLOW STUDY] study_topics insert error:', tErr.message);
        else if (tData) persistedTopics = tData;
      }
      if (questionsPayload.length > 0) {
        const { data: qData, error: qErr } = await supabaseAdmin.from('study_questions').insert(questionsPayload).select();
        if (qErr) console.error('[FLOW STUDY] study_questions insert error:', qErr.message);
        else if (qData) persistedQuestions = qData;
      }
      if (flashcardsPayload.length > 0) {
        const { data: fData, error: fErr } = await supabaseAdmin.from('study_flashcards').insert(flashcardsPayload).select();
        if (fErr) console.error('[FLOW STUDY] study_flashcards insert error:', fErr.message);
        else if (fData) persistedFlashcards = fData;
      }
    } catch (dbErr) {
      console.error('[FLOW STUDY] Supabase generate-materials exception:', dbErr.message);
    }

    // Fallback to in-memory with generated IDs if Supabase didn't persist
    if (persistedTopics.length === 0 && topicsPayload.length > 0) {
      persistedTopics = topicsPayload.map((t, idx) => ({ id: `top-${Date.now()}-${idx}`, ...t }));
    }
    if (persistedQuestions.length === 0 && questionsPayload.length > 0) {
      persistedQuestions = questionsPayload.map((q, idx) => ({ id: `q-${Date.now()}-${idx}`, ...q }));
    }
    if (persistedFlashcards.length === 0 && flashcardsPayload.length > 0) {
      persistedFlashcards = flashcardsPayload.map((f, idx) => ({ id: `fc-${Date.now()}-${idx}`, ...f }));
    }

    // Memory Store Update
    if (foundMem) {
      foundMem.topics = [...(foundMem.topics || []), ...persistedTopics];
      foundMem.questions = [...(foundMem.questions || []), ...persistedQuestions];
      foundMem.flashcards = [...(foundMem.flashcards || []), ...persistedFlashcards];
    }

    res.json({
      success: true,
      topics: persistedTopics,
      questions: persistedQuestions,
      flashcards: persistedFlashcards
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 6. PATCH /api/v1/study/questions/:id/attempt
// ============================================================
router.patch('/questions/:id/attempt', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { verdict } = req.body;

    try {
      const { data, error } = await supabaseAdmin
        .from('study_questions')
        .update({ is_attempted: true, attempt_verdict: verdict })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (!error && data) return res.json(data);
    } catch {}

    // Memory update
    const userExams = memoryExams.get(userId) || [];
    for (const ex of userExams) {
      const q = (ex.questions || []).find(item => item.id === id);
      if (q) {
        q.is_attempted = true;
        q.attempt_verdict = verdict;
        return res.json(q);
      }
    }

    res.json({ success: true, id, attempt_verdict: verdict });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 7. PATCH /api/v1/study/topics/:id/toggle
// ============================================================
router.patch('/topics/:id/toggle', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { is_understood } = req.body;

    try {
      const { data, error } = await supabaseAdmin
        .from('study_topics')
        .update({ is_understood, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (!error && data) return res.json(data);
    } catch {}

    // Memory update
    const userExams = memoryExams.get(userId) || [];
    for (const ex of userExams) {
      const t = (ex.topics || []).find(item => item.id === id);
      if (t) {
        t.is_understood = Boolean(is_understood);
        return res.json(t);
      }
    }

    res.json({ success: true, id, is_understood });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 8. POST /api/v1/study/exams/:id/generate-test
// ============================================================
router.post('/exams/:id/generate-test', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { questionCount = 5, durationMinutes = 20 } = req.body;

    let questions = [];

    try {
      const { data } = await supabaseAdmin
        .from('study_questions')
        .select('*')
        .eq('exam_id', id)
        .eq('user_id', userId);
      if (data && data.length > 0) questions = data;
    } catch {}

    if (questions.length === 0) {
      const userExams = memoryExams.get(userId) || [];
      const ex = userExams.find(e => e.id === id);
      if (ex && ex.questions) questions = ex.questions;
    }

    if (questions.length === 0) {
      return res.status(400).json({ error: 'No question bank available. Ingest syllabus first!' });
    }

    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Number(questionCount));

    res.json({
      testId: `test-${Date.now()}`,
      durationMinutes: Number(durationMinutes),
      totalMarks: selected.reduce((sum, q) => sum + (q.expected_marks || 5), 0),
      questions: selected
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 9. POST /api/v1/study/exams/:id/grade-test
// ============================================================
router.post('/exams/:id/grade-test', requireAuth, async (req, res, next) => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers array required' });
    }

    const prompt = `
You are LEMON, an examination grader inside FLOW.
Grade the student's exam answers fairly and concisely.

STUDENT ANSWERS:
${JSON.stringify(answers, null, 2)}

Return strict JSON:
{
  "totalAwarded": 17,
  "maxMarks": 25,
  "overallVerdict": "Clear conceptual understanding. Derivations could use tighter notation.",
  "weakTopics": ["Topic A", "Topic B"]
}
`;

    const aiRes = await callAiCompletion({
      systemInstruction: 'You are LEMON, an academic evaluator. Output strict JSON.',
      prompt,
      preferGemini: true,
      jsonMode: true
    });

    let graded = null;
    try {
      graded = JSON.parse(aiRes);
    } catch {
      const m = aiRes.match(/\{[\s\S]*\}/);
      if (m) graded = JSON.parse(m[0]);
    }

    res.json({ success: true, report: graded });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 10. GET /api/v1/study/exams/:id/formula-pdf
// ============================================================
router.get('/exams/:id/formula-pdf', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    let exam = null;
    let topics = [];

    try {
      const { data } = await supabaseAdmin.from('study_exams').select('*').eq('id', id).eq('user_id', userId).single();
      if (data) {
        exam = data;
        const { data: top } = await supabaseAdmin.from('study_topics').select('*').eq('exam_id', id);
        if (top) topics = top;
      }
    } catch {}

    if (!exam) {
      const userExams = memoryExams.get(userId) || [];
      const found = userExams.find(e => e.id === id);
      if (found) {
        exam = found;
        topics = found.topics || [];
      }
    }

    if (!exam) return res.status(404).send('Exam not found');

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${exam.subject.replace(/\s+/g, '_')}_Formula_Sheet.pdf"`);
    doc.pipe(res);

    doc.fontSize(22).fillColor('#2563FF').text('FLOW STUDY — FORMULA & REVISION SHEET', { align: 'center' });
    doc.fontSize(10).fillColor('#64748B').text('POWERED BY IMV • LEMON ACADEMIC INTELLIGENCE', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(14).fillColor('#0F172A').text(`Subject: ${exam.subject} — ${exam.exam_name}`);
    doc.fontSize(10).fillColor('#475569').text(`Target Date: ${new Date(exam.exam_date).toLocaleDateString()}`);
    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(570, doc.y).strokeColor('#CBD5E1').stroke();
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#1E293B').text('Core Concepts & Formulas', { underline: true });
    doc.moveDown(0.8);

    if (topics.length > 0) {
      topics.forEach((t, i) => {
        doc.fontSize(11).fillColor('#2563FF').text(`${i + 1}. [${t.unit_name}] ${t.topic_name}`);
        doc.fontSize(9).fillColor('#475569').text(`   Importance: ${(t.importance_level || 'medium').toUpperCase()} | Status: ${t.is_understood ? '✓ Understood' : 'Needs Review'}`);
        doc.moveDown(0.5);
      });
    } else {
      doc.fontSize(10).fillColor('#64748B').text('No syllabus units generated yet. Upload documents in FLOW Study.');
    }

    doc.end();
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 11. POST /api/v1/study/extract-timetable — AI Timetable Extraction
// ============================================================
router.post('/extract-timetable', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF or image of your exam timetable.' });
    }

    let rawText = '';
    if (req.file.mimetype === 'application/pdf') {
      rawText = await extractTextFromPdf(req.file.buffer);
    } else if (req.file.mimetype.startsWith('image/')) {
      rawText = await performVisionOcr(req.file.buffer, req.file.mimetype);
    }

    if (!rawText || rawText.trim().length < 15) {
      return res.status(422).json({
        error: 'Could not extract readable text from the timetable. Try a clearer image or selectable-text PDF.'
      });
    }

    const prompt = `
You are LEMON, an academic timetable parser inside FLOW.
Extract all examination schedule entries from the provided timetable text.
Do NOT confuse this with a syllabus or question paper—extract ONLY exam schedule rows.

For each exam found, extract:
- subject: Subject name (e.g. "Data Structures & Algorithms")
- subject_code: Subject code if present (e.g. "CS301"), else ""
- exam_name: Examination title or type (e.g. "End Semester Exam", "Midterm", "CIA 2")
- exam_date: Date in YYYY-MM-DD format (if year is missing, infer ${new Date().getFullYear()})
- exam_time: Time slot if present (e.g. "09:30 AM - 12:30 PM"), else ""
- semester: Semester if present (e.g. "Semester 5"), else ""
- exam_type: Type if present (e.g. "Theory", "Practical", "Internal"), else ""

Return ONLY valid JSON:
{
  "exams": [
    {
      "subject": "Subject Name",
      "subject_code": "CS301",
      "exam_name": "End Semester Exam",
      "exam_date": "2026-12-10",
      "exam_time": "09:30 AM - 12:30 PM",
      "semester": "Sem 5",
      "exam_type": "Theory"
    }
  ]
}

TIMETABLE TEXT:
${rawText.slice(0, 20000)}
`;

    const aiRes = await callAiCompletion({
      systemInstruction: 'You are LEMON, an academic timetable extraction engine. Output valid JSON only.',
      prompt,
      preferGemini: true,
      jsonMode: true
    });

    let parsed = null;
    try {
      parsed = JSON.parse(aiRes);
    } catch {
      const m = aiRes.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    const extractedExams = Array.isArray(parsed?.exams) ? parsed.exams : [];
    if (extractedExams.length === 0) {
      return res.status(422).json({
        error: 'No examination schedule entries could be identified in this document.'
      });
    }

    res.json({
      success: true,
      exams: extractedExams
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 12. POST /api/v1/study/exams/:id/ask-lemon — Contextual Study AI
// ============================================================
router.post('/exams/:id/ask-lemon', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { question, topicName } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Please enter a question for LEMON.' });
    }

    let exam = null;
    let topics = [];
    try {
      const { data } = await supabaseAdmin.from('study_exams').select('*').eq('id', id).eq('user_id', userId).single();
      if (data) {
        exam = data;
        const { data: tData } = await supabaseAdmin.from('study_topics').select('unit_name, topic_name, is_understood').eq('exam_id', id);
        if (tData) topics = tData;
      }
    } catch {}

    if (!exam) {
      const userExams = memoryExams.get(userId) || [];
      const found = userExams.find(e => e.id === id);
      if (found) {
        exam = found;
        topics = found.topics || [];
      }
    }

    if (!exam) {
      return res.status(404).json({ error: 'Exam workspace not found.' });
    }

    const hasUploadedSource = Boolean(exam.syllabus_text && exam.syllabus_text.trim().length > 30);
    const contextBlock = `
EXAM: ${exam.subject} — ${exam.exam_name} (Date: ${new Date(exam.exam_date).toLocaleDateString()})
${topicName ? `FOCUSED TOPIC: ${topicName}` : ''}
EXTRACTED TOPICS: ${topics.map(t => `${t.unit_name}: ${t.topic_name} (${t.is_understood ? 'Understood' : 'Pending'})`).join('; ') || 'None yet'}
UPLOADED MATERIAL EXCERPT:
${hasUploadedSource ? exam.syllabus_text.slice(0, 12000) : 'No uploaded syllabus or notes yet.'}
`;

    const answer = await callAiCompletion({
      systemInstruction: `You are LEMON, the contextual academic AI inside FLOW Study 2.0 (Powered by IMV).
Answer clearly, concisely, and accurately using structured markdown.
If you are referencing the student's uploaded material, state "Based on your uploaded material:".
If you are generating a general academic explanation because the uploaded material does not cover it, state "General academic explanation:".
Never fabricate source references.`,
      prompt: `${contextBlock}\n\nSTUDENT QUESTION:\n${question.trim()}`,
      preferGemini: true,
      jsonMode: false
    });

    res.json({
      success: true,
      answer,
      usedUploadedSource: hasUploadedSource
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 13. DELETE /api/v1/study/exams/:id — Delete Exam Workspace
// ============================================================
router.delete('/exams/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    try {
      await supabaseAdmin.from('study_topics').delete().eq('exam_id', id).eq('user_id', userId);
      await supabaseAdmin.from('study_questions').delete().eq('exam_id', id).eq('user_id', userId);
      await supabaseAdmin.from('study_flashcards').delete().eq('exam_id', id).eq('user_id', userId);
      await supabaseAdmin.from('study_exams').delete().eq('id', id).eq('user_id', userId);
    } catch {}

    const userExams = memoryExams.get(userId) || [];
    memoryExams.set(userId, userExams.filter(e => e.id !== id));

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// 14. POST /api/v1/study/exams/:id/regenerate — Independent Regeneration
// ============================================================
router.post('/exams/:id/regenerate', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { target } = req.body; // 'questions' | 'flashcards' | 'formulas'

    if (!['questions', 'flashcards', 'formulas'].includes(target)) {
      return res.status(400).json({ error: 'Invalid target. Must be questions, flashcards, or formulas.' });
    }

    let exam = null;
    try {
      const { data } = await supabaseAdmin.from('study_exams').select('*').eq('id', id).eq('user_id', userId).single();
      if (data) exam = data;
    } catch {}

    const userExams = memoryExams.get(userId) || [];
    const foundMem = userExams.find(e => e.id === id);
    if (!exam && foundMem) exam = foundMem;

    if (!exam) {
      return res.status(404).json({ error: 'Exam workspace not found.' });
    }

    const materialContext = `Subject: ${exam.subject} (${exam.exam_name})\nSyllabus / Uploaded Material:\n${exam.syllabus_text || 'Core topics in ' + exam.subject}`;

    if (target === 'formulas') {
      const formulaPrompt = `
You are LEMON, an academic formula extraction engine.
Inspect the subject and syllabus below. Determine if this subject genuinely contains mathematical formulas, equations, or complexity expressions.
If the subject is non-mathematical (e.g. humanities, communication, ethics, management) or no formulas exist, return:
{ "available": false, "reason": "no_formulas_applicable", "formulas": [] }
If formulas DO exist, extract/organize them accurately without inventing fake formulas:
{ "available": true, "formulas": [ { "unit": "Unit 1", "name": "Formula Name", "expression": "a^2 + b^2 = c^2", "variables": "a, b, c: triangle sides" } ] }
`;
      const aiRes = await callAiCompletion({
        systemInstruction: 'You are LEMON. Output strict JSON only. Never invent formulas for non-mathematical subjects.',
        prompt: `${formulaPrompt}\n\n${materialContext}`,
        preferGemini: true,
        jsonMode: true
      });
      let parsed = null;
      try { parsed = JSON.parse(aiRes); } catch {
        const m = aiRes.match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]);
      }
      if (!parsed || parsed.available === false || !Array.isArray(parsed.formulas) || parsed.formulas.length === 0) {
        return res.json({
          success: true,
          target: 'formulas',
          available: false,
          message: 'Formula sheet unavailable — no relevant formulas were identified for this module.'
        });
      }
      return res.json({
        success: true,
        target: 'formulas',
        available: true,
        formulas: parsed.formulas
      });
    }

    if (target === 'questions') {
      const qPrompt = `
Generate 6-8 prioritized exam questions for ${exam.subject} based on the syllabus below.
Return strict JSON:
{ "questions": [ { "unit_name": "Unit 1", "topic_name": "Topic", "question": "...", "answer_key": "...", "priority": "high", "priority_reason": "...", "expected_marks": 8, "suggested_time_minutes": 15 } ] }
`;
      const aiRes = await callAiCompletion({
        systemInstruction: 'You are LEMON. Output strict JSON only.',
        prompt: `${qPrompt}\n\n${materialContext}`,
        preferGemini: true,
        jsonMode: true
      });
      let parsed = null;
      try { parsed = JSON.parse(aiRes); } catch {
        const m = aiRes.match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]);
      }
      const payload = (parsed?.questions || []).map(q => ({
        exam_id: id,
        user_id: userId,
        unit_name: q.unit_name || 'Unit 1',
        topic_name: q.topic_name || 'Topic',
        question: q.question,
        answer_key: q.answer_key,
        priority: q.priority || 'medium',
        priority_reason: q.priority_reason || 'AI syllabus-based recommendation',
        expected_marks: Number(q.expected_marks) || 5,
        suggested_time_minutes: Number(q.suggested_time_minutes) || 10,
        is_attempted: false,
        attempt_verdict: null
      }));
      let persisted = [];
      try {
        if (payload.length > 0) {
          const { data, error } = await supabaseAdmin.from('study_questions').insert(payload).select();
          if (!error && data) persisted = data;
        }
      } catch {}
      if (persisted.length === 0) persisted = payload.map((q, idx) => ({ id: `q-${Date.now()}-${idx}`, ...q }));
      if (foundMem) foundMem.questions = [...(foundMem.questions || []), ...persisted];
      return res.json({ success: true, target: 'questions', questions: persisted });
    }

    if (target === 'flashcards') {
      const fPrompt = `
Generate 6-10 concise, non-duplicate flashcards for ${exam.subject} based on the syllabus below.
Return strict JSON:
{ "flashcards": [ { "topic_name": "Topic", "question": "...", "answer": "...", "difficulty": "medium" } ] }
`;
      const aiRes = await callAiCompletion({
        systemInstruction: 'You are LEMON. Output strict JSON only.',
        prompt: `${fPrompt}\n\n${materialContext}`,
        preferGemini: true,
        jsonMode: true
      });
      let parsed = null;
      try { parsed = JSON.parse(aiRes); } catch {
        const m = aiRes.match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]);
      }
      const payload = (parsed?.flashcards || []).map(f => ({
        exam_id: id,
        user_id: userId,
        topic_name: f.topic_name || 'General',
        question: f.question,
        answer: f.answer,
        difficulty: f.difficulty || 'medium'
      }));
      let persisted = [];
      try {
        if (payload.length > 0) {
          const { data, error } = await supabaseAdmin.from('study_flashcards').insert(payload).select();
          if (!error && data) persisted = data;
        }
      } catch {}
      if (persisted.length === 0) persisted = payload.map((f, idx) => ({ id: `fc-${Date.now()}-${idx}`, ...f }));
      if (foundMem) foundMem.flashcards = [...(foundMem.flashcards || []), ...persisted];
      return res.json({ success: true, target: 'flashcards', flashcards: persisted });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
