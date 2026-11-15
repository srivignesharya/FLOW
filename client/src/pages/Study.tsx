import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Pause,
  Award,
  Zap,
  HelpCircle,
  FileText,
  Download,
  Plus,
  ChevronRight,
  Target,
  RefreshCw,
  Brain,
  AlertCircle,
  UploadCloud,
  FileCheck,
  Trash2,
  Paperclip
} from 'lucide-react';
import api from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Study: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examDetail, setExamDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // New Exam Modal
  const [isNewExamOpen, setIsNewExamOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newExamName, setNewExamName] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newSyllabusText, setNewSyllabusText] = useState('');
  const [savingExam, setSavingExam] = useState(false);

  // Document Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadDocType, setUploadDocType] = useState<'syllabus' | 'previous_papers'>('syllabus');
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Mode: 'hub' | 'learn' | 'priority' | 'test' | 'pomodoro'
  const [activeMode, setActiveMode] = useState<'hub' | 'learn' | 'priority' | 'test' | 'pomodoro'>('hub');

  // Priority Mode State (Attempt before reveal)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [questionTimers, setQuestionTimers] = useState<Record<string, number>>({});

  // Flashcards Study State
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Test Mode State
  const [activeTest, setActiveTest] = useState<any>(null);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [testTimeRemaining, setTestTimeRemaining] = useState<number>(0);
  const [testReport, setTestReport] = useState<any>(null);
  const [submittingTest, setSubmittingTest] = useState(false);

  // Focus Timer / Pomodoro (FLOW 3-2-1)
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPhase, setTimerPhase] = useState<'focus' | 'break3' | 'break2' | 'break1'>('focus');

  // Mini-game State for 3-Minute Break
  const [puzzleTarget, setPuzzleTarget] = useState(24);
  const [puzzleNumbers, setPuzzleNumbers] = useState([3, 8, 2, 1]);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  // Fetch Exams on load
  const loadExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/study/exams');
      setExams(res.data || []);
      if (res.data?.length > 0 && !selectedExamId) {
        setSelectedExamId(res.data[0].id);
      }
    } catch (err) {
      console.error('[FLOW STUDY] Failed to load exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  // Fetch single exam workspace
  const loadExamDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`/study/exams/${id}`);
      setExamDetail(res.data);
    } catch (err) {
      console.error('[FLOW STUDY] Failed to load exam detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      loadExamDetail(selectedExamId);
    }
  }, [selectedExamId]);

  // Pomodoro Interval
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setPomodoroSeconds((prev) => {
          if (prev <= 1) {
            // Trigger phase transition
            if (timerPhase === 'focus') {
              setTimerPhase('break3'); // 3-min mini game
              return 3 * 60;
            } else if (timerPhase === 'break3') {
              setTimerPhase('break2'); // 2-min formula/flashcard revision
              return 2 * 60;
            } else if (timerPhase === 'break2') {
              setTimerPhase('break1'); // 1-min mindful rest
              return 1 * 60;
            } else {
              setTimerPhase('focus');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerPhase]);

  // Create new exam
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newExamName || !newExamDate) return;
    try {
      setSavingExam(true);
      const res = await api.post('/study/exams', {
        subject: newSubject,
        exam_name: newExamName,
        exam_date: newExamDate,
        syllabus_text: newSyllabusText
      });
      setIsNewExamOpen(false);
      setNewSubject('');
      setNewExamName('');
      setNewExamDate('');
      setNewSyllabusText('');
      await loadExams();
      if (res.data?.id) setSelectedExamId(res.data.id);
    } catch (err) {
      console.error('[FLOW STUDY] Error creating exam:', err);
    } finally {
      setSavingExam(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload Files to Exam Context
  const handleUploadDocs = async () => {
    if (!selectedExamId || selectedFiles.length === 0) return;
    try {
      setUploadingDocs(true);
      setUploadFeedback(null);
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('files', file));
      formData.append('docType', uploadDocType);

      const res = await api.post(`/study/exams/${selectedExamId}/upload-docs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadFeedback(`✓ ${res.data.message || 'Files uploaded and processed!'}`);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadExamDetail(selectedExamId);
    } catch (err: any) {
      console.error('[FLOW STUDY] Document upload failed:', err);
      setUploadFeedback(err.response?.data?.error || 'Failed to upload documents. Please check file type & size.');
    } finally {
      setUploadingDocs(false);
    }
  };

  // Generate Materials via LEMON AI
  const handleGenerateMaterials = async () => {
    if (!selectedExamId) return;
    try {
      setGenerating(true);
      await api.post(`/study/exams/${selectedExamId}/generate-materials`, {
        syllabusText: examDetail?.exam?.syllabus_text || ''
      });
      await loadExamDetail(selectedExamId);
    } catch (err) {
      console.error('[FLOW STUDY] Error generating materials:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Question Feedback
  const handleAnswerVerdict = async (questionId: string, verdict: 'understood' | 'practice_needed' | 'not_understood') => {
    try {
      await api.patch(`/study/questions/${questionId}/attempt`, { verdict });
      setExamDetail((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q: any) => (q.id === questionId ? { ...q, is_attempted: true, attempt_verdict: verdict } : q))
        };
      });
      if (activeQuestionIndex < (examDetail?.questions?.length || 1) - 1) {
        setActiveQuestionIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Topic understood toggle
  const handleToggleTopic = async (topicId: string, currentVal: boolean) => {
    try {
      await api.patch(`/study/topics/${topicId}/toggle`, { is_understood: !currentVal });
      setExamDetail((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          topics: prev.topics.map((t: any) => (t.id === topicId ? { ...t, is_understood: !currentVal } : t))
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Start Test
  const handleStartTest = async () => {
    if (!selectedExamId) return;
    try {
      const res = await api.post(`/study/exams/${selectedExamId}/generate-test`, {
        questionCount: 5,
        durationMinutes: 15
      });
      setActiveTest(res.data);
      setTestTimeRemaining(res.data.durationMinutes * 60);
      setTestAnswers({});
      setTestReport(null);
      setActiveMode('test');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to start test. Please generate study materials first!');
    }
  };

  // Submit Test
  const handleSubmitTest = async () => {
    if (!activeTest || !selectedExamId) return;
    try {
      setSubmittingTest(true);
      const payload = activeTest.questions.map((q: any) => ({
        questionId: q.id,
        question: q.question,
        expectedMarks: q.expected_marks || 5,
        studentAnswer: testAnswers[q.id] || 'Not answered'
      }));
      const res = await api.post(`/study/exams/${selectedExamId}/grade-test`, { answers: payload });
      setTestReport(res.data?.report);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingTest(false);
    }
  };

  const currentExam = examDetail?.exam;
  const questions = examDetail?.questions || [];
  const topics = examDetail?.topics || [];
  const flashcards = examDetail?.flashcards || [];

  // Readiness Calculations
  const understoodCount = topics.filter((t: any) => t.is_understood).length;
  const topicCoveragePct = topics.length > 0 ? Math.round((understoodCount / topics.length) * 100) : 0;
  const attemptedQuestions = questions.filter((q: any) => q.is_attempted).length;
  const questionsPct = questions.length > 0 ? Math.round((attemptedQuestions / questions.length) * 100) : 0;
  const overallReadiness = Math.round((topicCoveragePct * 0.6) + (questionsPct * 0.4));

  if (loading) {
    return <LoadingSpinner fullPage text="Initializing FLOW STUDY Workspace..." />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* 1. Header Banner */}
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-[#0B1020] via-slate-900 to-[#111827] text-white rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2563FF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563FF]/15 border border-[#2563FF]/30 text-[#00D4FF] text-xs font-bold">
              <GraduationCap className="h-4 w-4" />
              <span>FLOW STUDY V1.1 • Powered by IMV</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Exam Preparation & Mastery Environment
            </h1>
            <p className="text-[#94A3B8] text-xs sm:text-sm max-w-xl">
              Understand what to study, practice AI-prioritized high-yield questions, learn step-by-step, test yourself, and boost your exam readiness with LEMON.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNewExamOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563FF] to-[#00D4FF] text-white text-xs font-bold shadow-lg shadow-[#2563FF]/25 hover:opacity-95 transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Exam Schedule</span>
            </button>

            {selectedExamId && (
              <a
                href={`/api/v1/study/exams/${selectedExamId}/formula-pdf`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#00D4FF] border border-[#2563FF]/30 text-xs font-bold transition-all flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Formula Sheet PDF</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 2. Exam Picker Ribbon */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {exams.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 text-xs text-[#94A3B8]">
            No exams scheduled yet. Click <strong>Add Exam Schedule</strong> above to start preparation!
          </div>
        ) : (
          exams.map((ex) => {
            const isSelected = ex.id === selectedExamId;
            const daysLeft = Math.ceil((new Date(ex.exam_date).getTime() - Date.now()) / (1000 * 3600 * 24));
            return (
              <button
                key={ex.id}
                onClick={() => { setSelectedExamId(ex.id); setActiveMode('hub'); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left shrink-0 transition-all ${
                  isSelected
                    ? 'bg-[#2563FF]/15 border-[#00D4FF] text-white shadow-md shadow-[#2563FF]/20'
                    : 'bg-[#111827] border-slate-800 text-[#94A3B8] hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#2563FF] text-white' : 'bg-slate-800 text-[#00D4FF]'}`}>
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{ex.subject}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-[#00D4FF]">
                      {daysLeft > 0 ? `${daysLeft}d left` : 'Today'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#94A3B8] truncate max-w-[140px]">{ex.exam_name}</div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 3. Mode Navigation Bar */}
      {selectedExamId && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-2 rounded-2xl bg-[#111827] border border-slate-800">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'hub', label: 'Study Hub', icon: Target },
              { id: 'learn', label: 'Mode A: Learn', icon: BookOpen },
              { id: 'priority', label: 'Mode B: Priority Qs', icon: Zap },
              { id: 'test', label: 'Mode C: Test Knowledge', icon: Award },
              { id: 'pomodoro', label: 'FLOW Focus 3-2-1', icon: Clock }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMode(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2563FF] to-[#00D4FF] text-white shadow-md'
                      : 'text-[#94A3B8] hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 px-3">
            <span className="text-xs font-semibold text-[#94A3B8]">Exam Readiness:</span>
            <span className="text-xs font-black text-[#00D4FF]">{overallReadiness}%</span>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-[#2563FF] to-[#00D4FF] transition-all duration-500"
                style={{ width: `${overallReadiness}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Active Mode Workspaces */}
      {detailLoading ? (
        <LoadingSpinner text="Loading Study Materials..." />
      ) : !currentExam ? (
        <div className="card p-12 text-center text-[#94A3B8] space-y-4">
          <GraduationCap className="h-12 w-12 mx-auto text-slate-700" />
          <h3 className="text-base font-bold text-white">No Exam Selected</h3>
          <p className="text-xs max-w-sm mx-auto">Create or choose an examination above to unlock study modes, question prioritization and test simulations.</p>
        </div>
      ) : activeMode === 'hub' ? (
        /* ================= STUDY HUB OVERVIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Exam Details Card */}
            <div className="card p-6 bg-[#111827] border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">{currentExam.subject} — {currentExam.exam_name}</h3>
                  <p className="text-xs text-[#94A3B8]">Scheduled: {new Date(currentExam.exam_date).toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
                </div>
                <button
                  onClick={handleGenerateMaterials}
                  disabled={generating}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#2563FF]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#2563FF]/40 text-xs font-bold hover:scale-105 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{generating ? 'LEMON Extracting...' : 'AI Syllabus Ingest'}</span>
                </button>
              </div>

              {/* Progress Gauges */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-[#0B1020] border border-slate-800 text-center">
                  <div className="text-2xl font-black text-white">{topicCoveragePct}%</div>
                  <div className="text-[11px] font-semibold text-[#94A3B8] mt-1">Syllabus Covered</div>
                  <div className="text-[10px] text-slate-500">{understoodCount}/{topics.length} Topics</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B1020] border border-slate-800 text-center">
                  <div className="text-2xl font-black text-[#00D4FF]">{questionsPct}%</div>
                  <div className="text-[11px] font-semibold text-[#94A3B8] mt-1">Priority Qs Solved</div>
                  <div className="text-[10px] text-slate-500">{attemptedQuestions}/{questions.length} Attempted</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B1020] border border-slate-800 text-center">
                  <div className="text-2xl font-black text-purple-400">{flashcards.length}</div>
                  <div className="text-[11px] font-semibold text-[#94A3B8] mt-1">Active Flashcards</div>
                  <div className="text-[10px] text-slate-500">Quick Recall</div>
                </div>
              </div>

              {/* Syllabus Context Box */}
              <div className="p-4 rounded-2xl bg-[#0B1020] border border-slate-800">
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">Registered Syllabus:</span>
                <p className="text-xs text-slate-300 line-clamp-3">
                  {currentExam.syllabus_text || 'No explicit syllabus provided. Upload documents below or click "AI Syllabus Ingest".'}
                </p>
              </div>

              {/* Document Upload Studio (PDF & Image Ingestion) */}
              <div className="p-5 rounded-2xl bg-[#0B1020] border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <UploadCloud className="h-4 w-4 text-[#00D4FF]" />
                      <span>Upload Syllabus & Question Papers (PDF / Image)</span>
                    </h4>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      Upload PDF syllabi, lecture slides, or scanned question paper images for LEMON extraction.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadDocType('syllabus')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        uploadDocType === 'syllabus'
                          ? 'bg-[#2563FF] text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Syllabus
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadDocType('previous_papers')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        uploadDocType === 'previous_papers'
                          ? 'bg-[#00D4FF] text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Previous Papers
                    </button>
                  </div>
                </div>

                {/* Dropzone Trigger */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-xl border border-dashed border-slate-700 hover:border-[#00D4FF] bg-[#111827]/60 hover:bg-[#111827] text-center cursor-pointer transition-all space-y-2"
                >
                  <Paperclip className="h-6 w-6 text-slate-500 mx-auto" />
                  <p className="text-xs font-semibold text-white">
                    Click to select PDF or image files (PNG, JPG, WebP)
                  </p>
                  <p className="text-[10px] text-slate-500">Supports multi-page documents up to 50 MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Selected Files Preview List */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Selected Files ({selectedFiles.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <FileText className="h-3.5 w-3.5 text-[#00D4FF] shrink-0" />
                            <span className="truncate text-slate-200">{f.name}</span>
                            <span className="text-[10px] text-slate-500 shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(i)}
                            className="p-1 hover:text-rose-400 text-slate-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleUploadDocs}
                        disabled={uploadingDocs}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563FF] to-[#00D4FF] text-white text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-2"
                      >
                        <UploadCloud className="h-4 w-4" />
                        <span>{uploadingDocs ? 'Extracting Text & Ingesting...' : 'Upload & Attach to Exam'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Status / Feedback */}
                {uploadFeedback && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${
                    uploadFeedback.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {uploadFeedback}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Flashcards Deck Preview */}
            <div className="card p-6 bg-[#111827] border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#00D4FF]" />
                  <span>Flashcard Knowledge Reinforcement</span>
                </h3>
                <span className="text-xs text-[#94A3B8]">Card {activeCardIndex + 1} of {flashcards.length || 1}</span>
              </div>

              {flashcards.length === 0 ? (
                <p className="text-xs text-[#94A3B8] text-center py-6">No flashcards generated yet. Click "AI Syllabus Ingest" above!</p>
              ) : (
                <div
                  onClick={() => setCardFlipped(!cardFlipped)}
                  className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0B1020] border border-[#2563FF]/30 min-h-[160px] flex flex-col justify-between cursor-pointer hover:border-[#00D4FF] transition-all text-center select-none"
                >
                  <span className="text-[10px] uppercase font-bold text-[#00D4FF] tracking-wider">
                    {cardFlipped ? 'Answer' : 'Question (Click to Flip)'}
                  </span>
                  <p className="text-sm sm:text-base font-bold text-white my-auto px-4">
                    {cardFlipped ? flashcards[activeCardIndex]?.answer : flashcards[activeCardIndex]?.question}
                  </p>
                  <span className="text-[10px] text-slate-500">
                    Topic: {flashcards[activeCardIndex]?.topic_name || 'General'}
                  </span>
                </div>
              )}

              {flashcards.length > 1 && (
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => { setCardFlipped(false); setActiveCardIndex(p => Math.max(0, p - 1)); }}
                    disabled={activeCardIndex === 0}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-white disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => { setCardFlipped(false); setActiveCardIndex(p => Math.min(flashcards.length - 1, p + 1)); }}
                    disabled={activeCardIndex === flashcards.length - 1}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-white disabled:opacity-30"
                  >
                    Next Card
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Rail: Action Launchers */}
          <div className="space-y-6">
            <div className="card p-6 bg-[#111827] border border-slate-800 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Study Modes</h3>
              
              <button
                onClick={() => setActiveMode('priority')}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#2563FF]/15 to-[#00D4FF]/15 border border-[#2563FF]/30 hover:border-[#00D4FF] transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#00D4FF] flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-[#00D4FF]" /> Mode B: Priority Qs
                  </h4>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">Attempt top exam questions with timer & reveal.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#94A3B8] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setActiveMode('learn')}
                className="w-full p-4 rounded-2xl bg-[#0B1020] border border-slate-800 hover:border-slate-700 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-emerald-400" /> Mode A: Learn Concepts
                  </h4>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">Unit-wise coverage and difficult topic tracking.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#94A3B8] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleStartTest}
                className="w-full p-4 rounded-2xl bg-[#0B1020] border border-slate-800 hover:border-slate-700 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-amber-400" /> Mode C: Simulate Test
                  </h4>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">Timed 5-question mock test evaluated by LEMON AI.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#94A3B8] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setActiveMode('pomodoro')}
                className="w-full p-4 rounded-2xl bg-[#0B1020] border border-slate-800 hover:border-slate-700 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-indigo-400" /> FLOW Focus 3-2-1
                  </h4>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">Pomodoro with Mini-game, Revision & Rest cycles.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#94A3B8] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      ) : activeMode === 'priority' ? (
        /* ================= MODE B: PRIORITY QUESTIONS ================= */
        <div className="card p-6 sm:p-8 bg-[#111827] border border-slate-800 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold uppercase">
                  {questions[activeQuestionIndex]?.priority || 'High'} Priority
                </span>
                <span className="text-xs text-[#94A3B8]">
                  Question {activeQuestionIndex + 1} of {questions.length}
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-1">
                {questions[activeQuestionIndex]?.unit_name || 'Core Unit'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#00D4FF]">
                {questions[activeQuestionIndex]?.expected_marks || 5} Marks
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">
                ~{questions[activeQuestionIndex]?.suggested_time_minutes || 10} Mins
              </span>
            </div>
          </div>

          {questions.length === 0 ? (
            <p className="text-xs text-[#94A3B8] text-center py-12">No questions generated yet. Click "Study Hub" and run "AI Syllabus Ingest".</p>
          ) : (
            <div className="space-y-6">
              {/* Question Statement */}
              <div className="p-6 rounded-2xl bg-[#0B1020] border border-slate-800 space-y-3">
                <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {questions[activeQuestionIndex]?.question}
                </p>
                {questions[activeQuestionIndex]?.priority_reason && (
                  <p className="text-xs text-[#00D4FF] italic">
                    Reason: {questions[activeQuestionIndex].priority_reason}
                  </p>
                )}
              </div>

              {/* Reveal Answer Section (Required Attempt Flow) */}
              {revealedQuestions[questions[activeQuestionIndex]?.id] ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-4"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Answer Key & Step-by-Step Breakdown</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-mono bg-[#0B1020] p-4 rounded-xl border border-slate-800">
                    {questions[activeQuestionIndex]?.answer_key}
                  </div>

                  {/* Feedback Verdicts */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <span className="text-xs font-semibold text-[#94A3B8]">How did you do?</span>
                    <button
                      onClick={() => handleAnswerVerdict(questions[activeQuestionIndex].id, 'understood')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold transition-all"
                    >
                      ✓ Understood
                    </button>
                    <button
                      onClick={() => handleAnswerVerdict(questions[activeQuestionIndex].id, 'practice_needed')}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold transition-all"
                    >
                      Need More Practice
                    </button>
                    <button
                      onClick={() => handleAnswerVerdict(questions[activeQuestionIndex].id, 'not_understood')}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-bold transition-all"
                    >
                      Didn't Understand
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#0B1020] border border-dashed border-slate-800 text-center space-y-4">
                  <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                    Take 5-10 minutes to write down or solve this question independently before checking the official answer key.
                  </p>
                  <button
                    onClick={() => setRevealedQuestions(prev => ({ ...prev, [questions[activeQuestionIndex].id]: true }))}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2563FF] to-[#00D4FF] text-white font-bold text-xs shadow-lg hover:opacity-95 transition-all"
                  >
                    Reveal Answer & Steps
                  </button>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setActiveQuestionIndex(p => Math.max(0, p - 1))}
                  disabled={activeQuestionIndex === 0}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white disabled:opacity-30"
                >
                  Previous Question
                </button>
                <button
                  onClick={() => setActiveQuestionIndex(p => Math.min(questions.length - 1, p + 1))}
                  disabled={activeQuestionIndex === questions.length - 1}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white disabled:opacity-30"
                >
                  Next Question
                </button>
              </div>
            </div>
          )}
        </div>
      ) : activeMode === 'learn' ? (
        /* ================= MODE A: LEARN CONCEPTS ================= */
        <div className="card p-6 sm:p-8 bg-[#111827] border border-slate-800 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-white">Syllabus Concept Tracker</h2>
              <p className="text-xs text-[#94A3B8]">Review each unit's topics, mark them as understood or flag difficult areas for revision.</p>
            </div>
            <span className="text-xs font-bold text-[#00D4FF]">
              {understoodCount} / {topics.length} Understood
            </span>
          </div>

          <div className="space-y-3">
            {topics.length === 0 ? (
              <p className="text-xs text-[#94A3B8] text-center py-8">No syllabus topics extracted. Click "AI Syllabus Ingest" in Study Hub!</p>
            ) : (
              topics.map((t: any) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-[#0B1020] border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider">{t.unit_name}</span>
                    <h4 className="text-sm font-bold text-white">{t.topic_name}</h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleTopic(t.id, t.is_understood)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        t.is_understood
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      {t.is_understood ? '✓ Understood' : 'Mark Understood'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeMode === 'test' ? (
        /* ================= MODE C: TEST KNOWLEDGE ================= */
        <div className="card p-6 sm:p-8 bg-[#111827] border border-slate-800 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-white">Simulated Examination Knowledge Test</h2>
              <p className="text-xs text-[#94A3B8]">Answer the questions below without assistance. LEMON AI will grade and diagnose weak topics.</p>
            </div>
            {testReport ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                Graded: {testReport.totalAwarded} / {testReport.maxMarks} Marks
              </span>
            ) : (
              <button
                onClick={handleSubmitTest}
                disabled={submittingTest}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#2563FF] to-[#00D4FF] text-white text-xs font-bold shadow-lg"
              >
                {submittingTest ? 'Grading Test...' : 'Submit Test for AI Grading'}
              </button>
            )}
          </div>

          {testReport && (
            <div className="p-6 rounded-2xl bg-[#0B1020] border border-emerald-500/40 space-y-3">
              <h3 className="text-base font-bold text-white">LEMON Diagnostic Report</h3>
              <p className="text-xs text-[#00D4FF]">{testReport.overallVerdict}</p>
              {testReport.weakTopics && testReport.weakTopics.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-rose-400">Recommended for immediate review:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {testReport.weakTopics.map((wt: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[11px]">
                        {wt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-6">
            {activeTest?.questions?.map((q: any, idx: number) => (
              <div key={q.id} className="p-5 rounded-2xl bg-[#0B1020] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#00D4FF]">Question {idx + 1} ({q.expected_marks || 5} Marks)</span>
                  <span className="text-[11px] text-slate-500">{q.unit_name}</span>
                </div>
                <p className="text-sm font-semibold text-white">{q.question}</p>
                <textarea
                  rows={4}
                  value={testAnswers[q.id] || ''}
                  onChange={(e) => setTestAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Type your exam answer here..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#00D4FF] resize-none"
                  disabled={!!testReport}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ================= FLOW FOCUS 3-2-1 POMODORO ================= */
        <div className="card p-6 sm:p-12 bg-[#111827] border border-slate-800 rounded-3xl text-center space-y-6 max-w-xl mx-auto">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00D4FF]">
              {timerPhase === 'focus' ? '🎯 Focus Study Block' : timerPhase === 'break3' ? '🎮 3-Min Mini Game Break' : timerPhase === 'break2' ? '⚡ 2-Min Flashcard Recall' : '🧘 1-Min Mindful Rest'}
            </span>
            <div className="text-6xl sm:text-7xl font-black text-white font-mono tracking-tight">
              {Math.floor(pomodoroSeconds / 60)}:{(pomodoroSeconds % 60).toString().padStart(2, '0')}
            </div>
          </div>

          {/* Mini-Game: The 24 Puzzle */}
          {timerPhase === 'break3' && (
            <div className="p-6 rounded-2xl bg-[#0B1020] border border-[#2563FF]/30 space-y-3">
              <span className="text-xs font-bold text-amber-400">Mini-Game Challenge: Reach 24!</span>
              <p className="text-xs text-[#94A3B8]">Using [3, 8, 2, 1], what is: 3 × 8 × (2 - 1)?</p>
              {puzzleSolved ? (
                <div className="text-xs font-bold text-emerald-400">🎉 Correct! Great focus reset!</div>
              ) : (
                <button
                  onClick={() => setPuzzleSolved(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-[#2563FF]"
                >
                  Solve: 24
                </button>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#2563FF] to-[#00D4FF] text-white text-sm font-bold flex items-center gap-2 shadow-lg"
            >
              {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{timerRunning ? 'Pause' : 'Start Focus'}</span>
            </button>
            <button
              onClick={() => { setTimerRunning(false); setPomodoroSeconds(25 * 60); setTimerPhase('focus'); }}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-[#94A3B8] transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Create Exam Modal */}
      <AnimatePresence>
        {isNewExamOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 text-white"
            >
              <h3 className="text-xl font-black">Register Exam for Preparation</h3>
              <form onSubmit={handleCreateExam} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#94A3B8] block mb-1">Subject Name *</label>
                  <input
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. Operating Systems / CS401"
                    className="w-full p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#94A3B8] block mb-1">Examination Title *</label>
                  <input
                    required
                    value={newExamName}
                    onChange={(e) => setNewExamName(e.target.value)}
                    placeholder="e.g. End-Semester Examination"
                    className="w-full p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#94A3B8] block mb-1">Target Examination Date *</label>
                  <input
                    type="date"
                    required
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#94A3B8] block mb-1">Syllabus Overview / Topics (Optional)</label>
                  <textarea
                    rows={3}
                    value={newSyllabusText}
                    onChange={(e) => setNewSyllabusText(e.target.value)}
                    placeholder="Paste key chapters or topics..."
                    className="w-full p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs text-white focus:outline-none focus:border-[#00D4FF] resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsNewExamOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-[#94A3B8] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingExam}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563FF] to-[#00D4FF] text-white text-xs font-bold"
                  >
                    {savingExam ? 'Saving...' : 'Save & Prepare'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Study;

