import React, { useState } from 'react';
import { Bot, Send, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface LemonAssistantPanelProps {
  examId: string;
  subject: string;
  focusedTopic?: string;
}

interface Message {
  role: 'user' | 'lemon';
  text: string;
  usedUploadedSource?: boolean;
}

export const LemonAssistantPanel: React.FC<LemonAssistantPanelProps> = ({
  examId,
  subject,
  focusedTopic
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askLemon = async (questionText?: string) => {
    const q = (questionText ?? input).trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    if (!questionText) setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await api.post(`/study/exams/${examId}/ask-lemon`, {
        question: q,
        topicName: focusedTopic
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'lemon',
          text: res.data?.answer || 'No response generated.',
          usedUploadedSource: res.data?.usedUploadedSource
        }
      ]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'LEMON could not respond right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#101114] border border-white/10 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#18191D]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#FF8A00]/15 text-[#FF9D24]">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">LEMON Contextual AI</h4>
            <p className="text-[10px] text-[#A1A1AA] truncate max-w-[200px]">
              Context: {subject}{focusedTopic ? ` • ${focusedTopic}` : ''}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FF8A00]/10 text-[#FF9D24] border border-[#FF8A00]/20">
          Exam-Aware
        </span>
      </div>

      {/* Quick Prompts */}
      {messages.length === 0 && (
        <div className="p-4 space-y-2">
          <p className="text-xs text-[#A1A1AA]">
            Ask LEMON anything about <strong className="text-white">{subject}</strong>. It uses your uploaded syllabus and notes when available.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              'Summarize key high-yield topics',
              'Explain the hardest concept simply',
              'Give me a 15-minute revision plan'
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => askLemon(prompt)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[#18191D] hover:bg-[#202126] border border-white/10 text-[#A1A1AA] hover:text-white transition-colors flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 text-[#FF9D24]" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#FF8A00]/15 border border-[#FF8A00]/30 text-white ml-6'
                  : 'bg-[#18191D] border border-white/10 text-slate-200 mr-4'
              }`}
            >
              {m.role === 'lemon' && (
                <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold text-[#FF9D24]">
                  <BookOpen className="h-3 w-3" />
                  <span>{m.usedUploadedSource ? 'Using Uploaded Material' : 'General Academic Explanation'}</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="p-3 rounded-xl bg-[#18191D] border border-white/10 text-xs text-[#A1A1AA] animate-pulse">
              LEMON is analysing your exam context...
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mx-4 mb-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-400 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          askLemon();
        }}
        className="p-3 border-t border-white/10 flex items-center gap-2 bg-[#18191D]"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask LEMON about ${subject}...`}
          className="flex-1 px-3 py-2 rounded-xl bg-[#101114] border border-white/10 text-xs text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#FF8A00]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-xl bg-[#FF8A00] hover:bg-[#FF9D24] text-black disabled:opacity-40 transition-colors"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};
