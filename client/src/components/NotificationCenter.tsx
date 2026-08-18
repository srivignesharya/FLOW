import React, { useState } from 'react';
import { Bell, Check, Sparkles, AlertTriangle, Mail, Calendar, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'deadline' | 'plan' | 'extraction' | 'email' | 'info';
  timestamp: string;
  read: boolean;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Deadline Approaching',
      message: 'Preliminary Assessment is due in 48 hours.',
      type: 'deadline',
      timestamp: '10m ago',
      read: false
    },
    {
      id: 'notif-2',
      title: 'AI Tasks Extracted',
      message: 'Successfully extracted 3 tasks from Syllabus PDF.',
      type: 'extraction',
      timestamp: '1h ago',
      read: false
    },
    {
      id: 'notif-3',
      title: 'Email Reminder System Active',
      message: 'SMTP & Resend HTTPS dispatch verified cleanly.',
      type: 'email',
      timestamp: '2h ago',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'deadline':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'plan':
        return <Calendar className="h-4 w-4 text-indigo-500" />;
      case 'extraction':
        return <Sparkles className="h-4 w-4 text-brand-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-emerald-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 sm:hidden bg-slate-950/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-x-3.5 top-16 sm:top-auto sm:inset-auto sm:absolute sm:right-0 mt-2 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/10 dark:shadow-slate-950/50 z-50 overflow-hidden"
            >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium flex items-center gap-1 hover:underline"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No notifications available
                </div>
              ) : (
                notifications.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 flex gap-3 transition-colors ${
                      item.read
                        ? 'bg-transparent text-slate-500'
                        : 'bg-brand-50/30 dark:bg-brand-950/20 text-slate-900 dark:text-slate-100 font-medium'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">{item.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
