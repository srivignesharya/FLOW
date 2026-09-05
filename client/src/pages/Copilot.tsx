import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Bot,
  Send,
  Paperclip,
  Trash2,
  FileText,
  Check,
  ChevronDown,
  Zap,
  Calendar,
  BookOpen,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
  X
} from 'lucide-react';
import { useCopilot } from '../context/CopilotContext';
import { useAuth } from '../context/AuthContext';
import { CopilotMessageItem } from '../components/copilot/CopilotMessageItem';
import { CopilotThinkingIndicator } from '../components/copilot/CopilotThinkingIndicator';

const SUGGESTED_PROMPTS = [
  {
    icon: Zap,
    label: 'What should I focus on studying today?',
    prompt: 'Based on my active course deadlines and study schedule, what specific subjects and tasks should I study today?'
  },
  {
    icon: Calendar,
    label: 'Break down upcoming deadlines by priority',
    prompt: 'Analyze all my registered assignments and exams. Sort them by urgency and give me a clear preparation roadmap.'
  },
  {
    icon: BookOpen,
    label: 'Summarize key concepts from attached syllabus',
    prompt: 'Summarize the core topics, weighted deliverables, and examination structure from my selected document.'
  },
  {
    icon: BrainCircuit,
    label: 'Generate a 3-hour Pomodoro study sprint',
    prompt: 'Build a high-productivity 3-hour study session with 45-minute focus intervals and 10-minute breaks targeted at my most critical tasks.'
  }
];

export const Copilot: React.FC = () => {
  const {
    messages,
    loading,
    historyLoading,
    activeDocumentId,
    documents,
    setActiveDocumentId,
    sendMessage,
    clearHistory
  } = useCopilot();

  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedDoc = documents.find((d) => d.id === activeDocumentId);
  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    const query = inputText;
    setInputText('');
    await sendMessage(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-5.5rem)] flex flex-col max-w-6xl mx-auto space-y-4">
      {/* Top Workstation Header */}
      <div className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shrink-0 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-brand-500 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 border border-brand-400/20 shrink-0">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                AI Academic Copilot
              </h1>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Autonomous context-aware study architect powered by Gemini AI
            </p>
          </div>
        </div>

        {/* Right Controls: Document Selector & Clear Chat */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Document Context Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDocPicker(!showDocPicker)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                selectedDoc
                  ? 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span className="max-w-[140px] truncate">
                {selectedDoc ? selectedDoc.file_name : 'Attach Document Context'}
              </span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showDocPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 text-xs"
                >
                  <p className="px-3 py-1.5 font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                    Select Context Document
                  </p>

                  <button
                    onClick={() => {
                      setActiveDocumentId(null);
                      setShowDocPicker(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                      !activeDocumentId
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>General Academic Context (All Docs)</span>
                    {!activeDocumentId && <Check className="h-3.5 w-3.5 text-brand-500" />}
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {documents.length === 0 ? (
                      <p className="px-3 py-4 text-center text-slate-400 italic text-[11px]">
                        No course documents uploaded yet. Upload in Ingest Studio!
                      </p>
                    ) : (
                      documents.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => {
                            setActiveDocumentId(doc.id);
                            setShowDocPicker(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                            activeDocumentId === doc.id
                              ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <FileText className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                            <span className="truncate">{doc.file_name}</span>
                          </div>
                          {activeDocumentId === doc.id && <Check className="h-3.5 w-3.5 text-brand-500 shrink-0" />}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Clear History Button */}
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            disabled={messages.length === 0}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title="Clear Chat History"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Clear Confirmation Banner */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card bg-rose-500/10 border-rose-500/30 p-3 sm:px-5 flex items-center justify-between text-xs"
          >
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              Are you sure you want to clear your Copilot conversation history?
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/30"
              >
                Clear History
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Conversational Workspace */}
      <div className="flex-1 card p-0 flex flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm min-h-0">
        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 min-h-0">
          {historyLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
              <Sparkles className="h-7 w-7 text-brand-500 animate-spin" />
              <p className="font-medium">Connecting to Gemini AI and synchronizing syllabus context...</p>
            </div>
          ) : messages.length === 0 ? (
            /* Welcoming Empty State */
            <div className="h-full flex flex-col justify-center items-center text-center p-4 max-w-xl mx-auto space-y-6">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 via-orange-500/20 to-amber-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative h-18 w-18 rounded-3xl bg-gradient-to-tr from-brand-500 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 border border-brand-400/30">
                  <Sparkles className="h-9 w-9 animate-pulse" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Welcome to your Academic Copilot
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                  Ask me questions about your uploaded course syllabi, plan study sprints, or let me synthesize your upcoming deadlines into structured steps.
                </p>
              </div>

              {/* Quick Suggestion Cards */}
              <div className="w-full space-y-2.5 text-left">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Try one of these prompts
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SUGGESTED_PROMPTS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => sendMessage(item.prompt)}
                        className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 hover:bg-brand-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 hover:border-brand-500/40 transition-all text-xs text-left shadow-sm group"
                      >
                        <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-colors shrink-0 mt-0.5">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug">
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <CopilotMessageItem
                  key={msg.id || index}
                  message={msg}
                  userInitial={userInitial}
                />
              ))}
              {loading && <CopilotThinkingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shrink-0">
          {selectedDoc && (
            <div className="flex items-center justify-between mb-3 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                  Active Document Context: <strong className="text-brand-600 dark:text-brand-400 font-bold">{selectedDoc.file_name}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveDocumentId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0 ml-2"
                title="Detach context"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="relative flex items-end gap-2.5">
            <div className="relative flex-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedDoc
                    ? `Ask Copilot questions specifically about "${selectedDoc.file_name}"...`
                    : 'Ask anything about your coursework, assignments, or study strategy...'
                }
                className="w-full px-4 py-3 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none max-h-36 min-h-[48px]"
                style={{ height: 'auto', minHeight: '48px' }}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              disabled={!inputText.trim() || loading}
              className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-500 via-orange-500 to-amber-500 hover:from-brand-600 hover:to-orange-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
              title="Send message (Enter)"
            >
              <Send className="h-5 w-5" />
            </motion.button>
          </form>

          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 px-1">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Enter ↵</kbd> to send</span>
            <span>Supports rich Markdown, Code snippets, & Task auto-conversion</span>
          </div>
        </div>
      </div>
    </div>
  );
};
