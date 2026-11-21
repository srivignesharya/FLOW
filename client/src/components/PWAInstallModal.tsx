import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Sparkles, Check, ArrowRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallModal: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if the application is already running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) {
      return;
    }

    // Check if user previously dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem('flow_pwa_dismissed_at');
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        return;
      }
    }

    // Listen for the official beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Delay showing the prompt so the user isn't interrupted upon immediate page load
      setTimeout(() => {
        setIsVisible(true);
      }, 3500);
    };

    // Listen for appinstalled event to auto-hide
    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      localStorage.setItem('flow_pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback if beforeinstallprompt is not directly triggered (e.g., iOS Safari)
      setIsVisible(false);
      return;
    }

    try {
      // Trigger the saved browser installation prompt
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        localStorage.setItem('flow_pwa_installed', 'true');
      } else {
        localStorage.setItem('flow_pwa_dismissed_at', Date.now().toString());
      }
    } catch (err) {
      console.warn('[PWA] Error launching install prompt:', err);
    } finally {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('flow_pwa_dismissed_at', Date.now().toString());
  };

  if (isStandalone || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[#101114] border border-[#27272A] rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white"
          >
            {/* Ambient Brand Orange Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF8A00]/10 rounded-full blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Maybe later"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Logo and App Title */}
            <div className="flex items-center gap-3.5 mb-4">
              <img
                src="/flow-wing-logo.jpg"
                alt="FLOW Logo"
                className="w-14 h-14 rounded-2xl object-contain bg-black border border-[#27272A] p-0.5 shadow-lg shadow-[#FF8A00]/20 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black tracking-tight text-white">Install FLOW</h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FF8A00]/15 text-[#FF9D24] border border-[#FF8A00]/30">
                    PWA
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA]">FLOW — Powered by IMV</p>
              </div>
            </div>

            {/* Explanation Copy */}
            <p className="text-sm text-slate-300 leading-relaxed mb-5">
              Get the full FLOW experience directly from your device. Access your academic workspace like a native app.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-2 mb-6 bg-[#18191E] p-3.5 rounded-2xl border border-[#27272A]/80 text-xs">
              <div className="flex items-center gap-2 text-[#A1A1AA]">
                <Check className="h-3.5 w-3.5 text-[#FF8A00] shrink-0" />
                <span>Instant offline access to study schedules & tasks</span>
              </div>
              <div className="flex items-center gap-2 text-[#A1A1AA]">
                <Check className="h-3.5 w-3.5 text-[#FF8A00] shrink-0" />
                <span>Full-screen distraction-free workspace</span>
              </div>
              <div className="flex items-center gap-2 text-[#A1A1AA]">
                <Check className="h-3.5 w-3.5 text-[#FF8A00] shrink-0" />
                <span>Fast home screen launch on mobile and desktop</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF8A00] via-[#FF9D24] to-[#FF8A00] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#FF8A00]/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                <span>Install FLOW</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:w-auto py-3 px-4 rounded-xl text-xs font-semibold text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallModal;
