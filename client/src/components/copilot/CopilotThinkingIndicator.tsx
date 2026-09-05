import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Cpu, Zap } from 'lucide-react';

const THINKING_PHASES = [
  { text: 'Consulting Google Gemini AI...', icon: Sparkles },
  { text: 'Analyzing active course deadlines & priorities...', icon: Brain },
  { text: 'Cross-referencing syllabus & study schedule...', icon: Cpu },
  { text: 'Synthesizing actionable academic guidance...', icon: Zap }
];

export const CopilotThinkingIndicator: React.FC = () => {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % THINKING_PHASES.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const CurrentIcon = THINKING_PHASES[phaseIndex].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex items-start gap-3.5 my-4 px-2"
    >
      {/* Animated Glowing Orb Avatar */}
      <div className="relative shrink-0 mt-0.5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-brand-500 via-amber-400 to-orange-500 p-0.5 shadow-lg shadow-brand-500/25"
        >
          <div className="h-full w-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-brand-500 dark:text-brand-400 animate-pulse" />
          </div>
        </motion.div>
        <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500" />
        </span>
      </div>

      {/* Thinking Bubble */}
      <div className="flex-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-brand-500/20 dark:border-brand-500/30 rounded-2xl rounded-tl-sm p-4 shadow-md dark:shadow-glow-orange/10 max-w-md">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="flex items-center gap-1.5">
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              className="h-2 w-2 rounded-full bg-brand-500"
            />
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              className="h-2 w-2 rounded-full bg-amber-500"
            />
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              className="h-2 w-2 rounded-full bg-orange-500"
            />
          </div>
          <span className="text-xs font-bold bg-gradient-to-r from-brand-600 to-amber-600 dark:from-brand-400 dark:to-amber-400 bg-clip-text text-transparent">
            Flow Copilot is formulating
          </span>
        </div>

        <div className="h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={phaseIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              <CurrentIcon className="h-3.5 w-3.5 text-brand-500 shrink-0" />
              <span className="truncate">{THINKING_PHASES[phaseIndex].text}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Shimmer line */}
        <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-brand-500 to-transparent rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
};
