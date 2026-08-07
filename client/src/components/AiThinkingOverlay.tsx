import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Cpu, CheckCircle2 } from 'lucide-react';

const AI_THINKING_STEPS = [
  'Ingesting registered course deadlines and weightages...',
  'Evaluating 7-day cognitive load & spacing interval algorithm...',
  'Consulting Google Gemini AI for study duration optimizations...',
  'Structuring priority daily focus blocks & break intervals...',
  'Finalizing 7-day study execution plan...'
];

export const AiThinkingOverlay: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % AI_THINKING_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="card p-12 text-center flex flex-col items-center justify-center space-y-6 relative overflow-hidden border-brand-500/30 bg-slate-900/90 backdrop-blur-2xl shadow-2xl"
    >
      {/* Background Animated Halo */}
      <div className="absolute -inset-10 bg-gradient-to-r from-brand-600/20 via-indigo-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />

      {/* AI Pulse Node */}
      <div className="relative">
        <div className="absolute -inset-4 bg-brand-500/20 rounded-full blur-xl animate-ping" />
        <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30">
          <Brain className="h-10 w-10 animate-bounce" />
        </div>
      </div>

      <div className="space-y-2 max-w-md relative z-10">
        <h3 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          <span>Gemini AI Study Architect</span>
          <Sparkles className="h-5 w-5 text-brand-400 animate-spin" />
        </h3>
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-brand-300/90 font-medium h-6"
          >
            {AI_THINKING_STEPS[currentStep]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Shimmer Progress Bar */}
      <div className="w-full max-w-xs bg-slate-800/80 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700/60 relative z-10">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-400 rounded-full"
          initial={{ width: '5%' }}
          animate={{ width: '95%' }}
          transition={{ duration: 8, ease: 'easeInOut' }}
        />
      </div>

      {/* Skeleton Placeholders */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 opacity-50 pointer-events-none relative z-10">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-3">
            <div className="h-4 bg-slate-700/60 rounded w-2/3 animate-pulse" />
            <div className="h-3 bg-slate-700/40 rounded w-full animate-pulse" />
            <div className="h-3 bg-slate-700/40 rounded w-4/5 animate-pulse" />
          </div>
        ))}
      </div>
    </motion.div>
  );
};
