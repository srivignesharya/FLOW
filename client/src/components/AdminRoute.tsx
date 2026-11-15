import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import api from '../services/api';
import { ShieldAlert, ArrowLeft, RefreshCw, Lock, LogIn } from 'lucide-react';

export const EXCLUSIVE_ADMIN_EMAIL = 'flowbyimv@gmail.com';

export const isAuthorizedAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === EXCLUSIVE_ADMIN_EMAIL.toLowerCase();
};

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [serverVerified, setServerVerified] = useState<boolean | null>(null);
  const [checking, setChecking] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const verifyAdmin = async () => {
      if (!user || !user.email) {
        if (isMounted) {
          setServerVerified(false);
          setChecking(false);
        }
        return;
      }

      // Fast client-side pre-check
      if (!isAuthorizedAdmin(user.email)) {
        if (isMounted) {
          setServerVerified(false);
          setChecking(false);
        }
        return;
      }

      // Strict server-side verification
      try {
        const res = await api.get('/admin/check');
        if (isMounted) {
          setServerVerified(Boolean(res.data?.isAdmin));
          setChecking(false);
        }
      } catch (err) {
        console.warn('[ADMIN CHECK FAILED]:', err);
        if (isMounted) {
          setServerVerified(false);
          setChecking(false);
        }
      }
    };

    if (!authLoading) {
      verifyAdmin();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  if (authLoading || checking) {
    return <LoadingSpinner fullPage text="Verifying administrator credentials for flowbyimv@gmail.com..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isEmailMatch = isAuthorizedAdmin(user.email);

  if (!isEmailMatch || serverVerified === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />

          {/* Shield Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mb-6 shadow-lg shadow-rose-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-3">
            Access Restricted
          </span>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Administrator Clearance Required
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            This control panel is locked exclusively to master administrator account:
          </p>

          <div className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{EXCLUSIVE_ADMIN_EMAIL}</span>
          </div>

          <p className="text-[11px] text-slate-400 mb-6">
            Currently logged in as: <strong className="text-slate-700 dark:text-slate-300">{user.email}</strong>
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Student Workspace
            </button>

            <button
              onClick={async () => {
                await signOut();
                navigate('/auth');
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-500 to-orange-500 hover:from-brand-600 hover:to-orange-600 text-white shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Switch Account to flowbyimv@gmail.com
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
