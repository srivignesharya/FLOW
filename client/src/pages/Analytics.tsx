import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { SkeletonCard } from '../components/SkeletonLoaders';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { InteractiveCard } from '../components/InteractiveCard';
import { EmptyState } from '../components/EmptyState';
import {
  BarChart3, TrendingUp, Flame, Clock, CheckCircle2, BookOpen, CalendarDays, Award
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

export const Analytics: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRealTimeAnalytics = async () => {
    setLoading(true);
    try {
      const [tasksRes, scheduleRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/planner/current').catch(() => ({ data: null }))
      ]);

      setTasks(tasksRes.data || []);
      setSchedule(scheduleRes.data || null);
    } catch (err) {
      console.error('Failed to load real-time analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeAnalytics();
  }, []);

  // Compute live calculations directly from database state
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate live study hours
  const totalEstimatedMinutes = tasks.reduce((acc, t) => acc + (t.estimated_minutes || 60), 0);
  const completedMinutes = tasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + (t.estimated_minutes || 60), 0);
  const hoursStudied = Number((completedMinutes / 60).toFixed(1));

  // Subject Breakdown Aggregation
  const subjectMap: Record<string, number> = {};
  tasks.forEach(t => {
    const subj = t.subject || 'General';
    subjectMap[subj] = (subjectMap[subj] || 0) + 1;
  });

  const subjectData = Object.keys(subjectMap).map(name => ({
    name,
    count: subjectMap[name]
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Priority Breakdown
  const priorityData = [
    { name: 'High Priority', count: tasks.filter(t => t.priority === 'high').length, fill: '#ef4444' },
    { name: 'Medium Priority', count: tasks.filter(t => t.priority === 'medium').length, fill: '#f59e0b' },
    { name: 'Low Priority', count: tasks.filter(t => t.priority === 'low').length, fill: '#10b981' }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2.5 sm:gap-3">
          <BarChart3 className="h-6 sm:h-7 w-6 sm:w-7 text-brand-500" />
          <span>Real-Time Academic Analytics</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
          Live synchronized study velocity, subject breakdowns, and execution metrics directly from your database.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* Live Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            <InteractiveCard className="p-3.5 sm:p-5 space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Completed</span>
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <CheckCircle2 className="h-4 sm:h-5 w-4 sm:w-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                <AnimatedCounter value={completedTasks} />{' '}
                <span className="text-xs sm:text-sm font-normal text-slate-400">/ {totalTasks}</span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-500 font-medium truncate">{completionRate}% Completion</p>
            </InteractiveCard>

            <InteractiveCard className="p-3.5 sm:p-5 space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Hours</span>
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                  <Clock className="h-4 sm:h-5 w-4 sm:w-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {hoursStudied} <span className="text-xs sm:text-sm font-normal text-slate-400">hrs</span>
              </div>
              <p className="text-[11px] sm:text-xs text-indigo-500 font-medium truncate">
                {Number((totalEstimatedMinutes / 60).toFixed(1))} Total Est. Hrs
              </p>
            </InteractiveCard>

            <InteractiveCard className="p-3.5 sm:p-5 space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Pending</span>
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 shrink-0">
                  <BookOpen className="h-4 sm:h-5 w-4 sm:w-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                <AnimatedCounter value={pendingTasks.length} /> <span className="text-xs sm:text-sm font-normal text-slate-400">Tasks</span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-500 font-medium truncate">Synced with Tasks</p>
            </InteractiveCard>

            <InteractiveCard className="p-3.5 sm:p-5 space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Courses</span>
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0">
                  <Award className="h-4 sm:h-5 w-4 sm:w-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                <AnimatedCounter value={subjectData.length} /> <span className="text-xs sm:text-sm font-normal text-slate-400">Total</span>
              </div>
              <p className="text-[11px] sm:text-xs text-brand-600 dark:text-brand-400 font-medium truncate">Live Ingest</p>
            </InteractiveCard>
          </div>

          {/* Charts Section */}
          {tasks.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No Analytics Data Available"
              description="Upload course documents or create tasks to automatically generate live analytical insights, breakdown charts, and study velocity metrics."
              actionLabel="Ingest First Syllabus"
              onAction={() => window.location.href = '/ingest'}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* Subject Distribution */}
              <InteractiveCard className="p-4 sm:p-6 space-y-4">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4 sm:h-5 w-4 sm:w-5 text-brand-500" />
                  <span>Subject Focus Breakdown</span>
                </h3>
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subjectData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={5}
                      >
                        {subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </InteractiveCard>

              {/* Priority Workload Distribution */}
              <InteractiveCard className="p-4 sm:p-6 space-y-4">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 text-indigo-400" />
                  <span>Task Priority Distribution</span>
                </h3>
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {priorityData.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </InteractiveCard>
            </div>
          )}
        </>
      )}
    </div>
  );
};
