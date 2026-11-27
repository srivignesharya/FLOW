import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { IngestionStage, StudyExam } from './types';

interface DocumentCentreProps {
  exam: StudyExam;
  selectedFiles: File[];
  onFilesAdd: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  docType: 'syllabus' | 'previous_papers' | 'notes';
  onDocTypeChange: (type: 'syllabus' | 'previous_papers' | 'notes') => void;
  uploading: boolean;
  stage: IngestionStage;
  feedback: string | null;
  onUploadAndExtract: () => void;
}

const STAGE_STEPS: { key: IngestionStage; label: string }[] = [
  { key: 'uploading', label: 'Uploading' },
  { key: 'processing', label: 'Processing' },
  { key: 'analysing', label: 'Analysing' },
  { key: 'validating', label: 'Validating' },
  { key: 'saving', label: 'Saving' },
  { key: 'completed', label: 'Completed' }
];

export const DocumentCentre: React.FC<DocumentCentreProps> = ({
  exam,
  selectedFiles,
  onFilesAdd,
  onFileRemove,
  docType,
  onDocTypeChange,
  uploading,
  stage,
  feedback,
  onUploadAndExtract
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      onFilesAdd(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#101114] border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-[#FF8A00]" />
              <span>Document Intelligence Centre</span>
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Upload syllabi, previous question papers, or academic notes for <strong className="text-white">{exam.subject}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#18191D] border border-white/5">
            {(
              [
                { id: 'syllabus', label: 'Syllabus' },
                { id: 'previous_papers', label: 'Question Papers' },
                { id: 'notes', label: 'Academic Notes' }
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onDocTypeChange(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  docType === t.id
                    ? 'bg-[#FF8A00] text-black font-bold'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-8 rounded-xl border border-dashed text-center cursor-pointer transition-all space-y-2 ${
            isDragging
              ? 'border-[#FF8A00] bg-[#FF8A00]/10'
              : 'border-white/15 bg-[#18191D]/60 hover:border-[#FF8A00]/60 hover:bg-[#18191D]'
          }`}
        >
          <UploadCloud className="h-7 w-7 text-[#FF9D24] mx-auto" />
          <p className="text-xs font-semibold text-white">
            Click or drag & drop PDF, PNG, JPG, JPEG, or WebP files
          </p>
          <p className="text-[11px] text-[#A1A1AA]">
            Up to 5 files, 50 MB max per file. Scanned images are processed with Vision OCR.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => {
              if (e.target.files?.length) {
                onFilesAdd(Array.from(e.target.files));
                e.target.value = '';
              }
            }}
            className="hidden"
          />
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider block">
              Ready to Process ({selectedFiles.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedFiles.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#18191D] border border-white/10 text-xs"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className="h-4 w-4 text-[#FF9D24] shrink-0" />
                    <span className="truncate text-white">{f.name}</span>
                    <span className="text-[10px] text-[#A1A1AA] shrink-0">
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onFileRemove(i)}
                    disabled={uploading}
                    className="p-1 text-[#A1A1AA] hover:text-rose-400 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onUploadAndExtract}
                disabled={uploading}
                className="px-5 py-2.5 rounded-xl bg-[#FF8A00] hover:bg-[#FF9D24] text-black text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span>{uploading ? 'Processing with LEMON...' : 'Upload & Extract with LEMON'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Pipeline State Stepper */}
        {stage !== 'idle' && (
          <div className="p-4 rounded-xl bg-[#18191D] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Ingestion Pipeline</span>
              <span
                className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                  stage === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : stage === 'failed'
                    ? 'bg-rose-500/15 text-rose-400'
                    : 'bg-[#FF8A00]/15 text-[#FF9D24]'
                }`}
              >
                {stage}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {STAGE_STEPS.map((s, idx) => {
                const currentIdx = STAGE_STEPS.findIndex((st) => st.key === stage);
                const isDone = stage === 'completed' || (currentIdx > idx && stage !== 'failed');
                const isActive = s.key === stage && stage !== 'completed' && stage !== 'failed';
                return (
                  <div
                    key={s.key}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold text-center border ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : isActive
                        ? 'bg-[#FF8A00]/15 border-[#FF8A00] text-[#FF9D24] animate-pulse'
                        : 'bg-[#101114] border-white/5 text-[#A1A1AA]'
                    }`}
                  >
                    {s.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
              feedback.startsWith('✓')
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            {feedback.startsWith('✓') ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Stored Syllabus / Context Preview */}
      <div className="p-6 rounded-2xl bg-[#101114] border border-white/10 space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
          Saved Exam Source Text
        </h4>
        <p className="text-xs text-slate-300 whitespace-pre-wrap line-clamp-6 leading-relaxed">
          {exam.syllabus_text?.trim()
            ? exam.syllabus_text
            : 'No documents ingested yet for this exam. Upload your syllabus or question papers above.'}
        </p>
      </div>
    </div>
  );
};
