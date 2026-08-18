import React from 'react';
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { GoogleIcon } from '../GoogleIcon';
import { PasswordStrengthMeter } from '../PasswordStrengthMeter';

interface MobileAuthProps {
  viewMode: 'signin' | 'signup' | 'forgot_password';
  setViewMode: (v: 'signin' | 'signup' | 'forgot_password') => void;
  email: string;
  setEmail: (e: string) => void;
  password: string;
  setPassword: (p: string) => void;
  confirmPassword: string;
  setConfirmPassword: (p: string) => void;
  showPassword: boolean;
  setShowPassword: (s: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (s: boolean) => void;
  loading: boolean;
  googleLoading: boolean;
  error: string;
  message: string;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
}

export const MobileAuth: React.FC<MobileAuthProps> = ({
  viewMode,
  setViewMode,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  googleLoading,
  error,
  message,
  onSubmit,
  onGoogleSignIn
}) => {
  const isSignUp = viewMode === 'signup';
  const isForgotPassword = viewMode === 'forgot_password';

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-slate-950 text-slate-100 p-5 pt-8 pb-8 max-w-md mx-auto">
      {/* 1. Brand Logo Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 mb-1">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">FLOW</h1>
          <span className="text-[11px] font-semibold text-slate-400">Built by IMV</span>
        </div>
      </div>

      {/* 2. Main Auth Form */}
      <div className="my-auto py-6 space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-white">
            {isForgotPassword
              ? 'Reset your password'
              : isSignUp
              ? 'Create your account'
              : 'Welcome back'}
          </h2>
          <p className="text-xs text-slate-400">
            {isForgotPassword
              ? 'Enter your email to receive a password reset link.'
              : isSignUp
              ? 'Start organizing your academic workflow today.'
              : 'Sign in to access your intelligent study workspace.'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 shadow-xs"
            />
          </div>

          {!isForgotPassword && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {isSignUp && <PasswordStrengthMeter password={password} />}
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">Passwords do not match.</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all min-h-[46px] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>
                  {isForgotPassword
                    ? 'Send Reset Link'
                    : isSignUp
                    ? 'Create Account'
                    : 'Sign In'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* 3. Google Sign In Option */}
        {!isForgotPassword && (
          <div className="space-y-3.5 pt-1">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-950 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                OR
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-slate-200 font-bold rounded-2xl border border-slate-800 transition-all flex items-center justify-center gap-3 text-xs min-h-[46px] shadow-xs"
            >
              {googleLoading ? (
                <span className="text-slate-300">Connecting Google...</span>
              ) : (
                <>
                  <GoogleIcon className="h-4 w-4 shrink-0" />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {!isSignUp && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setViewMode('forgot_password')}
                  className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Forgot Password?</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Footer Switcher */}
      <div className="pt-4 border-t border-slate-800/80 text-center">
        {isForgotPassword ? (
          <button
            type="button"
            onClick={() => setViewMode('signin')}
            className="text-xs font-semibold text-slate-400 hover:text-white"
          >
            ← Back to Sign In
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setViewMode(isSignUp ? 'signin' : 'signup')}
            className="text-xs font-bold text-orange-400 hover:text-orange-300"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileAuth;
