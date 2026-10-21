import React, { useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  CheckSquare, 
  Plus, 
  Flame, 
  Target,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from './StatusBadge';
import { getRelativeDeadline, formatDate } from '../utils/dateUtils';
import { MotionButton } from './MotionButton';

interface Task {
  id: string;
  title: string;
  subject: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  task_type?: string;
  estimated_minutes?: number;
  description?: string;
  updated_at?: string;
}

interface SmartTodayViewProps {
  tasks: Task[];
  onToggleStatus: (taskId: string, currentStatus: string) => Promise<void> | void;
  onOpenQuickAdd: () => void;
  onNavigatePlanner: () => void;
  loading?: boolean;
}

export const SmartTodayView: React.FC<SmartTodayViewProps> = ({
  tasks,
  onToggleStatus,
  onOpenQuickAdd,
  onNavigatePlanner,
  loading = false
}) => {
  // Compute categorized task lists based on user local timezone
  const { overdueTasks, todayTasks, upcomingTasks, nextAction, completedTodayCount } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const in7Days = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

    const pending = tasks.filter(t => t.status !== 'completed');

    const overdue: Task[] = [];
    const dueToday: Task[] = [];
    const upcoming: Task[] = [];

    pending.forEach(t => {
      const d = new Date(t.deadline);
      if (d.getTime() < startOfToday.getTime()) {
        overdue.push(t);
      } else if (d.getTime() >= startOfToday.getTime() && d.getTime() <= endOfToday.getTime()) {
        dueToday.push(t);
      } else if (d.getTime() <= in7Days.getTime()) {
        upcoming.push(t);
      }
    });

    // Sort overdue by deadline asc (oldest first)
    overdue.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    // Sort today by deadline asc
    dueToday.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    // Sort upcoming by deadline asc
    upcoming.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    // Single Clear Next Action determination
    let clearAction: Task | null = null;
    if (overdue.length > 0) {
      // Prioritize high-priority overdue items
      const highOverdue = overdue.find(t => t.priority === 'high');
      clearAction = highOverdue || overdue[0];
    } else if (dueToday.length > 0) {
      const highToday = dueToday.find(t => t.priority === 'high');
      clearAction = highToday || dueToday[0];
    } else if (upcoming.length > 0) {
      clearAction = upcoming[0];
    }

    // Count tasks completed today
    const completedCount = tasks.filter(t => {
      if (t.status !== 'completed') return false;
      if (!t.updated_at) return false;
      const u = new Date(t.updated_at);
      return u.getTime() >= startOfToday.getTime() && u.getTime() <= endOfToday.getTime();
    }).length;

    return {
      overdueTasks: overdue,
      todayTasks: dueToday,
      upcomingTasks: upcoming,
      nextAction: clearAction,
      completedTodayCount: completedCount
    };
  }, [tasks]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="space-y-5">
      {/* 1. Header Bar with Date & Clear Next Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00D4FF] animate-pulse" />
            <h2 className="text-lg sm:text-xl font-black text-[#F8FAFC] tracking-tight">
              Smart Today View
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#2563FF]/15 text-[#00D4FF] border border-[#2563FF]/30">
              {todayFormatted}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Real-time unified priority synthesis across all your course commitments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQuickAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563FF]/15 hover:bg-[#2563FF]/25 text-[#00D4FF] border border-[#2563FF]/30 text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Quick Add</span>
          </button>
        </div>
      </div>

      {/* 2. Priority Next Action Banner (if exists) */}
      {nextAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl bg-gradient-to-r from-[#111827] via-[#161F36] to-[#111827] border border-[#2563FF]/40 p-4 sm:p-5 shadow-lg overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <button
                onClick={() => onToggleStatus(nextAction.id, nextAction.status)}
                className="mt-1 text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                title="Mark completed"
              >
                <Circle className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#2563FF]/20 text-[#00D4FF] border border-[#2563FF]/30">
                    Highest Priority Next Action
                  </span>
                  <StatusBadge type="priority" value={nextAction.priority} />
                </div>
                <h3 className="text-base font-bold text-[#F8FAFC] mt-1.5">
                  {nextAction.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#94A3B8]">
                  <span className="font-medium text-[#F8FAFC]">{nextAction.subject}</span>
                  <span>•</span>
                  <span className={new Date(nextAction.deadline) < new Date() ? 'text-rose-400 font-bold' : 'text-[#00D4FF] font-semibold'}>
                    ⏰ {getRelativeDeadline(nextAction.deadline).label} ({formatDate(nextAction.deadline)})
                  </span>
                  <span>•</span>
                  <span>⏱️ {nextAction.estimated_minutes || 60} mins</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <MotionButton
                variant="primary"
                onClick={onNavigatePlanner}
                icon={<Target className="h-4 w-4" />}
                className="text-xs"
              >
                Focus in Planner
              </MotionButton>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. Overdue Items Section (if any overdue) */}
      {overdueTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <AlertTriangle className="h-4 w-4" />
              <span>Overdue Commitments ({overdueTasks.length})</span>
            </div>
            <span className="text-[11px] text-rose-300 font-medium">Needs immediate resolution</span>
          </div>

          <div className="divide-y divide-rose-900/30">
            {overdueTasks.map(task => (
              <div key={task.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => onToggleStatus(task.id, task.status)}
                    className="text-rose-400 hover:text-emerald-400 transition-colors shrink-0"
                    title="Mark done"
                  >
                    <Circle className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#F8FAFC] truncate">{task.title}</p>
                    <p className="text-[11px] text-rose-400">
                      {task.subject} • Overdue since {formatDate(task.deadline)}
                    </p>
                  </div>
                </div>

                <StatusBadge type="priority" value={task.priority} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Due Today Section */}
      <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#F8FAFC] font-bold text-xs">
            <Clock className="h-4 w-4 text-[#00D4FF]" />
            <span>Due Today ({todayTasks.length})</span>
          </div>
          {completedTodayCount > 0 && (
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>{completedTodayCount} Completed Today</span>
            </span>
          )}
        </div>

        {todayTasks.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {todayTasks.map(task => (
              <div key={task.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => onToggleStatus(task.id, task.status)}
                    className="text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                    title="Mark done"
                  >
                    <Circle className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#F8FAFC] truncate">{task.title}</p>
                    <p className="text-[11px] text-[#94A3B8]">
                      {task.subject} • Due {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ~{task.estimated_minutes || 60}m
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge type="priority" value={task.priority} />
                  <StatusBadge type="taskType" value={task.task_type || 'assignment'} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-5 text-center text-xs text-[#94A3B8]">
            {completedTodayCount > 0 ? (
              <span className="text-emerald-400">🎉 All tasks for today are completed!</span>
            ) : (
              <span>No assignments due today. You are ahead of schedule!</span>
            )}
          </div>
        )}
      </div>

      {/* 5. Upcoming This Week (Next 7 Days) */}
      <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#F8FAFC] font-bold text-xs">
            <Calendar className="h-4 w-4 text-[#2563FF]" />
            <span>Upcoming Deadlines ({upcomingTasks.length})</span>
          </div>
          <span className="text-[11px] text-[#94A3B8]">Next 7 Days</span>
        </div>

        {upcomingTasks.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {upcomingTasks.slice(0, 5).map(task => (
              <div key={task.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => onToggleStatus(task.id, task.status)}
                    className="text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                    title="Mark done"
                  >
                    <Circle className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#F8FAFC] truncate">{task.title}</p>
                    <p className="text-[11px] text-[#94A3B8]">
                      {task.subject} • {getRelativeDeadline(task.deadline).label} ({formatDate(task.deadline)})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge type="priority" value={task.priority} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-[#94A3B8]">
            No upcoming deadlines in the next 7 days.
          </div>
        )}
      </div>
    </div>
  );
};
export default SmartTodayView;
