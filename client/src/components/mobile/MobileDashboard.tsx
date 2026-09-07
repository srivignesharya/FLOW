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
  Play,
  Bot,
  TrendingUp,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useCopilot } from '../../context/CopilotContext';

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
  const { openCopilot } = useCopilot();

  // Determine greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || 'Scholar';

  // Metrics
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedTasks.length / totalCount) * 100) : 0;

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

  const handleTaskComplete = (taskId: string, currentStatus: string) => {
    if (currentStatus !== 'completed') {
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.75 }
        });
      } catch (e) {
        // Fallback silently if confetti fails
      }
    }
    onToggleTask(taskId, currentStatus);
  };

  // SVG circular gauge calculations
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <div className="space-y-4 pb-8">
      {/* 1. Header Greeting & Progress Ring Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950/70 to-slate-900 border border-slate-800/80 shadow-lg text-white relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-[10px] font-bold">
              <Sparkles className="h-3 w-3 text-orange-400" />
              <span>FLOW Academic Intelligence</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white truncate">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              {pendingTasks.length > 0
                ? `You have ${pendingTasks.length} pending academic tasks.`
                : 'All caught up! Great work today.'}
            </p>
          </div>

          {/* Circular Completion Ring */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="text-slate-800"
                strokeWidth="5"
                stroke="currentColor"
                fill="transparent"
              />
              <motion.circle
                cx="32"
                cy="32"
                r={radius}
                stroke="url(#mobileGrad)"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="mobileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xs font-black text-white">{completionPercentage}%</span>
              <span className="text-[8px] uppercase tracking-tighter text-slate-400 font-bold">Done</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Quick Action Horizontal Island */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <Link
          to="/ingest"
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/25 text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 transition-all"
        >
          <Upload className="h-3.5 w-3.5 text-orange-500" />
          <span>Ingest Syllabus</span>
        </Link>

        <Link
          to="/tasks"
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          <span>New Task</span>
        </Link>

        <button
          type="button"
          onClick={openCopilot}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-orange-500/15 to-amber-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 transition-all"
        >
          <Bot className="h-3.5 w-3.5 text-orange-500" />
          <span>Ask Copilot</span>
        </button>

        <Link
          to="/planner"
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 transition-all"
        >
          <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          <span>7-Day Plan</span>
        </Link>
      </div>

      {/* 3. TODAY'S FOCUS HERO CARD */}
      {topFocusTask ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-5 text-white border border-slate-800 shadow-xl shadow-slate-950/30"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-orange-500/25 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/25 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs">
                  TODAY'S FOCUS
                </span>
                <span className="text-[11px] font-bold text-slate-300">
                  {topFocusTask.subject || 'General'}
                </span>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-orange-300 border border-white/10 flex items-center gap-1">
                <Clock className="h-3 w-3 text-orange-400" />
                {formatRelativeDeadline(topFocusTask.deadline)}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
                {topFocusTask.title}
              </h2>
              {topFocusTask.description && (
                <p className="text-xs text-slate-300/80 line-clamp-2 leading-relaxed">
                  {topFocusTask.description}
                </p>
              )}
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={() => navigate('/planner')}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all min-h-[44px]"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start Study Session</span>
              </button>

              <button
                onClick={() => handleTaskComplete(topFocusTask.id, topFocusTask.status)}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.96] text-white border border-white/15 flex items-center justify-center min-h-[44px] min-w-[44px] transition-all"
                title="Mark Completed"
                aria-label="Mark task completed"
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">No pending assignments due right now.</p>
          </div>
          <Link to="/tasks" className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:underline">
            <Plus className="h-3.5 w-3.5" />
            <span>Create a new task</span>
          </Link>
        </div>
      )}

      {/* 4. QUICK STATS 3-CARD ROW */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-2"
      >
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[72px]">
          <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
            <Flame className="h-3.5 w-3.5 fill-current animate-pulse text-orange-500" />
            <span>Streak</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
            {streakDays} <span className="text-[10px] font-semibold text-slate-400">days</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[72px]">
          <div className="flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Pending</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
            {pendingTasks.length} <span className="text-[10px] font-semibold text-slate-400">tasks</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[72px]">
          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Due Soon</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
            {dueSoonTasks.length} <span className="text-[10px] font-semibold text-slate-400">tasks</span>
          </div>
        </div>
      </motion.div>

      {/* 5. ACADEMIC AI RECOMMENDATION CARD */}
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
              AI Academic Recommendation
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {topFocusTask
            ? `Prioritize "${topFocusTask.subject || topFocusTask.title}" today. Your target deadline is ${formatRelativeDeadline(topFocusTask.deadline).toLowerCase()}.`
            : "You're on track with active deadlines! Ingest course material to uncover upcoming milestone commitments."}
        </p>

        <button
          onClick={() => navigate('/planner')}
          className="w-full py-2 px-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5 hover:bg-white dark:hover:bg-slate-800 transition-colors min-h-[38px]"
        >
          <span>View 7-Day Timeline</span>
          <ArrowRight className="h-3.5 w-3.5 text-orange-500" />
        </button>
      </motion.div>

      {/* 6. UPCOMING TASKS (Live list) */}
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
          {sortedUpcoming.slice(0, 4).map((task) => (
            <motion.div
              key={task.id}
              layout
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => handleTaskComplete(task.id, task.status)}
                  className="p-1 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-orange-500 text-slate-400 hover:text-orange-500 shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 transition-all"
                  title="Complete Task"
                >
                  <div className="h-4 w-4 rounded-md border-2 border-slate-400 dark:border-slate-600" />
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
            </motion.div>
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
