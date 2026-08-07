import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { SkeletonCard } from '../components/SkeletonLoaders';
import { getRelativeDeadline, formatDate } from '../utils/dateUtils';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { EmptyState } from '../components/EmptyState';
import { InteractiveCard } from '../components/InteractiveCard';
import { MotionButton } from '../components/MotionButton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  AlertTriangle, CheckCircle, Clock, BookOpen, ArrowUpRight, Plus, Sparkles, TrendingUp, CalendarDays, Flame, Brain, Target, Compass
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/tasks'),
      api.get('/auth/profile').catch(() => ({ data: null }))
    ])
      .then(([tasksRes, profileRes]) => {
        setTasks(tasksRes.data || []);
        setProfile(profileRes.data || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Compute time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Student';

  const pending = tasks.filter(t => t.status !== 'completed');
  const highPriority = pending.filter(t => t.priority === 'high');
  const totalMinutes = pending.reduce((sum, t) => sum + (t.estimated_minutes || 60), 0);
  const completedCount = tasks.length - pending.length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Next most urgent deadline
  const sortedPending = [...pending].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  const nextUrgentTask = sortedPending[0];

  // Subject Chart Aggregation
  const subjectMap: Record<string, number> = {};
  pending.forEach(t => {
    const subj = t.subject || 'General';
    subjectMap[subj] = (subjectMap[subj] || 0) + 1;
  });
  const subjectChartData = Object.keys(subjectMap).map(k => ({ name: k, value: subjectMap[k] }));
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Priority Chart Aggregation
  const priorityChartData = [
    { name: 'High', tasks: pending.filter(t => t.priority === 'high').length, fill: '#ef4444' },
    { name: 'Medium', tasks: pending.filter(t => t.priority === 'medium').length, fill: '#f59e0b' },
    { name: 'Low', tasks: pending.filter(t => t.priority === 'low').length, fill: '#10b981' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* PART 1: Top Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950/80 to-indigo-950/90 border border-slate-800 p-8 lg:p-10 overflow-hidden shadow-2xl"
      >
        {/* Ambient Glow Backdrop */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              <span>FLOW Academic Intelligence</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
              {getGreeting()}, <span className="bg-gradient-to-r from-brand-400 to-indigo-300 bg-clip-text text-transparent">{userName}</span>
            </h1>
            <p className="text-slate-400 text-sm lg:text-base font-medium max-w-lg">
              Let's make today productive. Here is your real-time academic execution status.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/ingest">
              <MotionButton variant="primary" icon={<Sparkles className="h-4 w-4" />}>
                Ingest Syllabus
              </MotionButton>
            </Link>
            <Link to="/tasks">
              <MotionButton variant="secondary" icon={<Plus className="h-4 w-4" />}>
                Add Task
              </MotionButton>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Study Streak */}
          <InteractiveCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">🔥 Study Streak</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Flame className="h-5 w-5 animate-pulse" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
              <AnimatedCounter value={5} /> <span className="text-sm font-normal text-slate-500 dark:text-slate-400">Days</span>
            </div>
            <p className="text-xs text-amber-500 font-semibold">🔥 Active 5-day focus streak</p>
          </InteractiveCard>

          {/* 2. Pending Tasks */}
          <InteractiveCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">📚 Pending Tasks</span>
              <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              <AnimatedCounter value={pending.length} /> <span className="text-sm font-normal text-slate-500 dark:text-slate-400">Tasks</span>
            </div>
            <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold">{highPriority.length} High Priority Commitments</p>
          </InteractiveCard>

          {/* 3. Next Deadline */}
          <InteractiveCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">⏰ Next Deadline</span>
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {nextUrgentTask ? nextUrgentTask.title : 'No Urgent Deadlines'}
            </div>
            <p className="text-xs text-rose-500 font-semibold truncate">
              {nextUrgentTask ? `${getRelativeDeadline(nextUrgentTask.deadline).label} (${nextUrgentTask.subject})` : 'All clear!'}
            </p>
          </InteractiveCard>

          {/* 4. AI Focus Score */}
          <InteractiveCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">🧠 AI Focus Score</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Brain className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              <AnimatedCounter value={Math.min(completionRate + 15, 98)} suffix="%" />
            </div>
            <p className="text-xs text-emerald-500 font-semibold">Top 5% Student Execution</p>
          </InteractiveCard>
        </div>
      )}

      {/* PART 1: Today's Recommendation Banner */}
      {!loading && nextUrgentTask && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-2xl bg-gradient-to-r from-brand-50/80 via-white to-orange-50/80 dark:from-brand-950/60 dark:via-slate-900 dark:to-indigo-950/60 border border-brand-500/30 p-6 shadow-sm dark:shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-600 dark:text-brand-300 border border-brand-500/30 shrink-0">
                <Target className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Today's Recommendation</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Study {nextUrgentTask.subject}: {nextUrgentTask.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">⏰ Deadline: {getRelativeDeadline(nextUrgentTask.deadline).label}</span>
                  <span>•</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">🔥 Priority: {nextUrgentTask.priority.toUpperCase()}</span>
                  <span>•</span>
                  <span className="text-slate-700 dark:text-slate-300">⏱️ Est. Time: {nextUrgentTask.estimated_minutes || 60} Mins</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <MotionButton
                variant="primary"
                onClick={() => navigate('/planner')}
                icon={<Compass className="h-4 w-4" />}
              >
                Start Studying
              </MotionButton>
              <span className="text-[11px] font-medium text-slate-500">Generated by IMvision</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Deadlines List */}
        <div className="lg:col-span-2 card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Upcoming Deadlines
            </h2>
            <Link to="/tasks" className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium">
              <span>View all tasks</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pending.slice(0, 5).map(task => {
              const rel = getRelativeDeadline(task.deadline);
              return (
                <div key={task.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {task.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="font-medium">{task.subject}</span>
                      <span>•</span>
                      <span className={rel.isOverdue ? 'text-red-500 font-semibold' : rel.isUrgent ? 'text-amber-500 font-medium' : ''}>
                        {rel.label} ({formatDate(task.deadline)})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge type="priority" value={task.priority} />
                    <StatusBadge type="taskType" value={task.task_type || 'assignment'} />
                  </div>
                </div>
              );
            })}

            {pending.length === 0 && !loading && (
              <EmptyState
                icon={CalendarDays}
                title="No Pending Tasks"
                description="You are all caught up! Upload a new syllabus or create a manual task to schedule your workload."
                actionLabel="Create First Task"
                onAction={() => navigate('/tasks')}
              />
            )}
          </div>
        </div>

        {/* Tasks by Subject Donut Chart */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Subject Workload
          </h2>
          {subjectChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {subjectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No subject data
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
