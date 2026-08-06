import React from 'react';
import { clsx } from 'clsx';

interface StatusBadgeProps {
  type: 'priority' | 'status' | 'taskType';
  value: string;
  className?: string;
}

const priorityStyles: Record<string, string> = {
  critical: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse',
  high: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900/50',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50',
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
};

const statusStyles: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
};

const taskTypeStyles: Record<string, string> = {
  assignment: 'bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-400',
  exam: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  announcement: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  reading: 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400'
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, className }) => {
  let styles = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';

  if (type === 'priority') styles = priorityStyles[value] || styles;
  else if (type === 'status') styles = statusStyles[value] || styles;
  else if (type === 'taskType') styles = taskTypeStyles[value] || styles;

  const label = value.replace(/_/g, ' ');

  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize',
      styles,
      className
    )}>
      {label}
    </span>
  );
};
