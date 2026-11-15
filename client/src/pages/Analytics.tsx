import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { SkeletonCard } from '../components/SkeletonLoaders';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { InteractiveCard } from '../components/InteractiveCard';
import { EmptyState } from '../components/EmptyState';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  BookOpen,
  CalendarDays,
  Award,
  AlertTriangle,
  GraduationCap,
  Target,
  Brain,
  Filter
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

export const Analytics: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month'>('all');
  const [loading, setLoading] = useState(true);

  const fetchRealTimeAnalytics = async () => {
    setLoading(true);
    try {
      const [tasksRes, examsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/study/exams').catch(() => ({ data: [] }))
      ]);

      setTasks(tasksRes.data || []);
      setExams(examsRes.data || []);
    } catch (err) {
      console.error('Failed to load real-time analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeAnalytics();
  }, []);

  // Filter tasks by timeRange
  const filteredTasks = useMemo(() => {
    if (timeRange === 'all') return tasks;
    const now = new Date();
    const daysLimit = timeRange === 'week' ? 7 : 30;
    const cutoff = new Date(now.getTime() - daysLimit * 24 * 60 * 60 * 1000);
    return tasks.filter(t => new Date(t.created_at || t.deadline) >= cutoff);
  }, [tasks, timeRange]);

  // Productivity Metrics
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = filteredTasks.filter(t => t.status !== 'completed');
  const now = new Date();
  const overdueTasks = pendingTasks.filter(t => t.deadline && new Date(t.deadline) < now).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Study Hours Calculation
  const totalEstimatedMinutes = filteredTasks.reduce((acc, t) => acc + (t.estimated_minutes || 60), 0);
  const completedMinutes = filteredTasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + (t.estimated_minutes || 60), 0);
  const hoursStudied = Number((completedMinutes / 60).toFixed(1));

  // Subject Aggregation
  const subjectMap: Record<string, { total: number; completed: number; minutes: number }> = {};
  filteredTasks.forEach(t => {
    const subj = t.subject || 'General';
    if (!subjectMap[subj]) subjectMap[subj] = { total: 0, completed: 0, minutes: 0 };
    subjectMap[subj].total += 1;
    if (t.status === 'completed') subjectMap[subj].completed += 1;
    subjectMap[subj].minutes += (t.estimated_minutes || 60);
  });

  const subjectData = Object.keys(subjectMap).map(name => ({
    name,
    count: subjectMap[name].total,
    completed: subjectMap[name].completed,
    hours: Number((subjectMap[name].minutes / 60).toFixed(1))
  }));

  const COLORS = ['#2563FF', '#00D4FF', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  // Priority Breakdown
  const priorityData = [
    { name: 'High Priority', count: filteredTasks.filter(t => t.priority === 'high').length, fill: '#ef4444' },
    { name: 'Medium Priority', count: filteredTasks.filter(t => t.priority === 'medium').length, fill: '#f59e0b' },
    { name: 'Low Priority', count: filteredTasks.filter(t => t.priority === 'low').length, fill: '#10b981' }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2.5 sm:gap-3">
            <BarChart3 className="h-6 sm:h-7 w-6 sm:w-7 text-[#00D4FF]" />
            <span>Academic Performance & Productivity Analytics</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Real-time telemetry grounded in your verified database records and exam milestones.
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          {(['all', 'week', 'month'] as const).map(pill => (
            <button
              key={pill}
              onClick={() => setTimeRange(pill)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                timeRange === pill
                  ? 'bg-gradient-to-r from-[#2563FF] to-[#00D4FF] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {pill === 'all' ? 'All Time' : pill === 'week' ? 'Past 7 Days' : 'Past 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            <InteractiveCard className="p-4 sm:p-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completion Rate</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                <AnimatedCounter value={completedTasks} />{' '}
                <span className="text-xs sm:text-sm font-normal text-slate-400">/ {totalTasks}</span>
              </div>
              <p className="text-[11px] text-emerald-500 font-bold">{completionRate}% Completed Tasks</p>
            </InteractiveCard>

            <InteractiveCard className="p-4 sm:p-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Study Velocity</span>
                <div className="p-2 rounded-xl bg-[#2563FF]/10 text-[#00D4FF] border border-[#2563FF]/20">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {hoursStudied} <span className="text-xs sm:text-sm font-normal text-slate-400">hrs</span>
              </div>
              <p className="text-[11px] text-[#00D4FF] font-medium">
                {Number((totalEstimatedMinutes / 60).toFixed(1))} Total Scheduled Hrs
              </p>
            </InteractiveCard>

            <InteractiveCard className="p-4 sm:p-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Exams</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <GraduationCap className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                <AnimatedCounter value={exams.length} /> <span className="text-xs sm:text-sm font-normal text-slate-400">Scheduled</span>
              </div>
              <p className="text-[11px] text-purple-400 font-medium">FLOW Study Active Modules</p>
            </InteractiveCard>

            <InteractiveCard className="p-4 sm:p-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue Alert</span>
                <div className={`p-2 rounded-xl ${overdueTasks > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-400'}`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className={`text-2xl sm:text-3xl font-extrabold ${overdueTasks > 0 ? 'text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                <AnimatedCounter value={overdueTasks} /> <span className="text-xs sm:text-sm font-normal text-slate-400">Overdue</span>
              </div>
              <p className={`text-[11px] font-medium ${overdueTasks > 0 ? 'text-rose-400' : 'text-emerald-500'}`}>
                {overdueTasks > 0 ? 'Urgent attention required' : 'All deadlines on track'}
              </p>
            </InteractiveCard>
          </div>

          {/* Academic Exam Preparation Progress Card */}
          {exams.length > 0 && (
            <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="h-4 sm:h-5 w-4 sm:w-5 text-[#00D4FF]" />
                <span>Upcoming Examination Preparation Radar</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {exams.map((ex) => {
                  const daysRemaining = Math.ceil((new Date(ex.exam_date).getTime() - Date.now()) / (1000 * 3600 * 24));
                  return (
                    <div key={ex.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{ex.subject}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2563FF]/15 text-[#00D4FF]">
                          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Today'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{ex.exam_name}</p>
                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Target: {ex.target_score || 85}%</span>
                        <span>Date: {new Date(ex.exam_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Charts Section */}
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No Analytics Data for This Period"
              description="Create academic tasks or upload course materials to generate real-time execution breakdowns and subject distribution charts."
              actionLabel="Add New Task"
              onAction={() => window.location.href = '/tasks'}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* Subject Distribution */}
              <InteractiveCard className="p-4 sm:p-6 space-y-4">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4 sm:h-5 w-4 sm:w-5 text-[#2563FF]" />
                  <span>Subject Focus Allocation</span>
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
                  <TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 text-[#00D4FF]" />
                  <span>Commitment Priority Distribution</span>
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

export default Analytics;
