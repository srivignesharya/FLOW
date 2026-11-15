import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  Bot,
  Activity,
  Cpu,
  Mail,
  Database,
  Search,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ExternalLink,
  Zap,
  Filter,
  Check,
  X,
  Sparkles,
  AlertTriangle,
  Play,
  Send,
  Eye,
  FileCode,
  Calendar,
  Layers,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';
import api from '../services/api';
import { showToast } from '../components/ToastContainer';
import confetti from 'canvas-confetti';

interface SystemStats {
  summary: {
    totalUsers: number;
    recentSignups: number;
    totalDocs: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    highPriorityTasks: number;
    totalMessages: number;
    activeSchedules: number;
  };
  activityTrend: Array<{ date: string; label: string; tasks: number; users: number }>;
  systemHealth: {
    groq: { status: string; primaryModel: string; fallbackModel: string };
    gemini: { status: string; model: string };
    database: { status: string; provider: string };
    emailService: { status: string; provider: string; sender: string };
  };
}

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  institution: string;
  preferredStudyHours: number;
  role: 'admin' | 'student';
  createdAt: string;
  lastSignInAt: string;
  tasksCount: number;
  documentsCount: number;
  messagesCount: number;
}

interface AdminDocument {
  id: string;
  fileName: string;
  fileType: string;
  createdAt: string;
  userEmail: string;
  userName: string;
  hasText: boolean;
  textLength: number;
  tasksGenerated: number;
}

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'documents' | 'ai' | 'diagnostics'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SystemStats | null>(null);

  // Users Tab State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'student'>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Documents Tab State
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [docSearch, setDocSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{ id: string; fileName: string; rawText: string } | null>(null);
  const [loadingDocPreview, setLoadingDocPreview] = useState(false);

  // AI Benchmark Tab State
  const [testPrompt, setTestPrompt] = useState('Outline a 3-day revision roadmap for Data Structures and Algorithms with Big-O analysis.');
  const [testModelProvider, setTestModelProvider] = useState<'auto' | 'gemini' | 'groq'>('auto');
  const [aiBenchmarkLoading, setAiBenchmarkLoading] = useState(false);
  const [aiBenchmarkResult, setAiBenchmarkResult] = useState<any>(null);

  // Diagnostics Tab State
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailSubject, setTestEmailSubject] = useState('FLOW System Operational Notice');
  const [testEmailMessage, setTestEmailMessage] = useState('This is a verified test dispatch from the Flow Administrator Console.');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Load all telemetry data
  const loadDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [statsRes, usersRes, docsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/documents')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data?.users || []);
      setDocuments(docsRes.data || []);
      if (isSilent) {
        showToast('Telemetry data synchronized.', 'success');
      }
    } catch (err: any) {
      console.error('[ADMIN LOAD ERROR]:', err);
      showToast(err.response?.data?.error || 'Failed to synchronize admin telemetry.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Change user role
  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'student') => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
      }
      showToast(`User role updated to "${newRole.toUpperCase()}".`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update user role.', 'error');
    }
  };

  // Delete user account
  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete account: ${email}? This cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
      showToast(`User ${email} deleted successfully.`, 'info');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete user.', 'error');
    }
  };

  // Preview Document Raw Text
  const handlePreviewDocument = async (docId: string, fileName: string) => {
    setLoadingDocPreview(true);
    try {
      const res = await api.get(`/admin/documents/${docId}/preview`);
      setPreviewDoc({
        id: docId,
        fileName,
        rawText: res.data?.raw_text_content || 'No text extracted for this document.'
      });
    } catch (err: any) {
      showToast('Failed to load document text preview.', 'error');
    } finally {
      setLoadingDocPreview(false);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (docId: string, fileName: string) => {
    if (!window.confirm(`Delete document "${fileName}" from the system?`)) return;

    try {
      await api.delete(`/admin/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (previewDoc?.id === docId) setPreviewDoc(null);
      showToast(`Document "${fileName}" purged.`, 'info');
    } catch (err: any) {
      showToast('Failed to delete document.', 'error');
    }
  };

  // Run AI benchmark test
  const handleRunAiBenchmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPrompt.trim() || aiBenchmarkLoading) return;

    setAiBenchmarkLoading(true);
    setAiBenchmarkResult(null);

    try {
      const res = await api.post('/admin/test-ai', {
        prompt: testPrompt,
        modelProvider: testModelProvider
      });
      setAiBenchmarkResult(res.data);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch (_) {}
      showToast(`AI Benchmark completed in ${res.data?.durationMs}ms!`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'AI benchmark execution failed.', 'error');
    } finally {
      setAiBenchmarkLoading(false);
    }
  };

  // Send Broadcast / Test Email
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailTo.trim() || sendingEmail) return;

    setSendingEmail(true);
    try {
      const res = await api.post('/admin/broadcast-email', {
        recipientEmail: testEmailTo.trim(),
        subject: testEmailSubject,
        message: testEmailMessage
      });
      showToast(res.data?.message || 'Email sent successfully!', 'success');
      setTestEmailTo('');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to dispatch email.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.institution.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Documents
  const filteredDocs = documents.filter((d) => {
    return (
      d.fileName.toLowerCase().includes(docSearch.toLowerCase()) ||
      d.userEmail.toLowerCase().includes(docSearch.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-500 via-orange-500 to-amber-500 animate-spin flex items-center justify-center p-0.5">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[22px]" />
          </div>
          <Shield className="w-7 h-7 text-brand-500 absolute inset-0 m-auto" />
        </div>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 animate-pulse">
          Loading FLOW Admin Telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Top Executive Header */}
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-500 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 border border-brand-400/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    FLOW Control Center
                  </h1>
                  <span className="px-3 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-xs font-black tracking-wider uppercase border border-brand-500/30">
                    Super Admin
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20 hidden sm:inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>flowbyimv@gmail.com</span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400">
                  Global telemetry, student directory, AI compute monitoring & infrastructure health
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats & Refresh Button */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Services Active</span>
            </div>

            <button
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2 text-xs font-semibold"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation Pills */}
        <div className="relative z-10 flex items-center gap-1.5 mt-8 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md overflow-x-auto">
          {[
            { id: 'overview', label: 'Platform Overview', icon: Activity },
            { id: 'users', label: `Students & Directory (${users.length})`, icon: Users },
            { id: 'documents', label: `Ingestion & Files (${documents.length})`, icon: FileText },
            { id: 'ai', label: 'AI Compute & Playground', icon: Cpu },
            { id: 'diagnostics', label: 'System & Email Health', icon: Mail }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-500 to-orange-500 text-white shadow-lg shadow-brand-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Top 4 Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Metric 1: Total Users */}
            <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Students
                </span>
                <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {stats.summary.totalUsers}
                </h3>
                <span className="text-xs font-bold text-emerald-500 flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  +{stats.summary.recentSignups} this week
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Active registered student accounts</p>
            </div>

            {/* Metric 2: Documents Ingested */}
            <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Processed Documents
                </span>
                <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {stats.summary.totalDocs}
                </h3>
                <span className="text-xs font-bold text-brand-500">PDFs & Syllabi</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Parsed through OCR & AI Engine</p>
            </div>

            {/* Metric 3: Total Tasks Created */}
            <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Academic Tasks
                </span>
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {stats.summary.totalTasks}
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  ({stats.summary.completedTasks} done)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">{stats.summary.pendingTasks} pending study deadlines</p>
            </div>

            {/* Metric 4: LEMON AI Messages */}
            <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  LEMON Invocations
                </span>
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {stats.summary.totalMessages}
                </h3>
                <span className="text-xs font-bold text-purple-500">Chats</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">{stats.summary.activeSchedules} active 7-day study sprints</p>
            </div>
          </div>

          {/* Interactive Recharts Graph: 7-Day Activity Trend */}
          <div className="card p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Weekly Academic Velocity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daily distribution of registered tasks and student signups over the last 7 days
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-brand-500">
                  <span className="w-3 h-3 rounded-full bg-brand-500" /> Tasks Created
                </span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" /> New Students
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.activityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff6b00" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '16px',
                      border: '1px solid #334155',
                      fontSize: '12px',
                      color: '#fff'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tasks"
                    name="Tasks Created"
                    stroke="#ff6b00"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#tasksGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="New Students"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#usersGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Infrastructure Health Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Node 1: Groq */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Primary LLM</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {stats.systemHealth.groq.status}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Groq Llama 3.3</h4>
              <p className="text-xs text-slate-500 truncate">{stats.systemHealth.groq.primaryModel}</p>
            </div>

            {/* Node 2: Gemini */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Vision & 1M Window</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-500/10 text-brand-500 border border-brand-500/20">
                  {stats.systemHealth.gemini.status}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Gemini 2.5 Flash</h4>
              <p className="text-xs text-slate-500 truncate">{stats.systemHealth.gemini.model}</p>
            </div>

            {/* Node 3: Database */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Database</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {stats.systemHealth.database.status}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Supabase PostgreSQL</h4>
              <p className="text-xs text-slate-500 truncate">RLS & Multi-Tenant</p>
            </div>

            {/* Node 4: Email */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Mail Dispatcher</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {stats.systemHealth.emailService.status}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{stats.systemHealth.emailService.provider}</h4>
              <p className="text-xs text-slate-500 truncate">{stats.systemHealth.emailService.sender}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. USERS & DIRECTORY TAB */}
      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Search & Filters */}
          <div className="card p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search students by email, name..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">Role:</span>
              {(['all', 'admin', 'student'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                    userRoleFilter === r
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-black tracking-wider text-[10px] text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Student</th>
                    <th className="py-3.5 px-4">Institution</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4 text-center">Tasks</th>
                    <th className="py-3.5 px-4 text-center">Ingests</th>
                    <th className="py-3.5 px-4 text-center">Chats</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No students match your query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isAdm = u.role === 'admin';
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                                {u.fullName ? u.fullName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 max-w-[200px]">
                                <p className="font-bold text-slate-900 dark:text-white truncate">{u.fullName}</p>
                                <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                            {u.institution}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                isAdm
                                  ? 'bg-brand-500/10 text-brand-500 border-brand-500/20'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                            {u.tasksCount}
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                            {u.documentsCount}
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                            {u.messagesCount}
                          </td>

                          <td className="py-3.5 px-4 text-[11px] text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Role Toggle Button */}
                              <button
                                onClick={() => handleUpdateRole(u.id, isAdm ? 'student' : 'admin')}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 transition-colors"
                                title={isAdm ? 'Demote to Student' : 'Promote to Admin'}
                              >
                                <Shield className="w-4 h-4" />
                              </button>

                              {/* Delete User */}
                              <button
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                title="Permanently Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. INGESTION & FILES TAB */}
      {activeTab === 'documents' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Search Header */}
          <div className="card p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Search uploaded files or student email..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <p className="text-xs text-slate-400 font-semibold hidden sm:block">
              Total Ingested: {filteredDocs.length} files
            </p>
          </div>

          {/* Documents Table */}
          <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-black tracking-wider text-[10px] text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Document File</th>
                    <th className="py-3.5 px-4">Uploaded By</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Text Length</th>
                    <th className="py-3.5 px-4 text-center">Tasks Generated</th>
                    <th className="py-3.5 px-4">Uploaded At</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No ingested documents found.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white max-w-[220px] truncate" title={doc.fileName}>
                              {doc.fileName}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="min-w-0 max-w-[160px]">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.userName}</p>
                            <p className="text-[11px] text-slate-400 truncate">{doc.userEmail}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {doc.fileType}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {doc.hasText ? (
                            <span className="text-emerald-500 font-bold">{doc.textLength.toLocaleString()} chars</span>
                          ) : (
                            <span className="text-amber-500 font-bold">Binary (No raw text)</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                          {doc.tasksGenerated}
                        </td>

                        <td className="py-3.5 px-4 text-[11px] text-slate-400">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Inspect Raw Text */}
                            <button
                              onClick={() => handlePreviewDocument(doc.id, doc.fileName)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors"
                              title="Inspect Extracted Text"
                            >
                              <Eye className="w-3.5 h-3.5 text-brand-500" />
                              <span>Inspect</span>
                            </button>

                            {/* Delete Document */}
                            <button
                              onClick={() => handleDeleteDoc(doc.id, doc.fileName)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Purge Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4. AI COMPUTE & BENCHMARK PLAYGROUND */}
      {activeTab === 'ai' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Interactive Benchmark Runner */}
            <div className="lg:col-span-2 card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-brand-500" />
                    Live AI Inference Benchmark
                  </h3>
                  <p className="text-xs text-slate-500">
                    Test LLM latency, response formatting, and token generation in real-time
                  </p>
                </div>
              </div>

              <form onSubmit={handleRunAiBenchmark} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Test Prompt
                  </label>
                  <textarea
                    rows={4}
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    placeholder="Enter academic prompt or extraction text..."
                    className="w-full p-3.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Route via:</span>
                    {(['auto', 'groq', 'gemini'] as const).map((prov) => (
                      <button
                        type="button"
                        key={prov}
                        onClick={() => setTestModelProvider(prov)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                          testModelProvider === prov
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {prov}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={aiBenchmarkLoading}
                    className="py-2.5 px-5 rounded-2xl font-bold text-xs bg-gradient-to-r from-brand-500 to-orange-500 hover:from-brand-600 hover:to-orange-600 text-white shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {aiBenchmarkLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Benchmarking...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Execute Inference Test</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Benchmark Output Card */}
              {aiBenchmarkResult && (
                <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-500 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Inference Success
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {aiBenchmarkResult.providerUsed}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                      <span>Latency: <strong className="text-brand-500">{aiBenchmarkResult.durationMs}ms</strong></span>
                      <span>Chars: <strong>{aiBenchmarkResult.characters}</strong></span>
                      <span>Tokens: <strong>~{aiBenchmarkResult.estimatedTokens}</strong></span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {aiBenchmarkResult.output}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Engine Specs */}
            <div className="space-y-4">
              <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Primary Groq Engine
                </h4>
                <div className="text-xs space-y-2 text-slate-500 dark:text-slate-400">
                  <p><strong>Primary Model:</strong> openai/gpt-oss-120b</p>
                  <p><strong>Fallback Model:</strong> openai/gpt-oss-20b</p>
                  <p><strong>Throughput:</strong> High-speed LPUs</p>
                  <p><strong>Failover Protocol:</strong> Auto-routes to Gemini 2.5 Flash on 429 TPM exhaustion</p>
                </div>
              </div>

              <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  Gemini Multimodal Engine
                </h4>
                <div className="text-xs space-y-2 text-slate-500 dark:text-slate-400">
                  <p><strong>Model:</strong> gemini-2.5-flash</p>
                  <p><strong>Context Window:</strong> 1,000,000 Tokens</p>
                  <p><strong>Capabilities:</strong> PDF Native OCR, Handwriting Vision, Full Syllabus Analysis</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 5. SYSTEM & EMAIL HEALTH TAB */}
      {activeTab === 'diagnostics' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dispatcher Tool */}
            <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-brand-500" />
                  Manual Email Dispatcher
                </h3>
                <p className="text-xs text-slate-500">
                  Dispatch operational alerts or test notifications through the live SMTP gateway
                </p>
              </div>

              <form onSubmit={handleSendTestEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Student Email
                  </label>
                  <input
                    type="email"
                    required
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Announcement Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={testEmailSubject}
                    onChange={(e) => setTestEmailSubject(e.target.value)}
                    className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Message Body
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={testEmailMessage}
                    onChange={(e) => setTestEmailMessage(e.target.value)}
                    className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="w-full py-3 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {sendingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Transmitting Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Dispatch Announcement Email</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Scheduler Status */}
            <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  Background Cron Scheduler
                </h3>
                <p className="text-xs text-slate-500">
                  Automated daemon workers running inside the Flow Node.js server
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">Daily 08:00 AM Morning Study Plan</h5>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Cron: <code>0 8 * * *</code> • Generates daily focus intervals & email digest</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">Hourly Deadline Reminder Check</h5>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Cron: <code>0 * * * *</code> • Alerts students of assignments due within 24 hours</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">AI Engine Health Heartbeat</h5>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Healthy
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Monitors Groq token bucket and rotates API keys automatically</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-md">
                      {previewDoc.fileName}
                    </h3>
                    <p className="text-xs text-slate-400">Extracted Raw Text Telemetry</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                {previewDoc.rawText}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-400 font-mono">
                  {previewDoc.rawText.length.toLocaleString()} characters extracted
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(previewDoc.rawText);
                    showToast('Document text copied to clipboard.', 'success');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white transition-all shadow-sm"
                >
                  Copy Text Content
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
