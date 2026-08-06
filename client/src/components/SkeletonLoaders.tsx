import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonRow: React.FC = () => {
  return (
    <tr className="animate-pulse border-b border-slate-100 dark:border-slate-800">
      <td className="p-4"><div className="h-5 w-5 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
      <td className="p-4 space-y-1">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-24" />
      </td>
      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" /></td>
      <td className="p-4"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-16" /></td>
      <td className="p-4"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-20" /></td>
      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></td>
      <td className="p-4"><div className="h-6 w-6 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
    </tr>
  );
};
