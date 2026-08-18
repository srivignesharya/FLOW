import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  FileCheck,
  Camera,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileIngestStudioProps {
  activeTab: 'file' | 'text';
  setActiveTab: (t: 'file' | 'text') => void;
  file: File | null;
  setFile: (f: File | null) => void;
  text: string;
  setText: (t: string) => void;
  loading: boolean;
  error: string;
  result: { document: any; tasks: any[] } | null;
  onFileUpload: (e: React.FormEvent) => void;
  onTextUpload: (e: React.FormEvent) => void;
  onNavigateTasks: () => void;
}

export const MobileIngestStudio: React.FC<MobileIngestStudioProps> = ({
  activeTab,
  setActiveTab,
  file,
  setFile,
  text,
  setText,
  loading,
  error,
  result,
  onFileUpload,
  onTextUpload,
  onNavigateTasks
}) => {
  return (
    <div className="space-y-4 pb-6">
      {/* 1. Top Header */}
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Upload className="h-5 w-5 text-orange-500" />
          <span>Ingest Studio</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Upload syllabi or lecture circulars to extract tasks with AI.
        </p>
      </div>

      {/* 2. Segmented Pill Tabs */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('file')}
          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all select-none min-h-[38px] ${
            activeTab === 'file'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload File</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all select-none min-h-[38px] ${
            activeTab === 'text'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Paste Text</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Tab: File Upload */}
      {activeTab === 'file' && (
        <form onSubmit={onFileUpload} className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
            <input
              id="mobile-file-input"
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="mobile-file-input" className="cursor-pointer flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-xs">
                {file ? <FileCheck className="h-7 w-7 text-emerald-500" /> : <Upload className="h-7 w-7" />}
              </div>

              <div className="space-y-1">
                <span className="font-bold text-sm text-slate-900 dark:text-white block break-words">
                  {file ? file.name : 'Tap to Choose PDF or Image'}
                </span>
                <p className="text-[11px] text-slate-400">
                  PDF, PNG, JPG (Up to 100 MB)
                </p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 active:scale-[0.98] transition-all min-h-[46px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>IMvision is analysing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Extract Commitments with AI</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* 4. Tab: Text Paste */}
      {activeTab === 'text' && (
        <form onSubmit={onTextUpload} className="space-y-4">
          <textarea
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste circular text, assignment brief, or syllabus excerpts..."
            className="w-full p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-xs leading-relaxed"
          />

          <button
            type="submit"
            disabled={!text.trim() || loading}
            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 active:scale-[0.98] transition-all min-h-[46px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>IMvision is analysing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Extract Commitments with AI</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* 5. Extraction Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                  Extracted {result.tasks.length} Tasks
                </h3>
                <p className="text-[10px] text-slate-400 truncate max-w-[170px]">
                  {result.document.file_name}
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateTasks}
              className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:underline"
            >
              <span>View Tasks</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2">
            {result.tasks.map((t, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase">
                    {t.subject || 'General'}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    {t.priority}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white break-words">{t.title}</h4>
                <p className="text-[10px] text-slate-400">Deadline: {new Date(t.deadline).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MobileIngestStudio;
