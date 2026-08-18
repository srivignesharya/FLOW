import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  MoreVertical, 
  Calendar as CalendarIcon, 
  Download, 
  Edit3, 
  Trash2, 
  X,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  subject?: string;
  deadline: string;
  priority: string;
  status: string;
  description?: string;
  estimated_minutes?: number;
}

interface MobileTaskManagerProps {
  tasks: Task[];
  onToggleTask: (taskId: string, currentStatus: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenCreate: () => void;
  onSyncGoogleCalendar: (task: Task) => void;
  onExportIcs: (task: Task) => void;
}

export const MobileTaskManager: React.FC<MobileTaskManagerProps> = ({
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onOpenCreate,
  onSyncGoogleCalendar,
  onExportIcs
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'urgent' | 'completed'>('all');
  const [activeActionSheetTask, setActiveActionSheetTask] = useState<Task | null>(null);

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.subject && task.subject.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'pending') return task.status !== 'completed';
    if (selectedFilter === 'completed') return task.status === 'completed';
    if (selectedFilter === 'urgent') return (task.priority === 'urgent' || task.priority === 'high') && task.status !== 'completed';
    return true;
  });

  const formatDeadline = (deadlineStr: string) => {
    const d = new Date(deadlineStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    if (isToday) return `Today, ${timeStr}`;
    if (isTomorrow) return `Tomorrow, ${timeStr}`;
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 1. Top Header & Search */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Task Manager
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tasks.filter(t => t.status !== 'completed').length} active commitments
            </p>
          </div>

          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all min-h-[40px]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or course subject..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-xs"
          />
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {(['all', 'pending', 'urgent', 'completed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize whitespace-nowrap transition-all select-none min-h-[34px] ${
                selectedFilter === filter
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Tasks Card List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const isCompleted = task.status === 'completed';

          return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-3xl border transition-all ${
                isCompleted
                  ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-60'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* 44px Checkbox + Task Info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => onToggleTask(task.id, task.status)}
                    className={`p-2 rounded-xl border flex items-center justify-center transition-all shrink-0 min-h-[40px] min-w-[40px] mt-0.5 ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-transparent hover:border-orange-500'
                    }`}
                    title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                    aria-label="Toggle task status"
                  >
                    <CheckCircle2 className={`h-5 w-5 ${isCompleted ? 'text-white' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400">
                        {task.subject || 'General'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        task.priority === 'urgent'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : task.priority === 'high'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {task.priority || 'Normal'}
                      </span>
                    </div>

                    <h3 className={`text-sm font-bold text-slate-900 dark:text-white leading-snug break-words ${
                      isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                    }`}>
                      {task.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                      <Clock className="h-3.5 w-3.5 text-orange-500" />
                      <span>{formatDeadline(task.deadline)}</span>
                    </div>
                  </div>
                </div>

                {/* More Action Trigger */}
                <button
                  onClick={() => setActiveActionSheetTask(task)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center"
                  aria-label="Task options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="p-8 text-center space-y-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No tasks found</h3>
              <p className="text-xs text-slate-400">Try changing your filters or add a new commitment.</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Task Action Bottom Sheet */}
      <AnimatePresence>
        {activeActionSheetTask && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveActionSheetTask(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 pb-8 space-y-4 shadow-2xl"
            >
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2" />

              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="min-w-0 pr-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{activeActionSheetTask.subject || 'General'}</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{activeActionSheetTask.title}</h4>
                </div>
                <button
                  onClick={() => setActiveActionSheetTask(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    const t = activeActionSheetTask;
                    setActiveActionSheetTask(null);
                    onEditTask(t);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors min-h-[44px]"
                >
                  <Edit3 className="h-4 w-4 text-brand-500" />
                  <span>Edit Task Details</span>
                </button>

                <button
                  onClick={() => {
                    const t = activeActionSheetTask;
                    setActiveActionSheetTask(null);
                    onSyncGoogleCalendar(t);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors min-h-[44px]"
                >
                  <CalendarIcon className="h-4 w-4 text-emerald-500" />
                  <span>Add to Google Calendar</span>
                </button>

                <button
                  onClick={() => {
                    const t = activeActionSheetTask;
                    setActiveActionSheetTask(null);
                    onExportIcs(t);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors min-h-[44px]"
                >
                  <Download className="h-4 w-4 text-indigo-500" />
                  <span>Export Apple / iCal (.ics)</span>
                </button>

                <button
                  onClick={() => {
                    const id = activeActionSheetTask.id;
                    setActiveActionSheetTask(null);
                    onDeleteTask(id);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-xs transition-colors min-h-[44px]"
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                  <span>Delete Task Permanently</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileTaskManager;
