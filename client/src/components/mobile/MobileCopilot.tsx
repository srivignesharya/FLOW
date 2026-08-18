import React, { useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Trash2, 
  Sparkles, 
  FileText, 
  Calendar, 
  HelpCircle, 
  Clock,
  ArrowUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface MobileCopilotProps {
  user: any;
  messages: Message[];
  loading: boolean;
  query: string;
  setQuery: (q: string) => void;
  onSend: (text?: string) => void;
  onClearHistory: () => void;
  documents: any[];
  selectedDocId: string;
  setSelectedDocId: (id: string) => void;
}

const QUICK_ACTIONS = [
  { icon: FileText, label: 'Summarize PDF', query: 'Summarize the core takeaways and commitments from my uploaded course document.' },
  { icon: Calendar, label: 'Plan My Day', query: 'Create a focused 3-block study plan for my highest priority upcoming tasks.' },
  { icon: HelpCircle, label: 'Explain Topic', query: 'Explain the most complex topic in my current syllabus in simple, intuitive steps.' },
  { icon: Clock, label: 'Find Deadlines', query: 'List all my upcoming assignments and exam deadlines due in the next 7 days.' }
];

export const MobileCopilot: React.FC<MobileCopilotProps> = ({
  user,
  messages,
  loading,
  query,
  setQuery,
  onSend,
  onClearHistory,
  documents,
  selectedDocId,
  setSelectedDocId
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Scholar';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    onSend();
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] max-w-lg mx-auto">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between pb-3 pt-1 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black text-slate-900 dark:text-white">IMvision</h1>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                Gemini 2.5
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Your Academic AI Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {documents.length > 0 && (
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="text-[11px] py-1 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 max-w-[130px] truncate"
            >
              <option value="">No doc</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>📄 {d.file_name}</option>
              ))}
            </select>
          )}

          {messages.length > 0 && (
            <button
              onClick={onClearHistory}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Messages List / Welcome Hero */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3.5">
        {messages.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-3 py-6 space-y-6">
            {/* Glowing Orb */}
            <div className="relative">
              <div className="absolute -inset-4 bg-orange-500/25 rounded-full blur-2xl animate-pulse" />
              <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 border border-white/20">
                <Bot className="h-10 w-10" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-xs">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Hi {firstName}, I'm <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">IMvision</span>.
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                How can I help you excel today? Ask about your course syllabus, revision, or study schedule.
              </p>
            </div>

            {/* Quick Action Chips */}
            <div className="grid grid-cols-2 gap-2 w-full pt-2">
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => onSend(action.query)}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500/40 text-left space-y-1.5 shadow-xs active:scale-[0.98] transition-all"
                >
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 w-fit">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{action.label}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-2.5 max-w-[95%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-orange-500'
                    : 'bg-gradient-to-tr from-orange-500 to-amber-500'
                }`}>
                  {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white rounded-tr-none font-medium shadow-md shadow-orange-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-none shadow-xs prose-flow'
                }`}>
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {loading && (
          <div className="flex gap-2.5 max-w-[95%]">
            <div className="h-7 w-7 rounded-xl bg-orange-500 flex items-center justify-center text-white shrink-0">
              <Bot className="h-3.5 w-3.5 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs flex items-center gap-1.5 rounded-tl-none">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-[11px] ml-1 text-slate-500">IMvision is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Sticky Bottom Input Box */}
      <form onSubmit={handleSubmit} className="pt-2 pb-1 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask IMvision anything..."
          className="flex-1 py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-xs"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="h-11 w-11 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-orange-500/25 active:scale-[0.95] transition-all shrink-0"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default MobileCopilot;
