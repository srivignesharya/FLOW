import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { validatePassword } from '../utils/passwordValidator';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { Footer } from '../components/Footer';

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if recovery flow was triggered or token present
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[AUTH]: Password recovery session detected');
      }
    });
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Password confirmation check
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    // 2. Strong password policy validation
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(`Password must meet all security requirements: ${validation.errors.join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/auth');
      }, 3500);
    } catch (err: any) {
      console.error('[RESET PASSWORD ERROR]:', err);
      setError(err.message || 'Failed to update password. Your reset link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100">
      <div className="my-auto flex items-center justify-center p-6 sm:p-12 w-full">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-brand-400 to-indigo-300 bg-clip-text text-transparent">
              FLOW
            </span>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Reset Your Password
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Enter your new strong password below to secure your FLOW account.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-950/50 border border-rose-800/80 text-rose-400 text-xs rounded-xl animate-fade-in">
              {error}
            </div>
          )}

          {success ? (
            <div className="p-6 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-center space-y-4 animate-fade-in">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Password Updated Successfully</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your password has been changed. You will be redirected to the sign-in page in a few seconds...
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md"
              >
                Sign In Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Flow@2026"
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={password} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Flow@2026"
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-rose-400 mt-1.5 font-medium">
                    Passwords do not match.
                  </p>
                )}
              </div>

              <button
                id="reset-password-submit-btn"
                type="submit"
                disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  'Updating Password...'
                ) : (
                  <>
                    <span>Update Password</span>
                    <ShieldCheck className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer className="border-t border-slate-800/80 bg-slate-950 text-slate-500" />
    </div>
  );
};
