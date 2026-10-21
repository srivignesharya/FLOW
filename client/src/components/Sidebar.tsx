import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileUp,
  CheckSquare,
  Calendar,
  Bot,
  Settings,
  BarChart3,
  Zap,
  PanelLeft,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useCopilot } from '../context/CopilotContext';
import { ZenithLogo } from './ZenithLogo';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: false },
  { to: '/copilot', label: 'AI Copilot', icon: Bot, exact: false, isAi: true },
  { to: '/ingest', label: 'Upload & Ingest', icon: FileUp, exact: false },
  { to: '/tasks', label: 'Task Manager', icon: CheckSquare, exact: false },
  { to: '/planner', label: 'Study Planner', icon: Calendar, exact: false },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, exact: false },
  { to: '/settings', label: 'Settings', icon: Settings, exact: false }
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { openCopilot } = useCopilot();
  const navigate = useNavigate();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
      className="hidden md:flex relative bg-white dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 flex-col h-screen sticky top-0 overflow-hidden z-20 backdrop-blur-xl shadow-sm dark:shadow-2xl shrink-0"
    >
      {/* MacOS-style Header with Action and Toggle */}
      <div
        className={clsx(
          'flex items-center border-b border-slate-200 dark:border-slate-800 h-16 px-4 shrink-0 transition-all',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {/* Brand Logo / Monogram */}
        <div
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
          title="ZENITH v1.1 by IMV"
        >
          <ZenithLogo
            size="sm"
            showWordmark={!collapsed}
            showBadge={!collapsed}
          />
        </div>

        {/* MacOS Header Actions: Plus & PanelLeft Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          <AnimatePresence>
            {!collapsed && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate('/ingest')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Quick Upload / Ingest Document"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            layout
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Nav Links with MacOS Hover Spring Pill & Blur-Fade Entry */}
      <nav
        className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden min-h-0 relative"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={collapsed ? 'collapsed-nav' : 'expanded-nav'}
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-1.5"
          >
            {links.map((link, index) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                title={collapsed ? link.label : undefined}
                onMouseEnter={() => setHoveredIndex(index)}
                className={({ isActive }) =>
                  clsx(
                    'relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-colors group select-none',
                    collapsed ? 'justify-center' : '',
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active State Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 z-0 bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/30 rounded-xl shadow-sm shadow-brand-500/10"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}

                    {/* Gliding MacOS Hover Pill */}
                    <AnimatePresence>
                      {hoveredIndex === index && !isActive && (
                        <motion.span
                          layoutId="sidebar-hover-bg"
                          className="absolute inset-0 z-0 bg-slate-200/50 dark:bg-slate-800/60 rounded-xl"
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

                    {/* Icon */}
                    <link.icon
                      className={clsx(
                        'relative z-10 h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110',
                        isActive
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'group-hover:text-slate-900 dark:group-hover:text-slate-100'
                      )}
                    />

                    {/* Label */}
                    {!collapsed && (
                      <span className="relative z-10 whitespace-nowrap tracking-tight">
                        {link.label}
                      </span>
                    )}

                    {/* Active Indicator Dot or AI Badge */}
                    {!collapsed && isActive && (
                      <motion.div
                        layoutId="active-indicator-dot"
                        className="relative z-10 ml-auto h-2 w-2 rounded-full bg-brand-500 shadow-glow-orange"
                      />
                    )}

                    {/* AI Sparkle indicator when not active */}
                    {!collapsed && !isActive && link.isAi && (
                      <span className="relative z-10 ml-auto flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </motion.div>
        </AnimatePresence>
      </nav>

      {/* Footer badge */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.2 }}
            className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0"
          >
            <div className="px-3 py-2.5 rounded-xl bg-[#0B1020]/90 border border-[#2563FF]/25 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black tracking-tight text-[#F8FAFC]">
                  ZENITH <span className="text-[10px] text-[#00D4FF] font-semibold">v1.1</span>
                </p>
                <span className="text-[10px] font-semibold text-[#00D4FF] bg-[#2563FF]/15 border border-[#2563FF]/30 px-1.5 py-0.5 rounded">
                  by IMV
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-0.5 font-medium">
                Reach Higher. Live Brighter.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};
