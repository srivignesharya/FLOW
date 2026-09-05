import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export interface CopilotMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  document_id?: string | null;
  documents?: {
    file_name: string;
  };
}

export interface CopilotDocument {
  id: string;
  file_name: string;
  file_type?: string;
  created_at?: string;
}

interface CopilotContextType {
  isOpen: boolean;
  isExpanded: boolean;
  messages: CopilotMessage[];
  loading: boolean;
  historyLoading: boolean;
  activeDocumentId: string | null;
  documents: CopilotDocument[];
  openCopilot: () => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
  toggleExpand: () => void;
  setActiveDocumentId: (id: string | null) => void;
  sendMessage: (query: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  loadHistory: () => Promise<void>;
  loadDocuments: () => Promise<void>;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

export const CopilotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<CopilotDocument[]>([]);

  // Open / Close / Toggle handlers
  const openCopilot = useCallback(() => setIsOpen(true), []);
  const closeCopilot = useCallback(() => setIsOpen(false), []);
  const toggleCopilot = useCallback(() => setIsOpen((prev) => !prev), []);
  const toggleExpand = useCallback(() => setIsExpanded((prev) => !prev), []);

  // Fetch Documents available for context
  const loadDocuments = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, file_name, file_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      console.error('[Copilot] Failed to fetch documents:', err.message);
    }
  }, [user]);

  // Fetch Message History
  const loadHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const res = await api.get('/copilot/history');
      if (Array.isArray(res.data)) {
        setMessages(res.data);
      }
    } catch (err: any) {
      console.error('[Copilot] Failed to load chat history:', err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  // Initial load when user signs in
  useEffect(() => {
    if (user) {
      loadDocuments();
      loadHistory();
    } else {
      setMessages([]);
      setDocuments([]);
      setIsOpen(false);
      setIsExpanded(false);
    }
  }, [user, loadDocuments, loadHistory]);

  // Keyboard shortcut listener (Ctrl+J or Cmd+J to toggle, Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing inside an input or textarea unless it's the hotkey
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Send message to Gemini Copilot
  const sendMessage = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    // Optimistic user message addition
    const optimisticMsg: CopilotMessage = {
      role: 'user',
      content: trimmed,
      document_id: activeDocumentId,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setLoading(true);

    try {
      const res = await api.post('/copilot/chat', {
        query: trimmed,
        documentId: activeDocumentId || null
      });

      const assistantMsg: CopilotMessage = {
        role: 'assistant',
        content: res.data.reply || 'No response received from Copilot.',
        document_id: activeDocumentId,
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to get a response from Copilot. Please try again.';
      showToast(errorMsg, 'error');

      // Add failure notice message in chat
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Error**: ${errorMsg}`,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Clear conversation history
  const clearHistory = async () => {
    try {
      await api.delete('/copilot/history');
      setMessages([]);
      showToast('Chat history cleared', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to clear chat history.', 'error');
    }
  };

  return (
    <CopilotContext.Provider
      value={{
        isOpen,
        isExpanded,
        messages,
        loading,
        historyLoading,
        activeDocumentId,
        documents,
        openCopilot,
        closeCopilot,
        toggleCopilot,
        toggleExpand,
        setActiveDocumentId,
        sendMessage,
        clearHistory,
        loadHistory,
        loadDocuments
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
};

export const useCopilot = (): CopilotContextType => {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error('useCopilot must be used within a CopilotProvider');
  }
  return context;
};
