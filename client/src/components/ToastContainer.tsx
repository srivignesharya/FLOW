import React from 'react';
import { Toaster, toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '12px 16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          fontSize: '14px',
          fontWeight: 500
        }
      }}
    />
  );
};

export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  switch (type) {
    case 'success':
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-slate-900 border border-emerald-500/30 shadow-2xl shadow-emerald-950/40 rounded-2xl pointer-events-auto flex items-center gap-3 p-4 text-slate-100 text-sm`}
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex-1 font-medium">{message}</div>
          </div>
        ),
        { id: message }
      );
      break;

    case 'error':
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-slate-900 border border-rose-500/30 shadow-2xl shadow-rose-950/40 rounded-2xl pointer-events-auto flex items-center gap-3 p-4 text-slate-100 text-sm`}
          >
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 font-medium">{message}</div>
          </div>
        ),
        { id: message }
      );
      break;

    case 'warning':
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-slate-900 border border-amber-500/30 shadow-2xl shadow-amber-950/40 rounded-2xl pointer-events-auto flex items-center gap-3 p-4 text-slate-100 text-sm`}
          >
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 font-medium">{message}</div>
          </div>
        ),
        { id: message }
      );
      break;

    case 'info':
    default:
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-slate-900 border border-brand-500/30 shadow-2xl shadow-brand-950/40 rounded-2xl pointer-events-auto flex items-center gap-3 p-4 text-slate-100 text-sm`}
          >
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 shrink-0">
              <Info className="h-5 w-5" />
            </div>
            <div className="flex-1 font-medium">{message}</div>
          </div>
        ),
        { id: message }
      );
      break;
  }
};

export const triggerCelebration = () => {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff7a00', '#6366f1', '#10b981', '#f59e0b']
    });
  } catch (e) {
    // Ignore if canvas confetti not available
  }
};
