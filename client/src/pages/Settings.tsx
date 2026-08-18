import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { showToast, triggerCelebration } from '../components/ToastContainer';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { User, Building, Clock, Sun, Moon, Save, CheckCircle2, AlertCircle, Mail, Send, Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { SkeletonCard } from '../components/SkeletonLoaders';

export const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [studyHours, setStudyHours] = useState(4);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/profile')
      .then(res => {
        const p = res.data;
        if (p) {
          setFullName(p.full_name || '');
          setInstitution(p.academic_institution || '');
          setStudyHours(p.preferred_study_hours_per_day || 4);
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to load profile settings', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.patch('/auth/profile', {
        full_name: fullName,
        academic_institution: institution,
        preferred_study_hours_per_day: Number(studyHours)
      });
      showToast('Profile settings saved successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to save settings.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    setError('');
    try {
      const res = await api.post('/test-email');
      triggerCelebration();
      showToast(res.data.message || `Test email dispatched to ${user?.email}`, 'success');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to send test email. Verify SMTP settings in server/.env';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setError('');

    try {
      await api.delete('/auth/account');
      setIsDeleteModalOpen(false);
      showToast('Your FLOW account has been permanently deleted.', 'info');
      await signOut();
      navigate('/auth', { replace: true });
    } catch (err: any) {
      console.error('[DELETE ACCOUNT FAILED]:', err);
      const msg = err.response?.data?.error || 'Failed to delete account. Please try again or contact support.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setDeletingAccount(false);
    }
  };


  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto animate-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          Account & Academic Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
          Customize your study preferences to tune the Gemini AI planner algorithm.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/80 text-red-400 text-xs rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
        {/* Profile Card */}
        <div className="card p-4 sm:p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="h-5 w-5 text-brand-500" />
            <span>Personal Profile</span>
          </h2>

          <div className="space-y-3.5 sm:space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="input opacity-60 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Academic Institution</label>
              <div className="relative">
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Stanford University"
                  className="input pl-10"
                />
                <Building className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Study Preferences Card */}
        <div className="card p-4 sm:p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-500" />
            <span>AI Planner Algorithm Preferences</span>
          </h2>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Preferred Study Hours per Day ({studyHours} hours)
            </label>
            <input
              type="range"
              min={1}
              max={12}
              value={studyHours}
              onChange={(e) => setStudyHours(Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>1 hr (Light)</span>
              <span>6 hrs (Moderate)</span>
              <span>12 hrs (Intense)</span>
            </div>
          </div>
        </div>

        {/* Email Reminders Test Card */}
        <div className="card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand-500" />
              <span>Email Reminder System</span>
            </h2>
            <p className="text-xs text-slate-400">
              Verify Nodemailer SMTP connection by sending a test reminder to <strong className="text-slate-700 dark:text-slate-200">{user?.email}</strong>.
            </p>
          </div>

          <button
            type="button"
            disabled={sendingTestEmail}
            onClick={handleSendTestEmail}
            className="btn-secondary flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto min-h-[44px]"
          >
            {sendingTestEmail ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4 text-brand-500" />
                <span>Send Test Email</span>
              </>
            )}
          </button>
        </div>

        {/* Theme Preference Card */}
        <div className="card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Interface Theme</h2>
            <p className="text-xs text-slate-400">Switch between dark mode and light mode appearance.</p>
          </div>

          <button
            type="button"
            onClick={() => {
              toggleTheme();
              showToast(`Theme switched to ${isDark ? 'light' : 'dark'} mode`, 'info');
            }}
            className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-slate-600" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto min-h-[44px]"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving Preferences...' : 'Save Profile Settings'}</span>
          </button>
        </div>
      </form>

      {/* Danger Zone: Account Deletion */}
      <div className="card p-4 sm:p-6 border-red-500/30 dark:border-red-900/50 bg-red-500/5 dark:bg-red-950/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              <span>Danger Zone: Delete Account</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This permanently deletes your FLOW account and associated data.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 active:scale-[0.98] font-semibold text-xs transition-all flex items-center justify-center gap-2 shrink-0 min-h-[44px]"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in">
          <div className="card p-6 max-w-md w-full space-y-5 bg-white dark:bg-slate-900 border-red-500/40 shadow-2xl">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Permanently Delete Account?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to permanently delete your account? This action cannot be undone. All your tasks, study schedules, uploaded documents, and IMvision chat history will be permanently deleted from the database.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-secondary text-xs px-4 py-2.5 min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleDeleteAccount}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-red-600/30 min-h-[40px] disabled:opacity-50"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
