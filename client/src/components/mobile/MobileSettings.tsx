import React, { useState } from 'react';
import { 
  User, 
  Building, 
  Clock, 
  Sun, 
  Moon, 
  Mail, 
  Send, 
  Trash2, 
  ShieldAlert, 
  LogOut, 
  ChevronRight, 
  CheckCircle2, 
  Save, 
  Loader2, 
  Sparkles,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileSettingsProps {
  user: any;
  fullName: string;
  setFullName: (n: string) => void;
  institution: string;
  setInstitution: (i: string) => void;
  studyHours: number;
  setStudyHours: (h: number) => void;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
  sendingTestEmail: boolean;
  onSendTestEmail: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  deletingAccount: boolean;
}

export const MobileSettings: React.FC<MobileSettingsProps> = ({
  user,
  fullName,
  setFullName,
  institution,
  setInstitution,
  studyHours,
  setStudyHours,
  saving,
  onSave,
  sendingTestEmail,
  onSendTestEmail,
  isDark,
  onToggleTheme,
  onSignOut,
  onDeleteAccount,
  deletingAccount
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <div className="space-y-5 pb-8">
      {/* 1. Header */}
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Account & AI Planner Preferences</p>
      </div>

      {/* 2. User Profile Card */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 shadow-xs">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-base shadow-md shadow-orange-500/20 shrink-0">
          {(fullName || user?.email || 'U')[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {fullName || 'Student'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-5">
        {/* 3. GROUP: ACCOUNT PREFERENCES */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            ACCOUNT & PROFILE
          </span>

          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Institution
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Stanford University"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Daily Study Target
                </label>
                <span className="text-xs font-bold text-orange-500">{studyHours} hrs/day</span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                value={studyHours}
                onChange={(e) => setStudyHours(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1h (Light)</span>
                <span>6h (Moderate)</span>
                <span>12h (Intense)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 transition-all min-h-[42px] disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </div>

        {/* 4. GROUP: PREFERENCES & ACTIONS */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            PREFERENCES & TOOLS
          </span>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs overflow-hidden">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-h-[48px]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </div>
                <span>Interface Theme</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </button>

            {/* Email Reminder Test */}
            <button
              type="button"
              disabled={sendingTestEmail}
              onClick={onSendTestEmail}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-h-[48px]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  {sendingTestEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                </div>
                <div>
                  <div>Email Reminder System</div>
                  <div className="text-[10px] text-slate-400 font-normal">Test SMTP connection to {user?.email}</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-orange-500">Send Test</span>
            </button>

            {/* Sign Out */}
            <button
              type="button"
              onClick={onSignOut}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-h-[48px]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <LogOut className="h-4 w-4" />
                </div>
                <span>Sign Out</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 5. GROUP: DANGER ZONE */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider px-1">
            DANGER ZONE
          </span>

          <div className="p-4 rounded-3xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/30 space-y-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">Delete FLOW Account</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Permanently deletes your account, tasks, documents, and AI assistant chat history.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/25 min-h-[42px]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Bottom Sheet */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 bg-white dark:bg-slate-900 rounded-t-3xl border-t border-rose-500/40 p-5 pb-8 space-y-4 shadow-2xl"
            >
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2" />

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 shrink-0">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Permanently Delete Account?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Are you sure you want to permanently delete your FLOW account? All your tasks, study schedules, uploaded documents, and IMvision chat history will be permanently deleted from the database.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold min-h-[42px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={onDeleteAccount}
                  className="py-2.5 px-3 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 min-h-[42px] disabled:opacity-50"
                >
                  {deletingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  <span>{deletingAccount ? 'Deleting...' : 'Delete Forever'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileSettings;
