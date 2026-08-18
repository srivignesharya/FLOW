import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Bot,
  MoreHorizontal,
  FileUp,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  X,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { clsx } from 'clsx';

export const MobileBottomNav: React.FC = () => {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const mainTabs = [
    { to: '/', label: 'Home', icon: LayoutDashboard, exact: true },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare, exact: false },
    { to: '/planner', label: 'Planner', icon: Calendar, exact: false },
    { to: '/copilot', label: 'IMvision', icon: Bot, exact: false, isAi: true }
  ];

  const moreLinks = [
    { to: '/ingest', label: 'Upload & Ingest', description: 'Extract tasks from course syllabus & PDFs', icon: FileUp },
    { to: '/analytics', label: 'Analytics', description: 'Velocity, subject hours & real-time metrics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', description: 'Preferences, study hours & email reminders', icon: Settings }
  ];

  const isMoreActive = moreLinks.some(link => location.pathname === link.to);

  return (
    <>
      {/* Slide-up "More" Bottom Sheet Drawer */}
      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Sheet Content */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-10 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-5 pb-8 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                    <Zap className="h-4 w-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">More Options</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">FLOW Academic Workspace</p>
                  </div>
                </div>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close more options"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Secondary Navigation Links */}
              <div className="space-y-2">
                {moreLinks.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <button
                      key={item.to}
                      onClick={() => {
                        navigate(item.to);
                        setMoreOpen(false);
                      }}
                      className={clsx(
                        'w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left transition-all min-h-[52px]',
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-950/60 border border-brand-500/30 text-brand-600 dark:text-brand-400 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <div className={clsx(
                        'p-2.5 rounded-xl shrink-0',
                        isActive
                          ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                      )}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{item.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Preferences: Theme Toggle & Sign Out */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold min-h-[48px]"
                >
                  <div className="flex items-center gap-3">
                    {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
                    <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{isDark ? 'Dark' : 'Light'}</span>
                </button>

                <button
                  onClick={() => {
                    setMoreOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-sm font-bold min-h-[48px] hover:bg-rose-100 dark:hover:bg-rose-950/70 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* User badge */}
              <div className="px-3 py-2 text-center text-xs text-slate-400">
                Signed in as <span className="font-semibold text-slate-300">{user?.email}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Nav Bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.6)] px-2 pt-1 pb-[calc(env(safe-area-inset-bottom,8px)+4px)]"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mainTabs.map((tab) => {
            const isActive = tab.exact
              ? location.pathname === tab.to
              : location.pathname.startsWith(tab.to);

            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.exact}
                className={({ isActive: active }) =>
                  clsx(
                    'relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl min-w-[56px] min-h-[48px] transition-all touch-manipulation group',
                    active
                      ? 'text-brand-600 dark:text-brand-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                  )
                }
              >
                {({ isActive: active }) => (
                  <>
                    {active && (
                      <motion.div
                        layoutId="mobile-nav-pill"
                        className="absolute inset-0 bg-brand-500/10 dark:bg-brand-500/15 rounded-2xl border border-brand-500/30"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}

                    <div className="relative z-10 flex items-center justify-center">
                      <tab.icon
                        className={clsx(
                          'h-5 w-5 transition-transform duration-200',
                          active ? 'scale-110 text-brand-600 dark:text-brand-400' : 'group-hover:scale-105',
                          tab.isAi && active && 'text-brand-500'
                        )}
                      />
                      {tab.isAi && (
                        <span className="absolute -top-1 -right-1.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                        </span>
                      )}
                    </div>

                    <span className="relative z-10 text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                      {tab.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* More Tab */}
          <button
            onClick={() => setMoreOpen(true)}
            className={clsx(
              'relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl min-w-[56px] min-h-[48px] transition-all touch-manipulation group',
              isMoreActive || moreOpen
                ? 'text-brand-600 dark:text-brand-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
            )}
            aria-label="Open more menu"
          >
            {(isMoreActive || moreOpen) && (
              <motion.div
                layoutId="mobile-nav-pill-more"
                className="absolute inset-0 bg-brand-500/10 dark:bg-brand-500/15 rounded-2xl border border-brand-500/30"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <div className="relative z-10">
              <MoreHorizontal
                className={clsx(
                  'h-5 w-5 transition-transform duration-200',
                  (isMoreActive || moreOpen) ? 'scale-110 text-brand-600 dark:text-brand-400' : 'group-hover:scale-105'
                )}
              />
            </div>
            <span className="relative z-10 text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
