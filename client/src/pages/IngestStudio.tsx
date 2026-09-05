import React, { useState } from 'react';
import api from '../services/api';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, ArrowRight, FileCheck, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { MotionButton } from '../components/MotionButton';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileIngestStudio } from '../components/mobile/MobileIngestStudio';

export const IngestStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ document: any; tasks: any[] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const navigate = useNavigate();

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

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/ingest/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to ingest file document.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/ingest/text', { textContent: text });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to extract tasks from text.');
    } finally {
      setLoading(false);
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
      {/* 1. Purpose-Built Mobile Ingest Studio (< md) */}
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

      {/* 2. Desktop Ingest Studio (>= md) - PRESERVED 100% */}
      <div className="hidden md:block space-y-6 sm:space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 sm:gap-3">
            <Upload className="h-6 sm:h-7 w-6 sm:w-7 text-brand-500" />
            <span>Syllabus & Document Ingest Studio</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Upload course syllabi, lecture slides, assignment PDFs, or paste announcement text. FLOW AI extracts commitments automatically.
          </p>
        </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 sm:gap-6 overflow-x-auto pb-px">
        <button
          onClick={() => { setActiveTab('file'); setError(''); setResult(null); }}
          className={`pb-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'file'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Upload File (PDF / Image)</span>
        </button>

        <button
          onClick={() => { setActiveTab('text'); setError(''); setResult(null); }}
          className={`pb-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'text'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Paste Text Excerpt</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/80 text-red-400 text-xs rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PDF Upload Glass Drag & Drop Zone */}
      {activeTab === 'file' && (
        <form onSubmit={handleFileUpload} className="card p-4 sm:p-6 space-y-4 sm:space-y-6 bg-white dark:bg-slate-900/60 backdrop-blur-2xl border-slate-200 dark:border-slate-800">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center transition-all ${
              isDragging
                ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
                : file
                ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-slate-700/80 hover:border-brand-500/50 bg-slate-50/50 dark:bg-slate-950/40'
            }`}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-3 sm:gap-4 min-h-[140px] justify-center">
              <div className="relative">
                <div className="absolute -inset-3 bg-brand-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative p-3.5 sm:p-5 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-xl shadow-brand-500/20">
                  {file ? <FileCheck className="h-7 sm:h-10 w-7 sm:w-10 text-emerald-300" /> : <Upload className="h-7 sm:h-10 w-7 sm:w-10" />}
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white block break-words">
                  {file ? file.name : 'Tap to choose or drag & drop syllabus document'}
                </span>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
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

      {/* Text Form */}
      {activeTab === 'text' && (
        <form onSubmit={handleTextUpload} className="card p-4 sm:p-6 space-y-4 sm:space-y-6 bg-white dark:bg-slate-900/60 backdrop-blur-2xl border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
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

      {/* Extracted Results List */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 sm:p-6 space-y-4 sm:space-y-6 bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="h-5 sm:h-6 w-5 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Extracted {result.tasks.length} Commitments
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Document: {result.document?.file_name || 'Extracted Text Excerpt'}
                </p>
              </div>
            </div>
            <MotionButton
              onClick={() => navigate('/tasks')}
              variant="secondary"
              icon={<ArrowRight className="h-4 w-4" />}
              className="w-full sm:w-auto justify-center"
            >
              View in Task Manager
            </MotionButton>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
            {result.tasks.map((t, idx) => (
              <div key={idx} className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="font-bold text-sm text-slate-900 dark:text-white break-words">{t.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-brand-600 dark:text-brand-400">{t.subject}</span>
                    <span>•</span>
                    <span>Deadline: {new Date(t.deadline).toLocaleDateString()}</span>
                  </div>
                  {t.reasoning && (
                    <p className="text-[11px] text-slate-400 italic">"{t.reasoning}"</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-start sm:self-auto">
                  <StatusBadge type="priority" value={t.priority} />
                  <StatusBadge type="taskType" value={t.task_type || 'assignment'} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      </div>
    </>
  );
};
