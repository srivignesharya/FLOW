import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileUp, CheckSquare, Calendar, Bot, Settings, ChevronLeft, ChevronRight, Zap, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/ingest', label: 'Upload & Ingest', icon: FileUp, exact: false },
  { to: '/tasks', label: 'Task Manager', icon: CheckSquare, exact: false },
  { to: '/planner', label: 'Study Planner', icon: Calendar, exact: false },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, exact: false },
  { to: '/copilot', label: 'IMvision', icon: Bot, exact: false },
  { to: '/settings', label: 'Settings', icon: Settings, exact: false }
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="hidden md:flex relative bg-white dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 flex-col h-screen sticky top-0 overflow-hidden z-20 backdrop-blur-xl shadow-sm dark:shadow-2xl shrink-0"
    >
      {/* Logo */}
      <div className={clsx(
        'flex items-center border-b border-slate-200 dark:border-slate-800 h-16 px-4 gap-3 shrink-0',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 shrink-0 border border-brand-400/20">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="text-lg font-black tracking-tight bg-gradient-to-r from-brand-400 via-amber-300 to-orange-400 bg-clip-text text-transparent whitespace-nowrap"
              >
                FLOW
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            'p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0',
            collapsed && 'hidden'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="absolute top-4 right-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            title={collapsed ? link.label : undefined}
            className={({ isActive }) =>
              clsx(
                'relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all group',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 bg-brand-500/10 border border-brand-500/30 rounded-xl shadow-sm shadow-brand-500/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <link.icon className={clsx(
                  'relative z-10 h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'group-hover:text-slate-900 dark:group-hover:text-slate-100'
                )} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="relative z-10 whitespace-nowrap"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!collapsed && isActive && (
                  <motion.div
                    layoutId="active-indicator-dot"
                    className="relative z-10 ml-auto h-2 w-2 rounded-full bg-brand-500 shadow-glow-orange"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer badge */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 border-t border-slate-200 dark:border-slate-800"
          >
            <div className="px-3 py-2.5 rounded-xl bg-brand-50/50 dark:bg-slate-950/60 border border-brand-200 dark:border-brand-500/20">
              <p className="text-xs font-extrabold bg-gradient-to-r from-brand-600 to-amber-600 dark:from-brand-400 dark:to-amber-400 bg-clip-text text-transparent">FLOW</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Powered by IMV</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};
