import React, { useState } from 'react';
import api from '../services/api';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';

export const IngestStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ document: any; tasks: any[] } | null>(null);

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

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          Ingest Studio
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Upload course syllabi, lecture slides, assignment PDFs, or paste raw announcement text. Gemini AI extracts commitments automatically.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => { setActiveTab('file'); setError(''); setResult(null); }}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'file'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Upload File (PDF / Image)</span>
        </button>

        <button
          onClick={() => { setActiveTab('text'); setError(''); setResult(null); }}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'text'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Paste Syllabus / Announcement Text</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/80 text-red-400 text-xs rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* File Form */}
      {activeTab === 'file' && (
        <form onSubmit={handleFileUpload} className="card p-6 space-y-6">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-2xl p-8 text-center transition-colors bg-slate-50/50 dark:bg-slate-900/50">
            <input
              id="file-input"
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-3">
              <div className="p-4 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-2xl">
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  {file ? file.name : 'Click to upload or drag & drop syllabus document'}
                </span>
                <p className="text-xs text-slate-400 mt-1">Supports PDF, PNG, JPEG, WebP (Maximum file size: 100 MB)</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              id="ingest-file-btn"
              type="submit"
              disabled={!file || loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing with Gemini 2.5...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Extract Tasks & Commitments</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Text Form */}
      {activeTab === 'text' && (
        <form onSubmit={handleTextUpload} className="card p-6 space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Raw Text / Circular Content
            </label>
            <textarea
              id="ingest-text-area"
              rows={8}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste syllabus guidelines, exam schedule details, or homework announcements here..."
              className="input font-mono text-xs"
            />
          </div>

          <div className="flex justify-end">
            <button
              id="ingest-text-btn"
              type="submit"
              disabled={!text.trim() || loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing with Gemini 2.5...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Extract Tasks & Commitments</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Results Display */}
      {result && (
        <div className="card p-6 space-y-6 animate-in border-emerald-500/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-xl">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  Extraction Complete!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Found {result.tasks.length} academic task(s) saved to your database.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/tasks')}
              className="btn-secondary text-xs flex items-center gap-2"
            >
              <span>View Task Manager</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {result.tasks.map((task) => (
              <div key={task.id} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{task.title}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge type="priority" value={task.priority} />
                    <StatusBadge type="taskType" value={task.task_type || 'assignment'} />
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{task.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Subject: <strong className="text-slate-300">{task.subject}</strong></span>
                  <span>Deadline: <strong className="text-slate-300">{new Date(task.deadline).toLocaleString()}</strong></span>
                  <span>Est. Time: <strong className="text-slate-300">{task.estimated_minutes} min</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
