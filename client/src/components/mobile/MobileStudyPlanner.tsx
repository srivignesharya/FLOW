import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  ChevronRight, 
  RotateCw,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

interface StudyBlock {
  id?: string;
  taskTitle: string;
  subject: string;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  focusGoal?: string;
  completed?: boolean;
  priority?: string;
}

interface DayPlan {
  day: string;
  date?: string;
  totalAllocatedMinutes: number;
  blocks: StudyBlock[];
}

interface MobileStudyPlannerProps {
  plan: {
    scheduleSummary?: string;
    dailyPlans: DayPlan[];
  } | null;
  loading: boolean;
  generating: boolean;
  onGenerate: () => void;
  onToggleBlock: (dayIndex: number, blockId: string, currentStatus: boolean) => void;
}

export const MobileStudyPlanner: React.FC<MobileStudyPlannerProps> = ({
  plan,
  loading,
  generating,
  onGenerate,
  onToggleBlock
}) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  if (loading || generating) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-3xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto animate-pulse">
          <Sparkles className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Generating Study Plan...</h3>
          <p className="text-xs text-slate-400">Optimizing cognitive workload & deadline distribution</p>
        </div>
      </div>
    );
  }

  if (!plan || !plan.dailyPlans || plan.dailyPlans.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
          <CalendarIcon className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Study Plan Generated</h3>
          <p className="text-xs text-slate-400">Generate a smart 7-day plan from your active commitments.</p>
        </div>
        <button
          onClick={onGenerate}
          className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/25"
        >
          <Sparkles className="h-4 w-4" />
          <span>Generate 7-Day Plan</span>
        </button>
      </div>
    );
  }

  const currentDayPlan = plan.dailyPlans[selectedDayIdx] || plan.dailyPlans[0];

  return (
    <div className="space-y-4 pb-6">
      {/* 1. Header & Regenerate */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Study Planner
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">7-Day Intelligent Timeline</p>
        </div>

        <button
          onClick={onGenerate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-xs hover:border-orange-500 min-h-[36px]"
        >
          <RotateCw className="h-3.5 w-3.5 text-orange-500" />
          <span>Regenerate</span>
        </button>
      </div>

      {/* 2. Horizontal Day Selector Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {plan.dailyPlans.map((day, idx) => {
          const isSelected = idx === selectedDayIdx;
          const dayName = day.day.split(',')[0] || day.day;

          return (
            <button
              key={idx}
              onClick={() => setSelectedDayIdx(idx)}
              className={`flex flex-col items-center py-2 px-3.5 rounded-2xl transition-all select-none shrink-0 min-w-[64px] ${
                isSelected
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                Day {idx + 1}
              </span>
              <span className="text-xs font-black truncate mt-0.5">
                {dayName.slice(0, 3)}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Daily Summary Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white border border-slate-800 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold">{currentDayPlan.day}</div>
            <div className="text-[11px] text-slate-400">{currentDayPlan.blocks?.length || 0} study blocks planned</div>
          </div>
        </div>

        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-white/10 text-orange-300 border border-white/10">
          {currentDayPlan.totalAllocatedMinutes} min total
        </span>
      </div>

      {/* 4. Vertical Connected Timeline */}
      <div className="relative pl-6 space-y-4 pt-1">
        {/* Continuous Vertical Line */}
        <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800" />

        {currentDayPlan.blocks?.map((block, bIdx) => {
          const isDone = !!block.completed;
          const startTime = block.startTime || '09:00 AM';

          return (
            <motion.div
              key={block.id || bIdx}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: bIdx * 0.05 }}
              className="relative"
            >
              {/* Timeline Node Icon / Dot */}
              <div className={`absolute -left-6 top-3.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors z-10 ${
                isDone
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : bIdx === 0
                  ? 'bg-orange-500 border-white dark:border-slate-950 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'
              }`}>
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-current" />
                )}
              </div>

              {/* Block Card */}
              <div className={`p-4 rounded-3xl border transition-all space-y-2.5 ${
                isDone
                  ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/80 opacity-60'
                  : bIdx === 0
                  ? 'bg-white dark:bg-slate-900 border-orange-500/40 shadow-md shadow-orange-500/5'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
              }`}>
                <div className="flex items-start justify-between gap-2.5">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400">
                        {startTime}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {block.durationMinutes} min
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold text-slate-900 dark:text-white pt-1 ${
                      isDone ? 'line-through text-slate-400' : ''
                    }`}>
                      {block.taskTitle}
                    </h4>

                    <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 block">
                      {block.subject}
                    </span>
                  </div>

                  {/* 44px Checkbox Toggle */}
                  <button
                    onClick={() => onToggleBlock(selectedDayIdx, block.id || `b-${bIdx}`, isDone)}
                    className={`p-2 rounded-xl border flex items-center justify-center transition-colors shrink-0 min-h-[40px] min-w-[40px] ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-orange-500 text-transparent'
                    }`}
                    title={isDone ? 'Mark Incomplete' : 'Complete Study Session'}
                    aria-label="Toggle study block"
                  >
                    <CheckCircle2 className={`h-5 w-5 ${isDone ? 'text-white' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>
                </div>

                {block.focusGoal && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-start gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{block.focusGoal}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {(!currentDayPlan.blocks || currentDayPlan.blocks.length === 0) && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No study sessions allocated for this day.
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileStudyPlanner;
