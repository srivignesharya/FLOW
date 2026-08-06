import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Flame, Clock, CheckCircle2, BookOpen } from 'lucide-react';

export const Analytics: React.FC = () => {
  const [stats] = useState({
    completedTasks: 12,
    totalTasks: 16,
    streakDays: 5,
    hoursStudied: 18.5,
    weeklyCompletionRate: 85,
    subjects: [
      { name: 'Database Systems', count: 5, color: 'bg-brand-500' },
      { name: 'Software Engineering', count: 4, color: 'bg-indigo-500' },
      { name: 'Computer Networks', count: 3, color: 'bg-purple-500' },
      { name: 'Linear Algebra', count: 2, color: 'bg-emerald-500' }
    ]
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-brand-500" />
          <span>Academic Analytics & Insights</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Real-time study velocity, streak tracking, subject focus breakdown, and AI completion metrics.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasks Completed</span>
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
            {stats.completedTasks} <span className="text-sm font-normal text-slate-400">/ {stats.totalTasks}</span>
          </div>
          <p className="text-xs text-emerald-500 font-medium">75% overall completion rate</p>
        </div>

        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Study Streak</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
            {stats.streakDays} <span className="text-sm font-normal text-slate-400">Days</span>
          </div>
          <p className="text-xs text-amber-500 font-semibold">🔥 Active Streak</p>
        </div>

        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours Studied</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
            {stats.hoursStudied} <span className="text-sm font-normal text-slate-400">Hours</span>
          </div>
          <p className="text-xs text-indigo-500 font-medium">Avg 2.6 hrs/day focus</p>
        </div>

        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weekly Progress</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
            {stats.weeklyCompletionRate}%
          </div>
          <p className="text-xs text-purple-500 font-medium">+12% vs last week</p>
        </div>
      </div>

      {/* Subject Distribution */}
      <div className="card p-6 space-y-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-brand-500" />
          <span>Subject Focus Distribution</span>
        </h3>

        <div className="space-y-4">
          {stats.subjects.map(subject => {
            const percentage = Math.round((subject.count / stats.totalTasks) * 100);
            return (
              <div key={subject.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">{subject.name}</span>
                  <span className="text-slate-400">{subject.count} tasks ({percentage}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-full ${subject.color} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
