import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, Zap } from 'lucide-react';
import { useCopilot } from '../../context/CopilotContext';

export const CopilotFloatingTrigger: React.FC = () => {
  const { isOpen, toggleCopilot } = useCopilot();
  const [hovered, setHovered] = useState(false);

  // If Copilot is currently open, hide the floating trigger button
  if (isOpen) return null;

  return (
    <div className="fixed bottom-20 md:bottom-7 right-5 md:right-7 z-40 flex items-center gap-2 pointer-events-auto select-none">
      {/* Tooltip badge */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-900/90 text-white text-xs font-semibold shadow-xl border border-slate-700 backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-400 animate-spin" />
            <span>Ask Copilot</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
              Ctrl+J
            </kbd>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        id="copilot-floating-btn"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={toggleCopilot}
        className="relative group p-0.5 rounded-2xl focus:outline-none"
        aria-label="Open AI Copilot"
      >
        {/* Animated Glow Aura */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand-500 via-orange-500 to-amber-500 opacity-70 group-hover:opacity-100 blur-md transition-opacity duration-300 animate-pulse" />

        {/* Button Core */}
        <div className="relative h-13 w-13 p-3.5 rounded-2xl bg-gradient-to-br from-brand-500 via-orange-500 to-amber-500 text-white flex items-center justify-center shadow-2xl shadow-brand-500/40 border border-brand-400/30">
          <Bot className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />

          {/* Active indicator dot */}
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white shadow-sm" />
          </span>
        </div>
      </motion.button>
    </div>
  );
};
