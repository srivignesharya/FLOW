import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar, Clock, AlertCircle, CheckCircle2, Sparkles, Tag, Layers } from 'lucide-react';
import api from '../services/api';
import { showToast } from './ToastContainer';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (task: any) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('General');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskType, setTaskType] = useState<'assignment' | 'exam' | 'announcement' | 'reading'>('assignment');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Quick preset helpers for deadline
  const setQuickDeadline = (hoursFromNow: number) => {
    const target = new Date(Date.now() + hoursFromNow * 3600 * 1000);
    // Convert to local datetime-local format YYYY-MM-DDTHH:mm
    const localIso = new Date(target.getTime() - target.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setDeadline(localIso);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Task title is required.');
      return;
    }

    if (!deadline) {
      setError('Please specify a due date and time.');
      return;
    }

    setLoading(true);
    try {
      // Convert datetime-local to ISO string
      const isoDeadline = new Date(deadline).toISOString();

      const payload = {
        title: cleanTitle,
        subject: subject.trim() || 'General',
        deadline: isoDeadline,
        priority,
        estimatedMinutes: Number(estimatedMinutes) || 60,
        description: description.trim(),
        taskType
      };

      const res = await api.post('/tasks', payload);
      showToast('Task added successfully to your academic workspace!', 'success');

      // Reset form
      setTitle('');
      setSubject('General');
      setDeadline('');
      setDescription('');
      setPriority('medium');
      setEstimatedMinutes(60);

      if (onTaskCreated) onTaskCreated(res.data);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to create task';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg rounded-2xl bg-[#111827] border border-slate-800 text-[#F8FAFC] shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0B1020]/60">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-[#2563FF]/15 text-[#00D4FF] flex items-center justify-center border border-[#2563FF]/30">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <h3 id="quick-add-title" className="text-base font-bold text-[#F8FAFC]">
                  Quick Add Task
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Schedule an assignment or study commitment in ZENITH
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800 transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                Task / Assignment Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Problem Set 4 — Differential Equations"
                className="input"
                autoFocus
              />
            </div>

            {/* Subject & Type Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  Subject / Course
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Math 221"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  Task Category
                </label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as any)}
                  className="select"
                >
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam / Quiz</option>
                  <option value="reading">Reading / Preparation</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>
            </div>

            {/* Deadline with Quick Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#94A3B8]">
                  Deadline <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(8)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 hover:bg-[#2563FF]/20 hover:text-[#00D4FF] text-[#94A3B8] transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(24)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 hover:bg-[#2563FF]/20 hover:text-[#00D4FF] text-[#94A3B8] transition-colors"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(168)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 hover:bg-[#2563FF]/20 hover:text-[#00D4FF] text-[#94A3B8] transition-colors"
                  >
                    Next Week
                  </button>
                </div>
              </div>
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input"
              />
            </div>

            {/* Priority & Est. Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="select capitalize"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  Est. Minutes
                </label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="input"
                />
              </div>
            </div>

            {/* Notes / Description */}
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key submission guidelines or problem numbers..."
                className="input resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Adding Task...' : 'Add Task to ZENITH'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default QuickAddModal;
