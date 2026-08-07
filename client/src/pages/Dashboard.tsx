import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { SkeletonCard } from '../components/SkeletonLoaders';
import { getRelativeDeadline, formatDate } from '../utils/dateUtils';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { EmptyState } from '../components/EmptyState';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import {
  AlertTriangle, CheckCircle, Clock, BookOpen, ArrowUpRight, Plus, Sparkles, TrendingUp, CalendarDays
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks')
      .then(res => setTasks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pending = tasks.filter(t => t.status !== 'completed');
  const highPriority = pending.filter(t => t.priority === 'high');
  const totalMinutes = pending.reduce((sum, t) => sum + (t.estimated_minutes || 60), 0);
  const completedCount = tasks.length - pending.length;

  const subjectMap: Record<string, number> = {};
  pending.forEach(t => {
    const subj = t.subject || 'General';
    subjectMap[subj] = (subjectMap[subj] || 0) + 1;
  });
  const subjectChartData = Object.keys(subjectMap).map(k => ({ name: k, value: subjectMap[k] }));
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const priorityCounts = {
    High: pending.filter(t => t.priority === 'high').length,
    Medium: pending.filter(t => t.priority === 'medium').length,
    Low: pending.filter(t => t.priority === 'low').length
  };
  const priorityChartData = [
    { name: 'High', tasks: priorityCounts.High, fill: '#ef4444' },
    { name: 'Medium', tasks: priorityCounts.Medium, fill: '#f59e0b' },
    { name: 'Low', tasks: priorityCounts.Low, fill: '#10b981' }
  ];

  const workloadDays: Record<string, number> = {};
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    workloadDays[dayName] = 0;
  }

  pending.forEach(t => {
    const deadlineDate = new Date(t.deadline);
    const dayName = deadlineDate.toLocaleDateString('en-US', { weekday: 'short' });
    if (workloadDays[dayName] !== undefined) {
      workloadDays[dayName] += (t.estimated_minutes || 60) / 60;
    }
  });

  const workloadChartData = Object.keys(workloadDays).map(k => ({
    day: k,
    hours: Number(workloadDays[k].toFixed(1))
  }));

  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Academic Execution Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time status of your workload, deadlines, and AI-scheduled priorities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/ingest">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="btn-primary flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Ingest Syllabus</span>
            </motion.button>
          </Link>
          <Link to="/tasks">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </motion.button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="card p-4 flex items-center gap-3 hover:border-slate-400 dark:hover:border-slate-700 transition-all shadow-sm hover:shadow-md"
          >
            <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                <AnimatedCounter value={totalTasks} />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Tasks</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="card p-4 flex items-center gap-3 hover:border-brand-500/50 transition-all shadow-sm hover:shadow-md"
          >
            <div className="p-3 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                <AnimatedCounter value={pending.length} />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Tasks</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="card p-4 flex items-center gap-3 hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md"
          >
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                <AnimatedCounter value={completedCount} />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Completed</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="card p-4 flex items-center gap-3 hover:border-rose-500/50 transition-all shadow-sm hover:shadow-md"
          >
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                <AnimatedCounter value={highPriority.length} />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">High Priority</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="card p-4 flex items-center gap-3 hover:border-amber-500/50 transition-all shadow-sm hover:shadow-md"
          >
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {Number((totalMinutes / 60).toFixed(1))} hrs
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Remaining Effort</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="card p-4 flex items-center gap-3 hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-md"
          >
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                <AnimatedCounter value={completionRate} suffix="%" />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Completion Rate</div>
            </div>
          </motion.div>
        </div>
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
                onAction={() => window.location.href = '/tasks'}
              />
            )}
          </div>
        </div>

        {/* Tasks by Subject Donut Chart */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Tasks by Subject
          </h2>
          {subjectChartData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={4}
                  >
                    {subjectChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-xs">
              No subject data to display.
            </div>
          )}
        </div>
      </div>

      {/* Workload & Priority Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Workload Distribution Area Chart */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Weekly Workload Forecast (Hours)
          </h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={workloadChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="hours" stroke="#6366f1" fill="#818cf8" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks by Priority Bar Chart */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Tasks by Priority Breakdown
          </h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="tasks" radius={[6, 6, 0, 0]}>
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
