import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, BookOpen, Calendar, Bot, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Footer } from '../components/Footer';
import { validatePassword } from '../utils/passwordValidator';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { GoogleIcon } from '../components/GoogleIcon';
import { MobileAuth } from '../components/mobile/MobileAuth';

type AuthViewMode = 'signin' | 'signup' | 'forgot_password';

export const Auth: React.FC = () => {
  const [viewMode, setViewMode] = useState<AuthViewMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    if (googleLoading || loading) return;
    setGoogleLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('[GOOGLE OAUTH ERROR]:', err);
      let formattedMsg = err.message || 'Failed to initialize Google login.';
      if (err.message?.includes('popup_closed_by_user')) {
        formattedMsg = 'Google sign-in was cancelled.';
      }
      setError(formattedMsg);
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (viewMode === 'signup') {
        // 1. Password confirmation check
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        // 2. Strong password policy validation
        const validation = validatePassword(password);
        if (!validation.isValid) {
          setError(`Password does not satisfy requirements: ${validation.errors.join(', ')}`);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Registration successful! Please check your email for the confirmation link.');
      } else if (viewMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else if (viewMode === 'forgot_password') {
        // Redirect URL points to /reset-password route
        const redirectUrl = `${window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl
        });

        if (error) throw error;
        setMessage('Password reset email sent successfully. Please check your inbox.');
      }
    } catch (err: any) {
      console.error('[AUTH ERROR]:', err);
      let formattedMsg = err.message || 'Authentication operation failed.';
      if (err.message?.includes('Invalid login credentials')) {
        formattedMsg = 'Invalid email or password. Please verify your credentials.';
      } else if (err.message?.includes('User already registered')) {
        formattedMsg = 'An account with this email address already exists. Please sign in.';
      }
      setError(formattedMsg);
    } finally {
      setLoading(false);
    }
  };

  const isSignUp = viewMode === 'signup';
  const isForgotPassword = viewMode === 'forgot_password';

  return (
    <>
      {/* 1. Purpose-Built Dedicated Mobile Authentication (< md) */}
      <div className="md:hidden">
        <MobileAuth
          viewMode={viewMode}
          setViewMode={setViewMode}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          loading={loading}
          googleLoading={googleLoading}
          error={error}
          message={message}
          onSubmit={handleAuth}
          onGoogleSignIn={handleGoogleSignIn}
        />
      </div>

      {/* 2. Desktop Authentication Interface (>= md) - PRESERVED 100% */}
      <div className="hidden md:flex min-h-screen bg-slate-950 text-slate-100">
        {/* Left Feature Showcase Panel */}
        <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-brand-950 via-slate-900 to-slate-950 border-r border-slate-800 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-brand-400 to-indigo-300 bg-clip-text text-transparent">
            FLOW
          </span>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tight leading-tight"
          >
            Transform Fragmented Workflows into AI Academic Plans.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-base leading-relaxed"
          >
            Powered by Google Gemini models. Extract deadlines from syllabus PDFs, schedule intelligent 7-day study blocks, and consult your document-aware AI copilot.
          </motion.p>

          <div className="grid grid-cols-1 gap-4 pt-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Instant Syllabus Ingestion</h4>
                <p className="text-xs text-slate-400">Extract assignments & weightages from PDFs and images automatically.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Optimized 7-Day Study Plans</h4>
                <p className="text-xs text-slate-400">Dynamic daily focus blocks prioritized by urgency and course weightage.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Contextual IMvision</h4>
                <p className="text-xs text-slate-400">Query your study documents and manage tasks interactively.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © 2026 FLOW • Built by IMV
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-between bg-slate-950">
        <div className="my-auto flex items-center justify-center p-6 sm:p-12 w-full">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Brand Logo */}
            <div className="flex items-center justify-center gap-2.5 lg:hidden mb-6">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-brand-400 to-indigo-300 bg-clip-text text-transparent">
                FLOW
              </span>
            </div>

            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {isForgotPassword
                  ? 'Reset your password'
                  : isSignUp
                  ? 'Create your account'
                  : 'Welcome back'}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-2">
                {isForgotPassword
                  ? 'Enter your registered email address to receive a secure password reset link.'
                  : isSignUp
                  ? 'Sign up with strong password security to organize your academic workflow.'
                  : 'Enter your credentials to access your academic dashboard.'}
              </p>
            </div>

            {error && (
              <div className="p-4 bg-rose-950/50 border border-rose-800/80 text-rose-400 text-xs rounded-xl animate-fade-in">
                {error}
              </div>
            )}

            {message && (
              <div className="p-4 bg-emerald-950/50 border border-emerald-800/80 text-emerald-400 text-xs rounded-xl animate-fade-in flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email address
                </label>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
                />
              </div>

              {!isForgotPassword && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password-input"
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
                  {isSignUp && <PasswordStrengthMeter password={password} />}
                </div>
              )}

              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-confirm-password-input"
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
              )}

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  'Processing...'
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

            {/* Google Sign In Option — Visible on both Login and Signup */}
            {!isForgotPassword && (
              <div className="space-y-4 pt-1">
                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-slate-800 w-full" />
                  <span className="bg-slate-950 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-500 shrink-0">
                    OR
                  </span>
                  <div className="border-t border-slate-800 w-full" />
                </div>

                <button
                  id="google-signin-btn"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-slate-200 font-medium rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50 shadow-sm min-h-[46px]"
                >
                  {googleLoading ? (
                    <span className="text-slate-300">Signing in with Google...</span>
                  ) : (
                    <>
                      <GoogleIcon className="h-5 w-5 shrink-0" />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                {!isSignUp && (
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('forgot_password');
                        setError('');
                        setMessage('');
                      }}
                      className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1 min-h-[36px] py-1"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Forgot Password?</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-800/80 text-center space-y-2">
              {isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('signin');
                    setError('');
                    setMessage('');
                  }}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  ← Back to Sign In
                </button>
              ) : (
                <button
                  id="toggle-auth-mode-btn"
                  onClick={() => {
                    setViewMode(isSignUp ? 'signin' : 'signup');
                    setError('');
                    setMessage('');
                  }}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium hover:underline transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              )}
            </div>
          </div>
        </div>

        <Footer className="border-t border-slate-800/80 bg-slate-950 text-slate-500 lg:hidden" />
      </div>
    </div>
  </>
);
};
