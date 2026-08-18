import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { AiThinkingOverlay } from '../components/AiThinkingOverlay';
import { triggerCelebration, showToast } from '../components/ToastContainer';
import { SkeletonCard } from '../components/SkeletonLoaders';
import { StatusBadge } from '../components/StatusBadge';
import { Sparkles, Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw, Layers, CheckSquare, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudyPlanner: React.FC = () => {
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchCurrentSchedule = async () => {
    setLoading(true);
    try {
      const res = await api.get('/planner/current');
      setSchedule(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load study schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentSchedule();
  }, []);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await api.post('/planner/generate');
      setSchedule(res.data);
      triggerCelebration();
      showToast('New 7-day study plan generated with Gemini AI!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to generate study plan with Gemini.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleBlockCompletion = async (dayIndex: number, blockId: string, currentCompleted: boolean) => {
    const nextCompleted = !currentCompleted;

    // Optimistic UI update
    setSchedule((prev: any) => {
      if (!prev?.generated_plan?.dailyPlans) return prev;
      const updatedPlans = [...prev.generated_plan.dailyPlans];
      if (updatedPlans[dayIndex]) {
        const blocks = [...updatedPlans[dayIndex].blocks];
        const blockIdx = blocks.findIndex(b => b.id === blockId);
        if (blockIdx !== -1) {
          blocks[blockIdx] = { ...blocks[blockIdx], completed: nextCompleted };
        }
        updatedPlans[dayIndex] = { ...updatedPlans[dayIndex], blocks };
      }
      return {
        ...prev,
        generated_plan: { ...prev.generated_plan, dailyPlans: updatedPlans }
      };
    });

    try {
      await api.patch('/planner/toggle-block', {
        dayIndex,
        blockId,
        completed: nextCompleted
      });
      showToast(nextCompleted ? 'Study block completed!' : 'Study block reopened', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save block completion status', 'error');
      fetchCurrentSchedule(); // rollback
    }
  };

  const plan = schedule?.generated_plan;

  return (
    <div className="space-y-8 animate-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
            <span>AI Study Planner</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-900/50">
              Gemini 2.5 Engine
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Generates an optimized 7-day study breakdown tailored to your active task deadlines, priorities, and daily capacity.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {schedule ? (
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="btn-secondary flex items-center gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Regenerating Plan...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Regenerate Plan</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="btn-primary flex items-center gap-2 shadow-indigo-600/30 bg-indigo-600 hover:bg-indigo-500"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>IMvision is analysing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Study Plan</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/80 text-red-400 text-xs rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {generating ? (
        <AiThinkingOverlay />
      ) : loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : plan ? (
        <div className="space-y-5 sm:space-y-6">
          {/* Strategy Summary Card */}
          <div className="card p-4 sm:p-6 bg-gradient-to-r from-brand-950/40 via-slate-900 to-indigo-950/40 border-brand-900/50">
            <h3 className="font-bold text-xs text-brand-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span>Strategic Weekly Overview</span>
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {plan.scheduleSummary}
            </p>
          </div>

          {/* Daily Plans Timeline */}
          <div className="space-y-4 sm:space-y-6">
            {plan.dailyPlans?.map((dayPlan: any, dayIdx: number) => (
              <div key={dayIdx} className="card p-4 sm:p-6 space-y-3 sm:space-y-4 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-2 sm:p-2.5 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-xl font-bold shrink-0">
                      <Calendar className="h-4 sm:h-5 w-4 sm:w-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                        {dayPlan.day}
                      </span>
                      <span className="block text-[11px] text-slate-400">Day {dayIdx + 1} of 7</span>
                    </div>
                  </div>

                  <span className="text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 self-start sm:self-auto">
                    <Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    {dayPlan.totalAllocatedMinutes} min total
                  </span>
                </div>

                {/* Blocks Grid / Vertical Timeline on Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {dayPlan.blocks?.map((block: any, bIdx: number) => (
                    <div
                      key={block.id || bIdx}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all space-y-2.5 sm:space-y-3 ${
                        block.completed
                          ? 'bg-slate-900/30 border-emerald-900/40 opacity-70'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-brand-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <button
                            onClick={() => handleToggleBlockCompletion(dayIdx, block.id || `b-${bIdx}`, !!block.completed)}
                            className={`p-2 rounded-lg border flex items-center justify-center transition-colors shrink-0 min-h-[38px] min-w-[38px] ${
                              block.completed
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-400 dark:border-slate-600 hover:border-brand-500 bg-white dark:bg-slate-900'
                            }`}
                            title="Mark study session completed"
                            aria-label="Toggle study block completion"
                          >
                            {block.completed ? <CheckCircle2 className="h-4 w-4" /> : <div className="h-4 w-4" />}
                          </button>
                          <div className="min-w-0">
                            <span className={`font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 block break-words ${block.completed ? 'line-through text-slate-400' : ''}`}>
                              {block.taskTitle}
                            </span>
                            <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">{block.subject}</span>
                          </div>
                        </div>

                        <StatusBadge type="priority" value={block.priority || 'medium'} />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          <Clock className="h-3 w-3" />
                          {block.startTime || '09:00 AM'} - {block.endTime || '10:00 AM'} ({block.durationMinutes} min)
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] sm:text-xs">{block.focusGoal}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="card p-6 sm:p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="p-3.5 sm:p-4 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit mx-auto">
            <Calendar className="h-7 sm:h-8 w-7 sm:w-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            No Pending Tasks Found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Upload assignments or create tasks to generate your personalized 7-day AI study schedule.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-2.5 sm:gap-3 pt-2">
            <Link to="/ingest" className="btn-primary flex items-center justify-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Ingest Syllabus</span>
            </Link>
            <Link to="/tasks" className="btn-secondary flex items-center justify-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span>Add Task</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

