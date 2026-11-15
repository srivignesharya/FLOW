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

    // Attach to Exam in Supabase or memory
    try {
      const { data: exam } = await supabaseAdmin
        .from('study_exams')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (exam) {
        const updatedSyllabus = `${exam.syllabus_text || ''}\n${combinedExtractedText}`.trim();
        await supabaseAdmin
          .from('study_exams')
          .update({ syllabus_text: updatedSyllabus, updated_at: new Date().toISOString() })
          .eq('id', id);
      }
    } catch {}

    // In-memory update
    const userExams = memoryExams.get(userId) || [];
    const found = userExams.find(e => e.id === id);
    if (found) {
      found.syllabus_text = `${found.syllabus_text || ''}\n${combinedExtractedText}`.trim();
      found.uploadedFiles = [...(found.uploadedFiles || []), ...uploadedFileSummaries];
    }

    res.json({
      success: true,
      message: `Successfully processed ${req.files.length} document(s).`,
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

    // Assign IDs
    const topicsWithIds = (generatedData.topics || []).map((t, idx) => ({
      id: `top-${Date.now()}-${idx}`,
      exam_id: id,
      user_id: userId,
      unit_name: t.unit_name || 'Unit 1',
      topic_name: t.topic_name || 'Topic',
      importance_level: t.importance_level || 'medium',
      is_understood: false,
      is_difficult: false
    }));

    const questionsWithIds = (generatedData.questions || []).map((q, idx) => ({
      id: `q-${Date.now()}-${idx}`,
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

    const flashcardsWithIds = (generatedData.flashcards || []).map((f, idx) => ({
      id: `fc-${Date.now()}-${idx}`,
      exam_id: id,
      user_id: userId,
      topic_name: f.topic_name || 'General',
      question: f.question,
      answer: f.answer,
      difficulty: f.difficulty || 'medium'
    }));

    // Try Supabase inserts
    try {
      if (topicsWithIds.length > 0) await supabaseAdmin.from('study_topics').insert(topicsWithIds);
      if (questionsWithIds.length > 0) await supabaseAdmin.from('study_questions').insert(questionsWithIds);
      if (flashcardsWithIds.length > 0) await supabaseAdmin.from('study_flashcards').insert(flashcardsWithIds);
    } catch {}

    // Memory Store Update
    if (foundMem) {
      foundMem.topics = topicsWithIds;
      foundMem.questions = questionsWithIds;
      foundMem.flashcards = flashcardsWithIds;
    }

    res.json({
      success: true,
      topics: topicsWithIds,
      questions: questionsWithIds,
      flashcards: flashcardsWithIds
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

export default router;
