import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Trash2, Sparkles, Loader2, MessageSquare, Compass } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const QUICK_QUESTIONS = [
  'When is my next deadline?',
  'What should I study today?',
  'Which task is most urgent?',
  'Summarize my upcoming assignments'
];

export const Copilot: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const fetchHistory = async () => {
    try {
      const res = await api.get('/copilot/history');
      setMessages(res.data);
    } catch (err) {
      console.error(err);
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
        documentId: selectedDocId || undefined
      });

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.reply,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('[Copilot Request Error]:', err);
      const errMsg = err.response?.data?.error || 'Gemini API quota exceeded. Please try again later or use another API key.';
      showToast(errMsg, 'error');

      // Append friendly message to chat instead of raw JSON error
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ **${errMsg}**`,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Clear entire chat history?')) return;
    try {
      await api.delete('/copilot/history');
      setMessages([]);
      showToast('Chat history cleared', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to clear chat history', 'error');
    }
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col space-y-4 max-w-4xl mx-auto animate-in">
      {/* Top Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
            <span>AI Copilot</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold border border-brand-200 dark:border-brand-900/50">
              Gemini 2.5 Pro Context
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Contextual assistant with full awareness of your assignments, deadlines, & study plan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="select text-xs py-1.5 max-w-[200px]"
          >
            <option value="">No document attached</option>
            {documents.map(d => (
              <option key={d.id} value={d.id}>📄 {d.file_name}</option>
            ))}
          </select>

          <button
            onClick={handleClearHistory}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Message History Container */}
      <div className="flex-1 card p-4 overflow-y-auto space-y-4 bg-slate-900/40 border-slate-800">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`flex gap-3 max-w-[85%] ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-md ${
                msg.role === 'user'
                  ? 'bg-brand-600'
                  : 'bg-gradient-to-tr from-indigo-600 to-purple-600'
              }`}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 animate-pulse" />}
              </div>

              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-none prose-flow'
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

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 max-w-[85%]"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0">
              <Bot className="h-4 w-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-slate-400 text-sm flex items-center gap-1.5 rounded-tl-none">
              <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs ml-2 font-medium text-slate-400">Gemini is thinking...</span>
            </div>
          </motion.div>
        )}

        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-4 p-8">
            <div className="p-4 rounded-2xl bg-brand-950/40 text-brand-400 border border-brand-900/50">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-300">How can Flow Copilot help today?</h3>
              <p className="text-xs max-w-sm">
                Ask questions about your deadlines, study workload, or specific document content.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        <span className="text-[11px] font-semibold text-slate-400 uppercase shrink-0 flex items-center gap-1">
          <Compass className="h-3 w-3" /> Quick Prompts:
        </span>
        {QUICK_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/80 shrink-0 transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="shrink-0 flex items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask Copilot anything about your academic schedule..."
          className="input flex-1 py-3"
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="btn-primary py-3 px-5 shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
