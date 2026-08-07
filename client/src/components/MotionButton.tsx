import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface MotionButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  id?: string;
}

export const MotionButton: React.FC<MotionButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  icon,
  disabled = false,
  onClick,
  type = 'button',
  title,
  id
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 border border-brand-400/20';
      case 'secondary':
        return 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 shadow-sm';
      case 'ghost':
        return 'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-100';
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 border border-rose-500/20';
    }
  };

  return (
    <motion.button
      type={type}
      title={title}
      whileHover={disabled || isLoading ? {} : { scale: 1.03, y: -1 }}
      whileTap={disabled || isLoading ? {} : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors duration-200 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed ${getVariantStyles()} ${className}`}
    >
      {/* Morphing Loading State */}
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-2"
        >
          <Loader2 className="h-4 w-4 animate-spin text-current" />
          <span>Processing...</span>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </motion.div>
      )}
    </motion.button>
  );
};
