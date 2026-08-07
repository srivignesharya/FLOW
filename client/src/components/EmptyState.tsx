import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`card p-12 text-center flex flex-col items-center justify-center border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 ${className}`}
    >
      <div className="relative mb-5">
        <div className="absolute -inset-2 bg-gradient-to-r from-brand-500/20 to-indigo-500/20 rounded-full blur-xl opacity-70" />
        <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-600/20 to-indigo-500/20 border border-brand-500/30 text-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/10">
          <Icon className="h-8 w-8" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAction}
          className="mt-6 btn-primary"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
};
