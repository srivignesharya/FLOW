import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileUp, CheckSquare, Calendar, Bot, Settings, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/ingest', label: 'Upload & Ingest', icon: FileUp, exact: false },
  { to: '/tasks', label: 'Task Manager', icon: CheckSquare, exact: false },
  { to: '/planner', label: 'Study Planner', icon: Calendar, exact: false },
  { to: '/copilot', label: 'AI Copilot', icon: Bot, exact: false },
  { to: '/settings', label: 'Settings', icon: Settings, exact: false }
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 overflow-hidden z-20"
    >
      {/* Logo */}
      <div className={clsx(
        'flex items-center border-b border-slate-200 dark:border-slate-800 h-16 px-4 gap-3 shrink-0',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-600/25 shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-400 bg-clip-text text-transparent whitespace-nowrap"
              >
                FLOW
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            'p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0',
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
          className="absolute top-4 right-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            title={collapsed ? link.label : undefined}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className={clsx('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-brand-600 dark:text-brand-400' : '')} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="whitespace-nowrap"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!collapsed && isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-600 dark:bg-brand-400"
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
            <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/40 border border-brand-100 dark:border-brand-900/50">
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">Flow AI Platform</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Powered by Gemini 2.5</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};
