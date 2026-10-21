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
  AlertTriangle, CheckCircle, Clock, BookOpen, ArrowUpRight, Plus, Sparkles, TrendingUp, CalendarDays, Flame, Brain, Target, Compass, Search, Calendar as CalendarIcon, ListTodo
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { MobileDashboard } from '../components/mobile/MobileDashboard';
import { SmartTodayView } from '../components/SmartTodayView';
import { UnifiedCalendarView } from '../components/UnifiedCalendarView';
import { QuickAddModal } from '../components/QuickAddModal';
import { GlobalSearchModal } from '../components/GlobalSearchModal';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // View Switcher: 'today' | 'calendar' | 'overview'
  const [dashboardTab, setDashboardTab] = useState<'today' | 'calendar' | 'overview'>('today');

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navigate = useNavigate();

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardData = () => {
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
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Global Ctrl+K / Cmd+K listener for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
  const COLORS = ['#2563FF', '#00D4FF', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <>
      {/* Quick Add Global Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onTaskCreated={(newTask) => setTasks(prev => [newTask, ...prev])}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        tasks={tasks}
        onSelectTask={(task) => {
          navigate('/tasks');
        }}
      />

      {/* Dedicated Purpose-Built Mobile Dashboard (< md) */}
      <div className="md:hidden">
        <MobileDashboard
          user={user}
          tasks={tasks}
          studyPlan={null}
          onToggleTask={handleToggleTask}
        />
      </div>

      {/* Desktop Dashboard (>= md) */}
      <div className="hidden md:block space-y-6 sm:space-y-8 max-w-7xl mx-auto">
        {/* PART 1: Top Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0B1020] via-[#111827] to-[#161F36] border border-slate-800 p-5 sm:p-8 lg:p-10 overflow-hidden shadow-2xl"
        >
          {/* Ambient Astronomy Glow */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#2563FF]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#00D4FF]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#2563FF]/15 border border-[#2563FF]/30 text-[#00D4FF] text-[11px] sm:text-xs font-semibold">
                <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-[#00D4FF]" />
                <span>ZENITH v1.1 • by IMV</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                {getGreeting()}, <span className="bg-gradient-to-r from-[#2563FF] via-[#93c5fd] to-[#00D4FF] bg-clip-text text-transparent">{userName}</span>
              </h1>
              <p className="text-[#94A3B8] text-xs sm:text-sm lg:text-base font-medium max-w-lg">
                Reach Higher. Live Brighter. Here is your real-time academic execution status.
              </p>
            </div>

            <div className="flex flex-row flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Global Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#111827] hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] border border-slate-700/80 text-xs font-semibold transition-colors cursor-pointer"
                title="Search Workspace (Ctrl+K)"
              >
                <Search className="h-4 w-4 text-[#00D4FF]" />
                <span className="hidden lg:inline">Search (Ctrl+K)</span>
              </button>

              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" />
                <span>Quick Add</span>
              </button>

              <Link to="/ingest">
                <MotionButton variant="secondary" icon={<Sparkles className="h-4 w-4 text-[#00D4FF]" />}>
                  Ingest Syllabus
                </MotionButton>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {/* 1. Study Streak */}
            <InteractiveCard className="p-3.5 sm:p-5 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">🔥 Streak</span>
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                  <Flame className={`h-4 sm:h-5 w-4 sm:w-5 ${completedCount > 0 ? 'animate-pulse' : 'opacity-40'}`} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1">
                <AnimatedCounter value={completedCount > 0 ? Math.min(completedCount, 7) : 0} /> <span className="text-xs sm:text-sm font-normal text-slate-400">Days</span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-400 font-semibold truncate">
                {completedCount > 0 ? `🔥 Active ${Math.min(completedCount, 7)}d streak` : '⚡ Start streak today'}
              </p>
            </InteractiveCard>

            {/* 2. Pending Tasks */}
            <InteractiveCard className="p-3.5 sm:p-5 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">📚 Pending</span>
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#2563FF]/15 text-[#00D4FF] border border-[#2563FF]/30 shrink-0">
                  <Clock className="h-4 sm:h-5 w-4 sm:w-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                <AnimatedCounter value={pending.length} /> <span className="text-xs sm:text-sm font-normal text-slate-400">Tasks</span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#00D4FF] font-semibold truncate">{highPriority.length} High Priority</p>
            </InteractiveCard>

            {/* 3. Next Deadline */}
            <InteractiveCard className="p-3.5 sm:p-5 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">⏰ Deadline</span>
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                  <CalendarDays className="h-4 sm:h-5 w-4 sm:w-5" />
                </div>
              </div>
              <div className="text-sm sm:text-xl font-bold text-white truncate">
                {nextUrgentTask ? nextUrgentTask.title : 'All Clear!'}
              </div>
              <p className="text-[11px] sm:text-xs text-rose-400 font-semibold truncate">
                {nextUrgentTask ? `${getRelativeDeadline(nextUrgentTask.deadline).label}` : 'No deadlines'}
              </p>
            </InteractiveCard>

            {/* 4. Focus Score */}
            <InteractiveCard className="p-3.5 sm:p-5 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">🧠 Completion</span>
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                  <Brain className="h-4 sm:h-5 w-4 sm:w-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                <AnimatedCounter value={completionRate} suffix="%" />
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-400 font-semibold truncate">
                {totalTasks === 0 ? 'Upload syllabus' : `${completionRate}% Completed`}
              </p>
            </InteractiveCard>
          </div>
        )}

        {/* View Mode Toggle: Smart Today vs Calendar vs Workload Overview */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setDashboardTab('today')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              dashboardTab === 'today'
                ? 'bg-[#2563FF]/20 text-[#00D4FF] border border-[#2563FF]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ListTodo className="h-4 w-4" />
            <span>Smart Today View</span>
          </button>

          <button
            onClick={() => setDashboardTab('calendar')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              dashboardTab === 'calendar'
                ? 'bg-[#2563FF]/20 text-[#00D4FF] border border-[#2563FF]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Unified Calendar</span>
          </button>

          <button
            onClick={() => setDashboardTab('overview')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              dashboardTab === 'overview'
                ? 'bg-[#2563FF]/20 text-[#00D4FF] border border-[#2563FF]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Brain className="h-4 w-4" />
            <span>Workload Analytics</span>
          </button>
        </div>

        {/* Tab 1: Smart Today View (Phase 4A) */}
        {dashboardTab === 'today' && (
          <SmartTodayView
            tasks={tasks}
            onToggleStatus={handleToggleTask}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            onNavigatePlanner={() => navigate('/planner')}
            loading={loading}
          />
        )}

        {/* Tab 2: Unified Calendar View (Phase 4C) */}
        {dashboardTab === 'calendar' && (
          <UnifiedCalendarView
            tasks={tasks}
            onToggleStatus={handleToggleTask}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          />
        )}

        {/* Tab 3: Workload Overview Charts */}
        {dashboardTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Urgent Deadlines List */}
            <div className="lg:col-span-2 card p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Upcoming Deadlines
                </h2>
                <Link to="/tasks" className="text-xs text-[#00D4FF] hover:underline flex items-center gap-1 font-medium">
                  <span>View all tasks</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-800">
                {pending.slice(0, 5).map(task => {
                  const rel = getRelativeDeadline(task.deadline);
                  return (
                    <div key={task.id} className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-white truncate">
                          {task.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="font-medium text-[#00D4FF]">{task.subject}</span>
                          <span>•</span>
                          <span className={rel.isOverdue ? 'text-red-400 font-semibold' : rel.isUrgent ? 'text-amber-400 font-medium' : ''}>
                            {rel.label} ({formatDate(task.deadline)})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-start sm:self-auto">
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
                    onAction={() => setIsQuickAddOpen(true)}
                  />
                )}
              </div>
            </div>

            {/* Tasks by Subject Donut Chart */}
            <div className="card p-4 sm:p-6 space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Subject Workload
              </h2>
              {subjectChartData.length > 0 ? (
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subjectChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
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
                <div className="h-56 sm:h-64 flex items-center justify-center text-slate-400 text-xs">
                  No subject data
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
