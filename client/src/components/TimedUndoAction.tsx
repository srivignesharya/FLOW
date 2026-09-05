import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';

export interface TimedUndoActionProps {
  initialSeconds?: number;
  deleteLabel?: string;
  undoLabel?: string;
  onConfirm?: () => Promise<void> | void;
  isDeleting?: boolean;
  className?: string;
}

export const TimedUndoAction: React.FC<TimedUndoActionProps> = ({
  initialSeconds = 10,
  deleteLabel = 'Delete Account',
  undoLabel = 'Cancel Deletion',
  onConfirm,
  isDeleting = false,
  className = ''
}) => {
  const [isTriggered, setIsTriggered] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start countdown when triggered
  useEffect(() => {
    if (isTriggered) {
      setSecondsLeft(initialSeconds);

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            onConfirm?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTriggered, initialSeconds, onConfirm]);

  const handleStart = () => {
    setIsTriggered(true);
  };

  const handleCancel = () => {
    setIsTriggered(false);
    setSecondsLeft(initialSeconds);
  };

  const handleImmediateDelete = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSecondsLeft(0);
    onConfirm?.();
  };

  // Circular progress calculations
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = secondsLeft / initialSeconds;
  const strokeDashoffset = circumference - progressPercent * circumference;

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <AnimatePresence mode="wait">
        {!isTriggered ? (
          /* 1. Initial State: Delete Button */
          <motion.button
            key="delete-initial-btn"
            type="button"
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 active:bg-rose-500/15 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm min-h-[44px] select-none"
          >
            <Trash2 className="h-4 w-4" />
            <span>{deleteLabel}</span>
          </motion.button>
        ) : (
          /* 2. Timed Undo Session State */
          <motion.div
            key="undo-countdown-panel"
            layout
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/40 shadow-xl shadow-rose-950/20 p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg"
          >
            {/* Animated Subtle Danger Halo */}
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-600/15 via-red-600/10 to-amber-600/10 blur-xl pointer-events-none" />

            {/* Circular Countdown Gauge */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 44 44">
                {/* Background Ring */}
                <circle
                  cx="22"
                  cy="22"
                  r={radius}
                  strokeWidth="3"
                  className="stroke-slate-200 dark:stroke-slate-800 fill-none"
                />
                {/* Animated Depleting Stroke */}
                <motion.circle
                  cx="22"
                  cy="22"
                  r={radius}
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.9, ease: 'linear' }}
                  className="stroke-rose-500 fill-none stroke-linecap-round"
                />
              </svg>

              {/* Countdown Number */}
              <div className="absolute inset-0 flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={secondsLeft}
                    initial={{ y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -6, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs font-black font-mono text-rose-600 dark:text-rose-400"
                  >
                    {secondsLeft}s
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {/* Warning Message & Details */}
            <div className="flex-1 text-center sm:text-left space-y-0.5 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 animate-bounce" />
                <span>Account Deletion in Progress</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Permanently deleting in <strong className="font-semibold text-rose-500">{secondsLeft} seconds</strong>. Click undo below to stop.
              </p>
            </div>

            {/* Action Buttons: Cancel (Undo) & Immediate Delete */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center">
              {/* Undo / Cancel Button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={handleCancel}
                disabled={isDeleting}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <RotateCcw className="h-3.5 w-3.5 text-brand-500 animate-spin-reverse" />
                <span>{undoLabel}</span>
              </motion.button>

              {/* Immediate Delete Button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={handleImmediateDelete}
                disabled={isDeleting}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-md shadow-rose-600/30 disabled:opacity-50"
                title="Skip timer and delete immediately"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Now</span>
              </motion.button>
            </div>

            {/* Shimmer linear progress bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600"
                initial={{ width: '100%' }}
                animate={{ width: `${(secondsLeft / initialSeconds) * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
