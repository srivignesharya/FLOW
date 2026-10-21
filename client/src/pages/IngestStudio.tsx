import React, { useState } from 'react';
import api from '../services/api';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  FileCheck, 
  Layers,
  AlertTriangle,
  Edit2,
  Trash2,
  Save,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { MotionButton } from '../components/MotionButton';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileIngestStudio } from '../components/mobile/MobileIngestStudio';
import { showToast } from '../components/ToastContainer';

interface ExtractedTaskItem {
  id?: string;
  title: string;
  subject: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  task_type?: string;
  estimated_minutes?: number;
  description?: string;
  is_duplicate?: boolean;
  duplicate_reason?: string | null;
  selected?: boolean;
}

export const IngestStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ document: any; tasks: any[] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Review & Confirmation Workflow state
  const [reviewMode, setReviewMode] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<ExtractedTaskItem[]>([]);
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const navigate = useNavigate();

  const parseUserFacingError = (rawErr: any, defaultMsg: string): string => {
    const errMsg = rawErr?.response?.data?.error || rawErr?.message || defaultMsg;
    if (typeof errMsg === 'string') {
      const jsonMatch = errMsg.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed?.error?.message) {
            const inner = parsed.error.message;
            if (inner.includes('tokens per minute') || inner.includes('TPM') || inner.includes('Request too large')) {
              return 'Document is too large for a single AI pass. Please upload a smaller section or syllabus excerpt.';
            }
            return inner;
          }
        } catch (_) {}
      }
      if (errMsg.includes('tokens per minute') || errMsg.includes('TPM') || errMsg.includes('Request too large')) {
        return 'Document is too large for a single AI pass. Please upload a smaller section or syllabus excerpt.';
      }
      return errMsg;
    }
    return defaultMsg;
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 100 MB limit (Selected file: ${(file.size / (1024 * 1024)).toFixed(1)} MB). Please upload a smaller file.`);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setReviewMode(false);
    setProcessingStep('Uploading document to secure workspace...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      setProcessingStep('Extracting commitments with Gemini AI & Groq Llama 3.3...');
      const res = await api.post('/ingest/file?preview=true', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.requiresReview && Array.isArray(res.data?.tasks)) {
        // Initialize editable review state with all non-duplicate tasks selected by default
        const items: ExtractedTaskItem[] = res.data.tasks.map((t: any) => ({
          ...t,
          selected: !t.is_duplicate // Uncheck duplicates by default to prevent accidental double-adding
        }));
        setPendingTasks(items);
        setCurrentDocument(res.data.document);
        setReviewMode(true);
        showToast(`AI extracted ${items.length} tasks! Please review before saving.`, 'info');
      } else {
        setResult(res.data);
      }
    } catch (err: any) {
      setError(parseUserFacingError(err, 'Failed to ingest file document.'));
    } finally {
      setLoading(false);
      setProcessingStep('');
    }
  };

  const handleTextUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    setReviewMode(false);
    setProcessingStep('Analyzing text excerpt with AI...');

    try {
      const res = await api.post('/ingest/text', { textContent: text, preview: true });
      if (res.data?.requiresReview && Array.isArray(res.data?.tasks)) {
        const items: ExtractedTaskItem[] = res.data.tasks.map((t: any) => ({
          ...t,
          selected: !t.is_duplicate
        }));
        setPendingTasks(items);
        setCurrentDocument(res.data.document);
        setReviewMode(true);
        showToast(`Extracted ${items.length} tasks! Please review before saving.`, 'info');
      } else {
        setResult(res.data);
      }
    } catch (err: any) {
      setError(parseUserFacingError(err, 'Failed to extract tasks from text.'));
    } finally {
      setLoading(false);
      setProcessingStep('');
    }
  };

  // Toggle selection for a review task
  const toggleSelectTask = (index: number) => {
    setPendingTasks(prev => prev.map((t, i) => i === index ? { ...t, selected: !t.selected } : t));
  };

  // Update field of a task during review
  const updatePendingTask = (index: number, field: keyof ExtractedTaskItem, value: any) => {
    setPendingTasks(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  // Confirm and save selected tasks
  const handleConfirmSave = async () => {
    const selectedTasks = pendingTasks.filter(t => t.selected);
    if (selectedTasks.length === 0) {
      setError('Please select at least one task to save.');
      return;
    }

    setConfirmLoading(true);
    try {
      const res = await api.post('/ingest/confirm', {
        documentId: currentDocument?.id || null,
        tasks: selectedTasks
      });

      showToast(`Successfully saved ${res.data.count} tasks to your workspace!`, 'success');
      setReviewMode(false);
      setResult({
        document: currentDocument,
        tasks: res.data.tasks
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save confirmed tasks.');
      showToast('Error saving tasks', 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <>
      {/* 1. Mobile Ingest Studio (< md) */}
      <div className="md:hidden">
        <MobileIngestStudio
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          file={file}
          setFile={setFile}
          text={text}
          setText={setText}
          loading={loading}
          error={error}
          result={result}
          onFileUpload={handleFileUpload}
          onTextUpload={handleTextUpload}
          onNavigateTasks={() => navigate('/tasks')}
        />
      </div>

      {/* 2. Desktop Ingest Studio (>= md) */}
      <div className="hidden md:block space-y-6 sm:space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 sm:gap-3">
            <Upload className="h-6 sm:h-7 w-6 sm:w-7 text-[#00D4FF]" />
            <span>Syllabus & Document Ingest Studio</span>
          </h1>
          <p className="text-slate-500 dark:text-[#94A3B8] text-xs sm:text-sm mt-1">
            Upload course syllabi, lecture slides, assignment PDFs, or paste announcement text. ZENITH AI extracts commitments for your review.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => { setActiveTab('file'); setReviewMode(false); }}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-colors ${
              activeTab === 'file'
                ? 'border-[#2563FF] text-[#00D4FF] dark:text-[#00D4FF]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload Document / PDF</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('text'); setReviewMode(false); }}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-[#2563FF] text-[#00D4FF] dark:text-[#00D4FF]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Paste Syllabus Text</span>
          </button>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Progress State */}
        {loading && (
          <div className="card p-6 text-center space-y-3 bg-[#111827] border-slate-800">
            <div className="h-10 w-10 mx-auto rounded-full border-2 border-[#2563FF] border-t-transparent animate-spin" />
            <h3 className="text-sm font-bold text-[#F8FAFC]">AI Ingestion in Progress</h3>
            <p className="text-xs text-[#94A3B8]">{processingStep || 'Processing document commitments...'}</p>
          </div>
        )}

        {/* REVIEW AND CONFIRMATION WORKFLOW (Phase 4E) */}
        {reviewMode && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5 sm:p-7 space-y-5 bg-[#111827] border-slate-800"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#2563FF]/20 text-[#00D4FF] border border-[#2563FF]/30">
                    Step 2: Review & Verify
                  </span>
                  <span className="text-xs font-bold text-[#F8FAFC]">
                    {pendingTasks.filter(t => t.selected).length} of {pendingTasks.length} Selected
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#F8FAFC] mt-1">
                  Review Extracted Commitments Before Saving
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Verify dates and titles. Tasks flagged as duplicates are unchecked by default.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setReviewMode(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Discard
                </button>
                <MotionButton
                  variant="primary"
                  onClick={handleConfirmSave}
                  isLoading={confirmLoading}
                  icon={<Save className="h-4 w-4" />}
                  className="text-xs"
                >
                  Save Verified Tasks ({pendingTasks.filter(t => t.selected).length})
                </MotionButton>
              </div>
            </div>

            {/* List of Pending Editable Tasks */}
            <div className="space-y-3.5">
              {pendingTasks.map((task, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    task.selected
                      ? 'bg-[#0B1020] border-slate-800'
                      : 'bg-[#0B1020]/40 border-slate-800/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(task.selected)}
                      onChange={() => toggleSelectTask(idx)}
                      className="mt-1.5 h-4 w-4 rounded border-slate-700 text-[#2563FF] focus:ring-0 cursor-pointer"
                    />

                    <div className="flex-1 space-y-2.5">
                      {/* Duplicate Warning Badge */}
                      {task.is_duplicate && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>{task.duplicate_reason || 'Likely duplicate of an existing task'}</span>
                        </div>
                      )}

                      {/* Title Edit */}
                      <div>
                        <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Task Title</label>
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => updatePendingTask(idx, 'title', e.target.value)}
                          className="input mt-1 py-1.5 text-xs font-semibold"
                        />
                      </div>

                      {/* Subject, Deadline, Priority Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Subject</label>
                          <input
                            type="text"
                            value={task.subject}
                            onChange={(e) => updatePendingTask(idx, 'subject', e.target.value)}
                            className="input mt-1 py-1 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Deadline</label>
                          <input
                            type="datetime-local"
                            value={task.deadline ? new Date(new Date(task.deadline).getTime() - new Date(task.deadline).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                            onChange={(e) => updatePendingTask(idx, 'deadline', new Date(e.target.value).toISOString())}
                            className="input mt-1 py-1 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Priority</label>
                          <select
                            value={task.priority}
                            onChange={(e) => updatePendingTask(idx, 'priority', e.target.value as any)}
                            className="select mt-1 py-1 text-xs capitalize"
                          >
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                          </select>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-slate-400 italic">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* File Upload Form (When not in review mode) */}
        {!reviewMode && activeTab === 'file' && (
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-6 sm:p-12 text-center transition-all bg-white dark:bg-[#111827] ${
                isDragging
                  ? 'border-[#00D4FF] bg-[#2563FF]/10 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
              }`}
            >
              <input
                id="file-upload-input"
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                className="hidden"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer block space-y-3 sm:space-y-4">
                <div className="flex justify-center">
                  <div className="relative p-3.5 sm:p-5 rounded-2xl bg-gradient-to-tr from-[#2563FF] to-[#00D4FF] text-white shadow-xl shadow-[#2563FF]/20">
                    {file ? <FileCheck className="h-7 sm:h-10 w-7 sm:w-10 text-emerald-300" /> : <Upload className="h-7 sm:h-10 w-7 sm:w-10" />}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white block break-words">
                    {file ? file.name : 'Tap to choose or drag & drop syllabus document'}
                  </span>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#94A3B8]">
                    Supports PDF, PNG, JPEG, WebP (Max limit: 100 MB)
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-end">
              <MotionButton
                id="ingest-file-btn"
                type="submit"
                disabled={!file || loading}
                isLoading={loading}
                icon={<Sparkles className="h-4 w-4" />}
                className="w-full sm:w-auto justify-center"
              >
                Extract Tasks & Commitments
              </MotionButton>
            </div>
          </form>
        )}

        {/* Text Form (When not in review mode) */}
        {!reviewMode && activeTab === 'text' && (
          <form onSubmit={handleTextUpload} className="card p-4 sm:p-6 space-y-4 sm:space-y-6 bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider mb-2">
                Raw Syllabus or Circular Text
              </label>
              <textarea
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste announcement text, assignment guidelines, or syllabus excerpts..."
                className="input text-xs sm:text-sm leading-relaxed"
              />
            </div>

            <div className="flex justify-end">
              <MotionButton
                id="ingest-text-btn"
                type="submit"
                disabled={!text.trim() || loading}
                isLoading={loading}
                icon={<Sparkles className="h-4 w-4" />}
                className="w-full sm:w-auto justify-center"
              >
                Extract Tasks & Commitments
              </MotionButton>
            </div>
          </form>
        )}

        {/* Confirmed Saved Result Notification */}
        {result && !reviewMode && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5 sm:p-7 space-y-4 bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {result.tasks.length} Commitment{result.tasks.length === 1 ? '' : 's'} Active in Workspace
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    Source: {result.document?.file_name || 'Text Excerpt'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MotionButton
                  onClick={() => navigate('/planner')}
                  variant="primary"
                  icon={<Sparkles className="h-4 w-4" />}
                  className="text-xs"
                >
                  Generate 7-Day Plan
                </MotionButton>
                <MotionButton
                  onClick={() => navigate('/tasks')}
                  variant="secondary"
                  icon={<ArrowRight className="h-4 w-4" />}
                  className="text-xs"
                >
                  View Tasks
                </MotionButton>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {result.tasks.map((t, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                      {t.subject} • Due {new Date(t.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge type="priority" value={t.priority} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};
export default IngestStudio;
