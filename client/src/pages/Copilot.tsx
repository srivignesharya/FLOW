import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { showToast, triggerCelebration } from '../components/ToastContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionButton } from '../components/MotionButton';
import { InteractiveCard } from '../components/InteractiveCard';
import { Send, Bot, User, Trash2, Sparkles, Loader2, Compass, BookOpen, Calendar, HelpCircle, FileText, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { useAuth } from '../context/AuthContext';
import { MobileCopilot } from '../components/mobile/MobileCopilot';

const QUICK_ACTIONS = [
  { label: 'Summarize PDF', query: 'Can you summarize the uploaded PDF syllabus and list key topics?', icon: FileText },
  { label: 'Generate Study Plan', query: 'Generate an optimized study plan for my upcoming exams', icon: Calendar },
  { label: 'Explain Topic', query: 'Explain the core concepts of my most urgent assignment', icon: BookOpen },
  { label: 'Revision Plan', query: 'Create a quick revision plan for high priority tasks', icon: Zap },
  { label: 'Ask Questions', query: 'What should I prioritize studying today?', icon: HelpCircle }
];

export const Copilot: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/copilot/history');
      setMessages(res.data);
    } catch (err) {
      console.error('[IMvision History Error]:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/tasks');
      const docsMap: Record<string, any> = {};
      res.data.forEach((t: any) => {
        if (t.documents) {
          docsMap[t.document_id] = t.documents;
        }
      });
      setDocuments(Object.keys(docsMap).map(id => ({ id, ...docsMap[id] })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customQuery?: string) => {
    const textToSend = customQuery || query;
    if (!textToSend.trim() || loading) return;

    if (!customQuery) setQuery('');
    setLoading(true);

    const tempUserMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.post('/copilot/chat', {
        query: textToSend,
        documentId: selectedDocId || null
      });

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.reply,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('[IMvision Error]:', err);
      const errorMsg = err.response?.data?.error || 'IMvision service temporarily unavailable. Please try again.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.delete('/copilot/history');
      setMessages([]);
      showToast('IMvision chat history cleared', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to clear chat history', 'error');
    }
  };

  return (
    <>
      {/* 1. Purpose-Built Mobile IMvision Assistant (< md) */}
      <div className="md:hidden">
        <MobileCopilot
          user={user}
          messages={messages}
          loading={loading}
          query={query}
          setQuery={setQuery}
          onSend={handleSend}
          onClearHistory={handleClearHistory}
          documents={documents}
          selectedDocId={selectedDocId}
          setSelectedDocId={setSelectedDocId}
        />
      </div>

      {/* 2. Desktop IMvision Chat Interface (>= md) */}
      <div className="hidden md:flex flex-col h-[calc(100vh-9rem)] max-w-5xl mx-auto space-y-3 min-h-0">
        {/* Top Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span>IMvision</span>
              <span className="text-xs px-3 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 font-bold border border-brand-500/20">
                Academic AI
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Your intelligent academic assistant built into FLOW.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="select text-xs py-1.5 max-w-[200px]"
            >
              <option value="">No doc attached</option>
              {documents.map(d => (
                <option key={d.id} value={d.id}>📄 {d.file_name}</option>
              ))}
            </select>

            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Clear Chat History"
                aria-label="Clear chat history"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Chat Area Card */}
        <div className="flex-1 card p-4 overflow-hidden flex flex-col min-h-0 bg-white/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 backdrop-blur-xl">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
            {messages.length === 0 && !loading ? (
              /* Centered Welcome Page Screen */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto space-y-5">
                <div className="relative">
                  <div className="absolute -inset-3 bg-brand-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-brand-500 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 border border-white/20">
                    <Bot className="h-8 w-8 sm:h-10 sm:w-10" />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Hi, I'm <span className="bg-gradient-to-r from-brand-500 to-amber-500 bg-clip-text text-transparent">IMvision</span>.
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                    How can I help you excel today? Ask about your course syllabus, revision, concepts, or deadlines.
                  </p>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full pt-1">
                  {QUICK_ACTIONS.map((action, idx) => (
                    <InteractiveCard
                      key={idx}
                      onClick={() => handleSend(action.query)}
                      className="p-3 text-left border-slate-200 dark:border-slate-800 hover:border-brand-500/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0">
                          <action.icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">{action.label}</span>
                      </div>
                    </InteractiveCard>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`flex gap-3 max-w-[85%] ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-md ${
                      msg.role === 'user'
                        ? 'bg-brand-500'
                        : 'bg-gradient-to-tr from-brand-600 via-orange-500 to-amber-500'
                    }`}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    <div className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-orange-gradient text-white rounded-tr-none font-medium'
                        : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-none prose-flow'
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
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 max-w-[85%]"
              >
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand-500 to-amber-500 flex items-center justify-center text-white shrink-0">
                  <Bot className="h-4 w-4 animate-spin" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-400 text-xs sm:text-sm flex items-center gap-1.5 rounded-tl-none">
                  <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs ml-2 font-medium text-slate-500 dark:text-slate-300">IMvision is thinking...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Box */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="shrink-0 flex items-center gap-2 sm:gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask IMvision anything..."
            className="input flex-1 py-3 text-xs sm:text-sm"
          />
          <MotionButton
            type="submit"
            disabled={loading || !query.trim()}
            isLoading={loading}
            icon={<Send className="h-4 w-4" />}
            className="min-h-[44px] shrink-0"
          >
            <span className="hidden sm:inline">Send</span>
          </MotionButton>
        </form>
      </div>
    </>
  );
};
