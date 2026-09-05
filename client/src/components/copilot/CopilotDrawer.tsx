import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  Send,
  Paperclip,
  FileText,
  ChevronDown,
  Check,
  Zap,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  BrainCircuit
} from 'lucide-react';
import { useCopilot, CopilotDocument } from '../../context/CopilotContext';
import { useAuth } from '../../context/AuthContext';
import { CopilotMessageItem } from './CopilotMessageItem';
import { CopilotThinkingIndicator } from './CopilotThinkingIndicator';

const SUGGESTED_PROMPTS = [
  {
    icon: Zap,
    label: 'What should I focus on today?',
    prompt: 'Based on my stored tasks and schedule, what should I study and prioritize today?'
  },
  {
    icon: Calendar,
    label: 'Break down my closest deadlines',
    prompt: 'Review my active deadlines and organize them in order of urgency with study recommendations.'
  },
  {
    icon: BookOpen,
    label: 'Summarize attached document',
    prompt: 'Provide a clear, structured summary of the key concepts and exam topics in my selected document.'
  },
  {
    icon: BrainCircuit,
    label: 'Create a 3-hour revision sprint',
    prompt: 'Design a high-yield 3-hour study session with 45-min focus blocks and short breaks for my top priority tasks.'
  }
];

export const CopilotDrawer: React.FC = () => {
  const {
    isOpen,
    isExpanded,
    messages,
    loading,
    historyLoading,
    activeDocumentId,
    documents,
    closeCopilot,
    toggleExpand,
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

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    const textToSend = inputText;
    setInputText('');
    await sendMessage(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeCopilot}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer / Fullscreen Container */}
      <div
        className={`fixed inset-y-0 right-0 flex max-w-full pointer-events-none transition-all duration-300 ${
          isExpanded ? 'p-2 sm:p-6 items-center justify-center w-full' : ''
        }`}
      >
        <motion.div
          initial={{ x: isExpanded ? 0 : '100%', opacity: isExpanded ? 0 : 1, scale: isExpanded ? 0.96 : 1 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: isExpanded ? 0 : '100%', opacity: 0, scale: isExpanded ? 0.96 : 1 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className={`pointer-events-auto flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl shadow-black/30 overflow-hidden ${
            isExpanded
              ? 'w-full max-w-5xl h-full max-h-[92vh] rounded-3xl'
              : 'w-full sm:w-[500px] lg:w-[560px] h-full sm:rounded-l-3xl border-r-0'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-lg shrink-0">
            {/* Title & Live Status */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25 border border-brand-400/20 shrink-0">
                <Sparkles className="h-5 w-5 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight truncate">
                    Flow AI Copilot
                  </h2>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  Context-aware academic intelligence
                </p>
              </div>
            </div>

            {/* Actions: Doc Selector, Clear, Expand, Close */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Document Picker Dropdown Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDocPicker(!showDocPicker)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    selectedDoc
                      ? 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400'
                      : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Attach document context"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {selectedDoc ? selectedDoc.file_name : 'Attach Doc'}
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
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 text-xs"
                    >
                      <p className="px-2.5 py-1.5 font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                        Document Context
                      </p>

                      <button
                        onClick={() => {
                          setActiveDocumentId(null);
                          setShowDocPicker(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                          !activeDocumentId
                            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>No specific document</span>
                        {!activeDocumentId && <Check className="h-3.5 w-3.5 text-brand-500" />}
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                      <div className="max-h-48 overflow-y-auto space-y-0.5">
                        {documents.length === 0 ? (
                          <p className="px-2.5 py-3 text-center text-slate-400 italic text-[11px]">
                            No documents uploaded yet. Upload in Ingest Studio!
                          </p>
                        ) : (
                          documents.map((doc) => (
                            <button
                              key={doc.id}
                              onClick={() => {
                                setActiveDocumentId(doc.id);
                                setShowDocPicker(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                                activeDocumentId === doc.id
                                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <FileText className="h-3.5 w-3.5 shrink-0 text-brand-500" />
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

              {/* Clear Chat History */}
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                disabled={messages.length === 0}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Expand / Minimize Fullscreen */}
              <button
                type="button"
                onClick={toggleExpand}
                className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isExpanded ? 'Minimize drawer' : 'Expand full screen'}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeCopilot}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close Copilot (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Confirm Clear Modal */}
          <AnimatePresence>
            {showClearConfirm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-500/10 border-b border-rose-500/20 px-5 py-3 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  Clear entire conversation history?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      clearHistory();
                      setShowClearConfirm(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  >
                    Clear All
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 min-h-0">
            {historyLoading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
                <Sparkles className="h-6 w-6 text-brand-500 animate-spin" />
                <p>Loading academic context...</p>
              </div>
            ) : messages.length === 0 ? (
              /* Empty Welcoming State */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col justify-center items-center text-center p-4 max-w-md mx-auto space-y-6"
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 via-orange-500/20 to-amber-500/20 rounded-full blur-xl" />
                  <div className="relative h-16 w-16 rounded-3xl bg-gradient-to-tr from-brand-500 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 border border-brand-400/30">
                    <Sparkles className="h-8 w-8 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    What can I help you conquer today?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    I have full context of your registered coursework, deadlines, and active study plans.
                  </p>
                </div>

                {/* Quick Prompts */}
                <div className="w-full space-y-2 text-left">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Suggested Quick Actions
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {SUGGESTED_PROMPTS.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.015, x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handlePromptClick(item.prompt)}
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 hover:border-brand-500/30 transition-all text-xs group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-colors shrink-0">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                              {item.label}
                            </span>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Message List */
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

          {/* Footer Input Area */}
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shrink-0">
            {/* Active Document Badge (if attached) */}
            {selectedDoc && (
              <div className="flex items-center justify-between mb-2.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                    Attached Context: <strong className="text-brand-600 dark:text-brand-400 font-bold">{selectedDoc.file_name}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDocumentId(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0 ml-2"
                  title="Remove document context"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Input Bar Form */}
            <form onSubmit={handleSend} className="relative flex items-end gap-2">
              <div className="relative flex-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedDoc
                      ? `Ask Copilot about "${selectedDoc.file_name}"...`
                      : 'Ask anything about deadlines, syllabi, or coursework...'
                  }
                  className="w-full px-3.5 py-3 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none max-h-32 min-h-[44px]"
                  style={{ height: 'auto', minHeight: '44px' }}
                />
              </div>

              {/* Send Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!inputText.trim() || loading}
                className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-brand-500 via-orange-500 to-amber-500 hover:from-brand-600 hover:to-orange-600 text-white flex items-center justify-center shadow-md shadow-brand-500/30 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
                title="Send message (Enter)"
              >
                <Send className="h-4 w-4" />
              </motion.button>
            </form>

            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 px-1">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[9px]">Enter ↵</kbd> to send</span>
              <span><kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[9px]">Ctrl+J</kbd> toggles Copilot</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
