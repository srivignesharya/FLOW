import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  CheckSquare, 
  Calendar, 
  Bot, 
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCopilot } from '../context/CopilotContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  isAi?: boolean;
}

const PRIMARY_TABS: NavItem[] = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Copilot', path: '#copilot', icon: Bot, isAi: true },
  { name: 'Planner', path: '/planner', icon: Calendar },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { openCopilot, isOpen } = useCopilot();

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)] pb-[calc(env(safe-area-inset-bottom,0px)+6px)] pt-1.5 px-2"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1 relative items-center">
        {PRIMARY_TABS.map((tab) => {
          const isActive = tab.isAi
            ? isOpen
            : tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path);
          const Icon = tab.icon;

          if (tab.isAi) {
            return (
              <button
                key={tab.name}
                type="button"
                onClick={openCopilot}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 select-none min-h-[50px] ${
                  isActive
                    ? 'text-orange-500 dark:text-orange-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTabPill"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-orange-500/15 via-amber-500/15 to-orange-500/10 dark:from-orange-500/25 dark:to-amber-500/15 border border-orange-500/20"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                <div className="relative z-10">
                  <div className={`relative p-0.5 transition-transform ${isActive ? 'scale-110' : ''}`}>
                    <Icon className="h-5 w-5 text-brand-500 dark:text-brand-400" />
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-950"
                    />
                  </div>
                </div>

                <span className={`relative z-10 text-[10px] tracking-tight mt-0.5 line-clamp-1 ${
                  isActive ? 'font-bold text-orange-500 dark:text-orange-400' : 'font-medium text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.name}
                </span>
              </button>
            );
          }

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 select-none min-h-[50px] ${
                isActive
                  ? tab.isAi
                    ? 'text-orange-500 dark:text-orange-400 font-bold'
                    : 'text-brand-600 dark:text-brand-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {/* Active Background Pill Indicator */}
              {isActive && (
                <motion.div
                  layoutId="mobileActiveTabPill"
                  className={`absolute inset-0 rounded-2xl ${
                    tab.isAi
                      ? 'bg-gradient-to-tr from-orange-500/15 via-amber-500/15 to-orange-500/10 dark:from-orange-500/25 dark:to-amber-500/15 border border-orange-500/20'
                      : 'bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20'
                  }`}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {/* Icon Container with Micro-Animations */}
              <div className="relative z-10">
                {tab.isAi ? (
                  <div className={`relative p-0.5 transition-transform ${isActive ? 'scale-110' : ''}`}>
                    <Icon className="h-5 w-5" />
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-950"
                    />
                  </div>
                ) : (
                  <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                )}
              </div>

              {/* Label */}
              <span className={`relative z-10 text-[10px] tracking-tight mt-0.5 line-clamp-1 ${
                isActive ? 'font-bold' : 'font-medium text-slate-500 dark:text-slate-400'
              }`}>
                {tab.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
