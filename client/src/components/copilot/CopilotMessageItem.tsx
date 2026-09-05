import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  Sparkles,
  User,
  FileText,
  CalendarPlus,
  PlusCircle,
  Clock,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CopilotMessage } from '../../context/CopilotContext';

interface CopilotMessageItemProps {
  message: CopilotMessage;
  userInitial?: string;
  onTaskCreated?: () => void;
}

export const CopilotMessageItem: React.FC<CopilotMessageItemProps> = ({
  message,
  userInitial = 'U',
  onTaskCreated
}) => {
  const isUser = message.role === 'user';
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState('General');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskMinutes, setTaskMinutes] = useState(60);
  const [creatingTask, setCreatingTask] = useState(false);

  // Copy full message
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  // Pre-fill task modal with text excerpt
  const handleOpenTaskModal = () => {
    // Extract first sentence or title from content
    const firstLine = message.content.split('\n').find((l) => l.trim().length > 3) || 'Study Task';
    const cleaned = firstLine.replace(/^[#*-\d.\s]+/, '').slice(0, 80);
    setTaskTitle(cleaned || 'Review Study Material');
    setShowTaskModal(true);
  };

  // Submit new task from Copilot recommendation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || creatingTask) return;

    setCreatingTask(true);
    try {
      // Default deadline: 3 days from now
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 3);

      await api.post('/tasks', {
        title: taskTitle.trim(),
        subject: taskSubject.trim() || 'General',
        deadline: defaultDeadline.toISOString(),
        priority: taskPriority,
        estimatedMinutes: Number(taskMinutes) || 60,
        description: `Created via Flow AI Copilot:\n\n${message.content.slice(0, 300)}...`,
        taskType: 'assignment'
      });

      // Confetti burst for satisfaction
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.75 },
          colors: ['#ff6b00', '#fb923c', '#f59e0b', '#38bdf8']
        });
      } catch (e) {
        // Safe fallback if canvas is not ready
      }

      showToast('Task added to Task Manager! 🎯', 'success');
      setShowTaskModal(false);
      onTaskCreated?.();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create task.', 'error');
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 my-3.5 px-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-brand-500/20 shrink-0">
          {userInitial}
        </div>
      ) : (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-850 dark:to-slate-950 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-md shadow-brand-500/10 shrink-0">
          <Sparkles className="h-4 w-4 text-brand-500 dark:text-brand-400" />
        </div>
      )}

      {/* Message Content Bubble */}
      <div
        className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4 text-sm relative group transition-all ${
          isUser
            ? 'bg-gradient-to-r from-brand-500 to-orange-500 text-white rounded-tr-sm shadow-md shadow-brand-500/20'
            : 'bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800/80 rounded-tl-sm shadow-sm dark:shadow-md backdrop-blur-sm'
        }`}
      >
        {/* Document attached badge (if user query included an attached document) */}
        {message.documents?.file_name && (
          <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-md bg-black/10 dark:bg-brand-500/10 text-[11px] font-medium w-fit">
            <FileText className="h-3 w-3" />
            <span className="truncate max-w-[180px]">{message.documents.file_name}</span>
          </div>
        )}

        {/* Message Text / Markdown */}
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed font-normal">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-normal space-y-2">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-5 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-5 mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="pl-0.5">{children}</li>,
                h1: ({ children }) => <h1 className="text-base font-black text-brand-600 dark:text-brand-400 mt-2 mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold text-brand-600 dark:text-brand-400 mt-2 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mt-2 mb-1">{children}</h3>,
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 text-xs font-mono">
                      {children}
                    </code>
                  ) : (
                    <div className="relative my-2.5 rounded-xl bg-slate-950 p-3 text-xs font-mono text-slate-200 overflow-x-auto border border-slate-800">
                      <code>{children}</code>
                    </div>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-brand-500 pl-3 italic text-slate-600 dark:text-slate-400 my-2">
                    {children}
                  </blockquote>
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Bottom Actions for Assistant Messages */}
        {!isUser && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5">
              {/* Add to Tasks Button */}
              <button
                onClick={handleOpenTaskModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 border border-brand-200 dark:border-brand-500/20 transition-all font-semibold active:scale-95"
                title="Create a task from this response"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Add to Tasks</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Copy Full Message */}
              <button
                onClick={handleCopy}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Copy message"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task Creation Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl max-w-md w-full"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
                  <CalendarPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Add Copilot Task</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Save AI recommendation directly to Task Board</p>
                </div>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Task name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={taskSubject}
                      onChange={(e) => setTaskSubject(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="e.g. CS201"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e: any) => setTaskPriority(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Minutes
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      min={10}
                      step={10}
                      value={taskMinutes}
                      onChange={(e) => setTaskMinutes(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTask}
                    className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-500 to-orange-500 hover:from-brand-600 hover:to-orange-600 rounded-xl shadow-md shadow-brand-500/25 transition-all disabled:opacity-50"
                  >
                    {creatingTask ? 'Adding...' : 'Add to Board 🎯'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
