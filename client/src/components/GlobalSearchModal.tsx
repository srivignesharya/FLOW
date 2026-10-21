import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Calendar, CheckSquare, Clock, ArrowRight, Tag, BookOpen, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { getRelativeDeadline } from '../utils/dateUtils';

interface Task {
  id: string;
  title: string;
  subject: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  task_type?: string;
  description?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onSelectTask
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'high' | 'assignment' | 'exam'>('all');
  const navigate = useNavigate();

  // Keyboard shortcut listener for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered tasks based on debounced-like input
  const results = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return tasks.filter(task => {
      // Category filter
      if (categoryFilter === 'high' && task.priority !== 'high') return false;
      if (categoryFilter === 'assignment' && task.task_type !== 'assignment') return false;
      if (categoryFilter === 'exam' && task.task_type !== 'exam') return false;

      // Query match
      if (!cleanQuery) return true;

      const titleMatch = (task.title || '').toLowerCase().includes(cleanQuery);
      const subjectMatch = (task.subject || '').toLowerCase().includes(cleanQuery);
      const descMatch = (task.description || '').toLowerCase().includes(cleanQuery);
      const typeMatch = (task.task_type || '').toLowerCase().includes(cleanQuery);

      return titleMatch || subjectMatch || descMatch || typeMatch;
    });
  }, [tasks, query, categoryFilter]);

  if (!isOpen) return null;

  const handleSelect = (task: Task) => {
    if (onSelectTask) {
      onSelectTask(task);
    } else {
      navigate('/tasks');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl rounded-2xl bg-[#111827] border border-slate-800 text-[#F8FAFC] shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Search Input Bar */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-[#0B1020]/80">
            <Search className="h-5 w-5 text-[#00D4FF] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks, course subjects, assignments, notes... (Ctrl+K)"
              className="w-full bg-transparent text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white"
            >
              ESC
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="px-4 py-2 border-b border-slate-800/80 bg-[#111827] flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Filter:</span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 ${
                categoryFilter === 'all'
                  ? 'bg-[#2563FF]/20 text-[#00D4FF] border border-[#2563FF]/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setCategoryFilter('high')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 ${
                categoryFilter === 'high'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              🔥 High Priority
            </button>
            <button
              onClick={() => setCategoryFilter('assignment')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 ${
                categoryFilter === 'assignment'
                  ? 'bg-[#2563FF]/20 text-[#93c5fd] border border-[#2563FF]/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Assignments
            </button>
            <button
              onClick={() => setCategoryFilter('exam')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 ${
                categoryFilter === 'exam'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Exams & Tests
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/80 p-2">
            {results.map((task) => {
              const rel = getRelativeDeadline(task.deadline);
              return (
                <div
                  key={task.id}
                  onClick={() => handleSelect(task)}
                  className="p-3 rounded-xl hover:bg-[#161F36] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#F8FAFC] group-hover:text-[#00D4FF] transition-colors truncate">
                        {task.title}
                      </span>
                      {task.status === 'completed' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                          Done
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#94A3B8]">
                      <span className="font-medium text-[#F8FAFC]">{task.subject}</span>
                      <span>•</span>
                      <span className={rel.isOverdue ? 'text-rose-400 font-semibold' : rel.isUrgent ? 'text-amber-400' : ''}>
                        {rel.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge type="priority" value={task.priority} />
                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-[#00D4FF] transition-colors" />
                  </div>
                </div>
              );
            })}

            {results.length === 0 && (
              <div className="py-12 text-center text-xs text-[#94A3B8] space-y-1">
                <Search className="h-6 w-6 mx-auto opacity-30" />
                <p>No matching tasks found for "{query}".</p>
                <p className="text-[11px] text-slate-500">Try searching by subject or assignment title.</p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3 border-t border-slate-800 bg-[#0B1020]/90 text-[11px] text-[#94A3B8] flex items-center justify-between">
            <span>Showing {results.length} result{results.length === 1 ? '' : 's'}</span>
            <span className="font-mono">ZENITH Search Engine</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default GlobalSearchModal;
