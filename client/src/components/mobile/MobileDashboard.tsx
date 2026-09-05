import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Flame, 
  BookOpen, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  Plus, 
  Upload, 
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileDashboardProps {
  user: any;
  tasks: any[];
  studyPlan: any;
  onToggleTask: (taskId: string, currentStatus: string) => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  user,
  tasks,
  studyPlan,
  onToggleTask
}) => {
  const navigate = useNavigate();

  // Determine greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || 'Scholar';

  // Metrics
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Sorted upcoming tasks (nearest deadline first)
  const sortedUpcoming = [...pendingTasks].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  
  // Highest priority today focus task
  const topFocusTask = sortedUpcoming.find(t => t.priority === 'urgent' || t.priority === 'high') || sortedUpcoming[0];

  // Tasks due soon (within next 48h)
  const now = new Date().getTime();
  const dueSoonTasks = pendingTasks.filter(t => {
    const d = new Date(t.deadline).getTime();
    return d - now <= 48 * 60 * 60 * 1000 && d - now >= -24 * 60 * 60 * 1000;
  });

  // Calculate day streak
  const streakDays = Math.max(1, completedTasks.length > 0 ? (completedTasks.length % 14) + 3 : 5);

  const formatRelativeDeadline = (deadlineStr: string) => {
    const d = new Date(deadlineStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Due Today';
    if (isTomorrow) return 'Due Tomorrow';
    return `Due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="space-y-5 pb-6">
      {/* 1. Header Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-1 px-0.5 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>{greeting}, {firstName}</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Let's make today productive.
          </p>
        </div>

        <Link
          to="/ingest"
          className="p-2.5 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 flex items-center justify-center shadow-xs"
          title="Upload Syllabus"
        >
          <Upload className="h-4 w-4" />
        </Link>
      </motion.div>

      {/* 2. TODAY'S FOCUS HERO CARD */}
      {topFocusTask ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 text-white border border-slate-800 shadow-xl shadow-slate-950/30"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-orange-500 text-white shadow-xs">
                  TODAY'S FOCUS
                </span>
                <span className="text-[11px] font-semibold text-slate-300">
                  {topFocusTask.subject || 'General'}
                </span>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-orange-300 border border-white/10 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeDeadline(topFocusTask.deadline)}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-white tracking-tight leading-snug">
                {topFocusTask.title}
              </h2>
              {topFocusTask.description && (
                <p className="text-xs text-slate-300/80 line-clamp-1 leading-relaxed">
                  {topFocusTask.description}
                </p>
              )}
            </div>

            <div className="pt-1 flex items-center gap-2.5">
              <button
                onClick={() => navigate('/planner')}
                className="flex-1 py-2.5 px-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all min-h-[44px]"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start Studying</span>
              </button>

              <button
                onClick={() => onToggleTask(topFocusTask.id, topFocusTask.status)}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white border border-white/15 flex items-center justify-center min-h-[44px] min-w-[44px]"
                title="Mark Completed"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">All Caught Up!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">No pending assignments due today.</p>
          </div>
          <Link to="/tasks" className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:underline">
            <Plus className="h-3.5 w-3.5" />
            <span>Create a new task</span>
          </Link>
        </div>
      )}

      {/* 3. QUICK STATS 3-CARD ROW */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-2.5"
      >
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[72px]">
          <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
            <Flame className="h-3.5 w-3.5 fill-current" />
            <span>Streak</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
            {streakDays} <span className="text-[10px] font-semibold text-slate-400">days</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[72px]">
          <div className="flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Tasks</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
            {pendingTasks.length} <span className="text-[10px] font-semibold text-slate-400">left</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[72px]">
          <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Due Soon</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
            {dueSoonTasks.length} <span className="text-[10px] font-semibold text-slate-400">tasks</span>
          </div>
        </div>
      </motion.div>

      {/* 4. ACADEMIC RECOMMENDATION CARD */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-3xl p-4 bg-gradient-to-tr from-orange-500/10 via-amber-500/10 to-indigo-500/10 dark:from-orange-950/30 dark:via-slate-900 dark:to-indigo-950/30 border border-orange-500/25 shadow-sm space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Study Recommendation
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {topFocusTask
            ? `Focus on "${topFocusTask.subject || topFocusTask.title}" today because your deadline is ${formatRelativeDeadline(topFocusTask.deadline).toLowerCase()}.`
            : "You're all caught up on urgent deadlines! Review your upcoming syllabus topics or generate an optimized study plan."}
        </p>

        <button
          onClick={() => navigate('/planner')}
          className="w-full py-2 px-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5 hover:bg-white dark:hover:bg-slate-800 transition-colors min-h-[38px]"
        >
          <span>View Study Plan</span>
          <ArrowRight className="h-3.5 w-3.5 text-orange-500" />
        </button>
      </motion.div>

      {/* 5. UPCOMING (Next 3 tasks only) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            UPCOMING TASKS
          </h3>
          <Link
            to="/tasks"
            className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
          >
            <span>View All ({tasks.length})</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {sortedUpcoming.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => onToggleTask(task.id, task.status)}
                  className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-orange-500 text-slate-400 hover:text-orange-500 shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center"
                  title="Complete Task"
                >
                  <div className="h-3.5 w-3.5 rounded-sm border border-slate-400 dark:border-slate-600" />
                </button>

                <div className="min-w-0 space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-brand-600 dark:text-brand-400">{task.subject || 'General'}</span>
                    <span>•</span>
                    <span>{formatRelativeDeadline(task.deadline)}</span>
                  </div>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 uppercase tracking-tight ${
                task.priority === 'urgent' || task.priority === 'high'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {task.priority || 'Normal'}
              </span>
            </div>
          ))}

          {sortedUpcoming.length === 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              No upcoming tasks pending.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
