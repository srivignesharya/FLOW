import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, UploadCloud, Trash2, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import api from '../../services/api';

interface ExamOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newExamId?: string) => Promise<void>;
}

export const ExamOnboardingModal: React.FC<ExamOnboardingModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  const [tab, setTab] = useState<'manual' | 'timetable'>('manual');

  // Manual fields
  const [subject, setSubject] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [semester, setSemester] = useState('');
  const [examType, setExamType] = useState('Theory');
  const [syllabusText, setSyllabusText] = useState('');
  const [saving, setSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Timetable extraction fields
  const [timetableFiles, setTimetableFiles] = useState<File[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractedExams, setExtractedExams] = useState<any[]>([]);
  const [timetableError, setTimetableError] = useState<string | null>(null);
  const [savingTimetable, setSavingTimetable] = useState(false);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !examName.trim() || !examDate) return;
    try {
      setSaving(true);
      setManualError(null);
      const fullSubject = subjectCode.trim() ? `${subject.trim()} (${subjectCode.trim()})` : subject.trim();
      const fullTitle = [examName.trim(), semester.trim(), examType, examTime.trim()].filter(Boolean).join(' • ');
      const res = await api.post('/study/exams', {
        subject: fullSubject,
        exam_name: fullTitle,
        exam_date: examDate,
        syllabus_text: syllabusText.trim()
      });
      setSubject('');
      setSubjectCode('');
      setExamName('');
      setExamDate('');
      setExamTime('');
      setSemester('');
      setSyllabusText('');
      onClose();
      await onCreated(res.data?.id);
    } catch (err: any) {
      setManualError(err.response?.data?.error || 'Failed to create examination.');
    } finally {
      setSaving(false);
    }
  };

  const handleExtractTimetable = async () => {
    if (timetableFiles.length === 0) return;
    try {
      setExtracting(true);
      setTimetableError(null);
      const formData = new FormData();
      timetableFiles.forEach((f) => formData.append('files', f));
      const res = await api.post('/study/extract-timetable', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (!res.data?.success || !res.data?.exams?.length) {
        throw new Error(res.data?.error || 'No examination entries found in this document.');
      }
      setExtractedExams(res.data.exams);
    } catch (err: any) {
      setTimetableError(err.response?.data?.error || err.message || 'Timetable extraction failed.');
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveExtracted = async () => {
    if (extractedExams.length === 0) return;
    try {
      setSavingTimetable(true);
      let lastId: string | undefined;
      for (const item of extractedExams) {
        if (!item.subject || !item.exam_date) continue;
        const fullSubject = item.subject_code ? `${item.subject} (${item.subject_code})` : item.subject;
        const fullTitle = [item.exam_name, item.semester, item.exam_type, item.exam_time].filter(Boolean).join(' • ') || 'Examination';
        const res = await api.post('/study/exams', {
          subject: fullSubject,
          exam_name: fullTitle,
          exam_date: item.exam_date
        });
        if (res.data?.id) lastId = res.data.id;
      }
      setTimetableFiles([]);
      setExtractedExams([]);
      onClose();
      await onCreated(lastId);
    } catch (err: any) {
      setTimetableError(err.response?.data?.error || 'Failed to save extracted exams.');
    } finally {
      setSavingTimetable(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-2xl bg-[#101114] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-5 text-white my-8 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Add Examination</h3>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Create manually or import your timetable for LEMON AI extraction.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#18191D] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Pathway Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#18191D] border border-white/5">
              <button
                type="button"
                onClick={() => setTab('manual')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  tab === 'manual' ? 'bg-[#FF8A00] text-black font-bold' : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Manually</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('timetable')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  tab === 'timetable' ? 'bg-[#FF8A00] text-black font-bold' : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Import Timetable (PDF / Image)</span>
              </button>
            </div>

            {tab === 'manual' ? (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                      Subject Name *
                    </label>
                    <input
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Operating Systems"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF8A00]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                      Subject Code
                    </label>
                    <input
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      placeholder="e.g. CS401"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF8A00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                      Examination Title *
                    </label>
                    <input
                      required
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      placeholder="e.g. End-Semester Exam"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF8A00]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                      Examination Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF8A00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                      Time Slot
                    </label>
                    <input
                      value={examTime}
                      onChange={(e) => setExamTime(e.target.value)}
                      placeholder="09:30 AM - 12:30 PM"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF8A00]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                      Semester
                    </label>
                    <input
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      placeholder="e.g. Sem 5"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF8A00]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                      Type
                    </label>
                    <select
                      value={examType}
                      onChange={(e) => setExamType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF8A00]"
                    >
                      <option value="Theory">Theory</option>
                      <option value="Practical">Practical</option>
                      <option value="Internal">Internal / CIA</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                    Syllabus Overview (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={syllabusText}
                    onChange={(e) => setSyllabusText(e.target.value)}
                    placeholder="Paste key units or topics, or upload your syllabus PDF later..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF8A00] resize-none"
                  />
                </div>

                {manualError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{manualError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs text-[#A1A1AA] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-[#FF8A00] hover:bg-[#FF9D24] text-black text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Exam Workspace'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#18191D] border border-white/10 space-y-3">
                  <p className="text-xs text-[#A1A1AA]">
                    Upload your examination timetable (PDF, PNG, JPG, JPEG, WebP). LEMON will extract subjects, codes, dates, and times for you to review before saving.
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      setTimetableFiles(e.target.files ? Array.from(e.target.files) : []);
                      setTimetableError(null);
                      setExtractedExams([]);
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#101114] border border-white/10 text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#FF8A00]/20 file:text-[#FF9D24]"
                  />
                  {timetableFiles.length > 0 && extractedExams.length === 0 && (
                    <button
                      type="button"
                      onClick={handleExtractTimetable}
                      disabled={extracting}
                      className="w-full py-2.5 rounded-xl bg-[#FF8A00] hover:bg-[#FF9D24] text-black text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {extracting ? 'LEMON Extracting Schedule...' : `Extract Exam Schedule (${timetableFiles.length} file${timetableFiles.length > 1 ? 's' : ''})`}
                    </button>
                  )}
                </div>

                {timetableError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{timetableError}</span>
                  </div>
                )}

                {extractedExams.length > 0 && (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#FF9D24] uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Review & Confirm ({extractedExams.length} found)
                      </span>
                    </div>
                    {extractedExams.map((ex, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#18191D] border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <input
                          value={ex.subject || ''}
                          onChange={(e) => {
                            const copy = [...extractedExams];
                            copy[idx].subject = e.target.value;
                            setExtractedExams(copy);
                          }}
                          placeholder="Subject Name"
                          className="p-2 rounded-lg bg-[#101114] border border-white/10 text-white"
                        />
                        <input
                          value={ex.subject_code || ''}
                          onChange={(e) => {
                            const copy = [...extractedExams];
                            copy[idx].subject_code = e.target.value;
                            setExtractedExams(copy);
                          }}
                          placeholder="Subject Code"
                          className="p-2 rounded-lg bg-[#101114] border border-white/10 text-white"
                        />
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#A1A1AA] shrink-0" />
                          <input
                            type="date"
                            value={ex.exam_date || ''}
                            onChange={(e) => {
                              const copy = [...extractedExams];
                              copy[idx].exam_date = e.target.value;
                              setExtractedExams(copy);
                            }}
                            className="flex-1 p-2 rounded-lg bg-[#101114] border border-white/10 text-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            value={ex.exam_time || ''}
                            onChange={(e) => {
                              const copy = [...extractedExams];
                              copy[idx].exam_time = e.target.value;
                              setExtractedExams(copy);
                            }}
                            placeholder="Time"
                            className="flex-1 p-2 rounded-lg bg-[#101114] border border-white/10 text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setExtractedExams(prev => prev.filter((_, i) => i !== idx))}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                            title="Remove row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs text-[#A1A1AA] hover:text-white"
                  >
                    Cancel
                  </button>
                  {extractedExams.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSaveExtracted}
                      disabled={savingTimetable}
                      className="px-5 py-2.5 rounded-xl bg-[#FF8A00] hover:bg-[#FF9D24] text-black text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {savingTimetable ? 'Saving...' : `Confirm & Save ${extractedExams.length} Exam(s)`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
