import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  Circle,
  ExternalLink,
  Download,
  Plus
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';
import { formatDate } from '../utils/dateUtils';

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
}

interface UnifiedCalendarViewProps {
  tasks: Task[];
  onToggleStatus: (taskId: string, currentStatus: string) => void;
  onOpenQuickAdd: () => void;
}

export const UnifiedCalendarView: React.FC<UnifiedCalendarViewProps> = ({
  tasks,
  onToggleStatus,
  onOpenQuickAdd
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayIndex = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Group tasks by local date key: YYYY-MM-DD
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      if (!task.deadline) return;
      const d = new Date(task.deadline);
      // Format to YYYY-MM-DD in user's local timezone
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return map;
  }, [tasks]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Selected date key
  const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedDayTasks = tasksByDate.get(selectedKey) || [];

  const isToday = (dayNum: number) => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === dayNum;
  };

  const isSelected = (dayNum: number) => {
    return selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === dayNum;
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#111827] border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#2563FF]/15 text-[#00D4FF] flex items-center justify-center border border-[#2563FF]/30">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC]">
              Unified Academic Calendar
            </h3>
            <p className="text-xs text-[#94A3B8]">
              {tasks.length} synchronized assignments & commitments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-[#F8FAFC] transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1 border border-slate-800 rounded-xl p-0.5 bg-[#0B1020]">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-slate-800 transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-bold text-[#F8FAFC] min-w-[120px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-slate-800 transition-colors"
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid & Selected Day Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month Calendar Grid (2 cols on lg) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#111827] border border-slate-800">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#94A3B8] pb-3 border-b border-slate-800">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Days Cells */}
          <div className="grid grid-cols-7 gap-1.5 pt-3">
            {/* Empty offset padding for days before 1st */}
            {Array.from({ length: startingDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 sm:h-20 rounded-xl bg-slate-900/30 opacity-30" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayTasks = tasksByDate.get(dateKey) || [];
              const today = isToday(dayNum);
              const active = isSelected(dayNum);

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDate(new Date(year, month, dayNum))}
                  className={`h-16 sm:h-20 p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                    active
                      ? 'bg-[#2563FF]/20 border-[#00D4FF] shadow-sm shadow-[#2563FF]/20'
                      : today
                      ? 'bg-[#1E293B] border-[#2563FF]/40 text-[#00D4FF]'
                      : 'bg-[#0B1020]/70 border-slate-800/80 hover:border-slate-700 hover:bg-[#0B1020]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${
                      today ? 'text-[#00D4FF]' : active ? 'text-[#F8FAFC]' : 'text-slate-400'
                    }`}>
                      {dayNum}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 rounded-full bg-[#2563FF]/20 text-[#00D4FF]">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Indicators */}
                  <div className="space-y-0.5 overflow-hidden">
                    {dayTasks.slice(0, 2).map((t, idx) => (
                      <div
                        key={idx}
                        className={`text-[9px] truncate px-1 rounded font-medium ${
                          t.status === 'completed'
                            ? 'line-through text-slate-500 bg-slate-800/40'
                            : t.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-[#2563FF]/20 text-[#93c5fd]'
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <span className="text-[9px] text-[#94A3B8] font-bold block text-right">
                        +{dayTasks.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Task Detail Panel */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-[#F8FAFC]">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </h4>
                <p className="text-xs text-[#94A3B8]">
                  {selectedDayTasks.length} task{selectedDayTasks.length === 1 ? '' : 's'} scheduled
                </p>
              </div>

              <button
                onClick={onOpenQuickAdd}
                className="p-1.5 rounded-lg bg-[#2563FF]/15 text-[#00D4FF] hover:bg-[#2563FF]/25 border border-[#2563FF]/30 transition-colors"
                title="Quick Add Task for this day"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* List of Tasks for Selected Day */}
            <div className="divide-y divide-slate-800/80 max-h-[360px] overflow-y-auto mt-2 space-y-1">
              {selectedDayTasks.map(task => (
                <div key={task.id} className="py-3 flex items-start gap-2.5">
                  <button
                    onClick={() => onToggleStatus(task.id, task.status)}
                    className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold ${
                      task.status === 'completed' ? 'line-through text-slate-500' : 'text-[#F8FAFC]'
                    }`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[#00D4FF] font-medium">{task.subject}</span>
                      <StatusBadge type="priority" value={task.priority} />
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={getGoogleCalendarUrl(task)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-[#94A3B8] hover:text-[#00D4FF] transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Google Cal</span>
                      </a>
                      <button
                        onClick={() => downloadIcsFile(task)}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-[#94A3B8] hover:text-[#00D4FF] transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        <span>.ICS</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {selectedDayTasks.length === 0 && (
                <div className="py-12 text-center text-xs text-[#94A3B8] space-y-2">
                  <CalendarIcon className="h-8 w-8 mx-auto opacity-40 text-slate-500" />
                  <p>No deadlines scheduled for this day.</p>
                  <button
                    onClick={onOpenQuickAdd}
                    className="text-xs text-[#00D4FF] font-bold hover:underline"
                  >
                    + Add a task
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-[#94A3B8] text-center">
            Dates displayed in local timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </div>
        </div>
      </div>
    </div>
  );
};
export default UnifiedCalendarView;
