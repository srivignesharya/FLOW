import React, { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PanelLeft } from 'lucide-react';

export interface MacOSSidebarProps {
  items: string[];
  defaultOpen?: boolean;
  initialSelectedIndex?: number;
  children?: ReactNode;
  className?: string;
  onSelect?: (index: number, item: string) => void;
}

export function MacOSSidebar({
  items,
  defaultOpen = true,
  initialSelectedIndex = 0,
  children,
  className = '',
  onSelect
}: MacOSSidebarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(initialSelectedIndex);
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  const handleSelect = (index: number, item: string) => {
    setSelectedIndex(index);
    onSelect?.(index, item);
  };

  return (
    <div
      className={`flex bg-slate-100 dark:bg-slate-950 rounded-3xl p-3 relative w-full sm:min-w-[480px] overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-sm ${className}`}
    >
      <motion.div
        animate={{
          width: isOpen ? 240 : 64
        }}
        transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
        className={`p-2 rounded-2xl shrink-0 flex flex-col items-start transition-colors duration-700 ease-out ${
          isOpen ? 'bg-white/90 dark:bg-slate-900/90 shadow-sm' : 'bg-transparent'
        }`}
      >
        <div
          className={`flex items-center w-full ${
            isOpen ? 'justify-end gap-3' : 'justify-center'
          } text-slate-600 dark:text-slate-300 p-2 shrink-0`}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Add new"
              >
                <Plus className="h-4 w-4 cursor-pointer" />
              </motion.button>
            )}
          </AnimatePresence>
          <motion.button
            type="button"
            layout
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 flex items-center justify-center"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <PanelLeft className="h-4 w-4 cursor-pointer" />
          </motion.button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex flex-col gap-1.5 mt-3 w-full relative z-10 whitespace-nowrap"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {items.map((item, index) => (
                <div
                  key={item}
                  className="relative cursor-pointer select-none rounded-xl"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onClick={() => handleSelect(index, item)}
                >
                  <AnimatePresence>
                    {selectedIndex === index && (
                      <motion.div
                        className="absolute inset-0 z-0 bg-brand-500/15 dark:bg-brand-500/20 border border-brand-500/30 rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      />
                    )}
                  </AnimatePresence>
                  <p
                    className={`relative z-10 px-4 py-2.5 text-xs font-semibold tracking-tight transition-colors ${
                      selectedIndex === index
                        ? 'text-brand-600 dark:text-brand-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item}
                  </p>
                  <AnimatePresence>
                    {hoveredIndex === index && selectedIndex !== index && (
                      <motion.span
                        layoutId="sidebar-hover-bg"
                        className="absolute inset-0 z-0 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 350,
                          damping: 30
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="flex-1 w-full h-full min-h-full overflow-y-auto z-0 pl-4 lg:pl-6">
        {children}
      </div>
    </div>
  );
}

export default MacOSSidebar;
