import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Cpu, Zap } from 'lucide-react';

const THINKING_PHASES = [
  { text: 'LEMON is thinking...', icon: Sparkles },
  { text: 'LEMON is preparing your response...', icon: Brain },
  { text: 'Analyzing context & concepts...', icon: Cpu },
  { text: 'Formulating clear answer...', icon: Zap }
];

export const CopilotThinkingIndicator: React.FC = () => {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % THINKING_PHASES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const CurrentIcon = THINKING_PHASES[phaseIndex].icon;

  return (
    <div className="flex items-start gap-3 my-3 px-2">
      {/* LEMON Avatar (Hardware accelerated CSS, no JS infinite loop) */}
      <div className="relative shrink-0 mt-0.5">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand-500 via-orange-500 to-amber-500 p-0.5 shadow-md shadow-brand-500/20">
          <div className="h-full w-full rounded-[10px] bg-white dark:bg-slate-900 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-brand-500 animate-pulse" />
          </div>
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>

      {/* Lightweight Thinking Bubble */}
      <div className="bg-white/90 dark:bg-slate-900/90 border border-brand-500/20 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-sm">
        <div className="flex items-center gap-2 mb-1.5">
          {/* Hardware-accelerated CSS bouncing dots */}
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse [animation-delay:200ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse [animation-delay:400ms]" />
          </div>
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 tracking-tight">
            LEMON is thinking
          </span>
        </div>

        <div className="h-4 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={phaseIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate"
            >
              <CurrentIcon className="h-3 w-3 text-brand-500 shrink-0" />
              <span className="truncate">{THINKING_PHASES[phaseIndex].text}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
