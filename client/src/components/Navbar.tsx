import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, Sparkles } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const initials = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm dark:shadow-md">
      {/* Left Badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 flex items-center gap-1.5 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-brand-500 dark:text-brand-400" />
          <span>Academic Workspace</span>
        </span>
      </div>

      {/* Right User Controls */}
      <div className="flex items-center gap-3">
        {/* Notification Center */}
        <NotificationCenter />

        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark
            ? <Sun className="h-5 w-5 text-amber-400" />
            : <Moon className="h-5 w-5 text-slate-600" />
          }
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 via-orange-500 to-amber-500 flex items-center justify-center text-white text-sm font-black shadow-md dark:shadow-glow-orange border border-brand-400/30">
            {initials}
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 hidden md:block max-w-[160px] truncate">
            {user?.email}
          </span>
        </div>

        {/* Sign Out */}
        <button
          id="sign-out-btn"
          onClick={signOut}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Sign Out"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};
