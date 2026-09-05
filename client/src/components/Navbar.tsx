import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Sparkles, Bot } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { useCopilot } from '../context/CopilotContext';
import { SwitchMode } from './SwitchMode';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { openCopilot } = useCopilot();

  const initials = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="h-16 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm dark:shadow-md">
      {/* Left Badge / Mobile Brand */}
      <div className="flex items-center gap-2.5">
        {/* Mobile Brand Logo */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25 border border-brand-400/20">
            <span className="font-black text-xs tracking-wider">FL</span>
          </div>
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-brand-500 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            FLOW
          </span>
        </div>

        {/* Desktop Academic Workspace Badge */}
        <span className="hidden md:inline-flex text-xs font-bold px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 items-center gap-1.5 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-brand-500 dark:text-brand-400" />
          <span>Academic Workspace</span>
        </span>
      </div>

      {/* Right User Controls */}
      <div className="flex items-center gap-3">
        {/* AI Copilot Trigger */}
        <button
          id="navbar-copilot-btn"
          onClick={openCopilot}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-500/10 via-orange-500/10 to-amber-500/10 hover:from-brand-500/20 hover:to-orange-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30 transition-all font-semibold text-xs shadow-sm hover:scale-[1.02] active:scale-95"
          title="Open AI Copilot (Ctrl+J)"
        >
          <Bot className="h-4 w-4 text-brand-500 dark:text-brand-400" />
          <span className="hidden sm:inline">Copilot</span>
        </button>

        {/* Notification Center */}
        <NotificationCenter />

        {/* Animated Theme Switcher */}
        <SwitchMode width={58} height={28} />

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
