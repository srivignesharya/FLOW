import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Calendar, 
  Bot, 
  CheckCircle2, 
  Clock, 
  Upload, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  Compass, 
  Layers,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ZenithLogo } from '../components/ZenithLogo';
import { SwitchMode } from '../components/SwitchMode';
import { useAuth } from '../context/AuthContext';

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated and visits landing, allow quick launch to dashboard
  return (
    <div className="min-h-screen bg-[#0B1020] text-[#F8FAFC] selection:bg-[#2563FF]/30 selection:text-[#00D4FF] relative overflow-hidden font-sans">
      {/* Background Astronomy Atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#2563FF]/15 via-[#00D4FF]/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#2563FF]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#00D4FF]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Semantic Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#0B1020]/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="cursor-pointer" aria-label="ZENITH Home">
            <ZenithLogo size="sm" showWordmark={true} showBadge={true} />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#94A3B8]" aria-label="Main Navigation">
            <a href="#how-it-works" className="hover:text-[#F8FAFC] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#F8FAFC] transition-colors">Features</a>
            <a href="#workflows" className="hover:text-[#F8FAFC] transition-colors">Workflows</a>
            <a href="#architecture" className="hover:text-[#F8FAFC] transition-colors">Architecture</a>
          </nav>

          <div className="flex items-center gap-3">
            <SwitchMode width={52} height={26} />

            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563FF] to-[#00D4FF] text-white text-xs font-bold shadow-md shadow-[#2563FF]/25 hover:opacity-95 transition-all cursor-pointer"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800/60 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563FF] via-[#1D4ED8] to-[#00D4FF] text-white text-xs font-bold shadow-md shadow-[#2563FF]/25 hover:opacity-95 active:scale-95 transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main>
        {/* Hero Section */}
        <section className="relative pt-16 sm:pt-24 pb-20 px-4 sm:px-8 max-w-6xl mx-auto text-center" aria-labelledby="hero-heading">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2563FF]/10 border border-[#2563FF]/25 text-[#00D4FF] text-xs font-bold mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>ZENITH v1.1 • Reach Higher. Live Brighter.</span>
          </div>

          {/* Primary Descriptive H1 */}
          <h1 id="hero-heading" className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-[#F8FAFC] max-w-4xl mx-auto">
            AI-Powered Student Productivity Platform for Structured Academic Execution
          </h1>

          {/* Natural, descriptive subtitle */}
          <p className="mt-6 text-sm sm:text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed font-normal">
            Organize assignments, deadlines, documents, and study plans with ZENITH by IMV. Extract syllabus tasks automatically, schedule 7-day adaptive study blocks, and execute with clarity.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/auth"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#2563FF] via-[#1D4ED8] to-[#00D4FF] text-white font-bold text-sm shadow-xl shadow-[#2563FF]/25 hover:opacity-95 active:scale-98 transition-all"
            >
              <span>Start Organizing Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#111827] hover:bg-[#1E293B] text-[#F8FAFC] border border-slate-700/80 font-semibold text-sm transition-colors"
            >
              <Compass className="h-4 w-4 text-[#00D4FF]" />
              <span>Explore Features</span>
            </a>
          </div>

          {/* Hero Feature Visual: Astronomy Card Preview */}
          <div className="mt-14 relative max-w-4xl mx-auto rounded-2xl sm:rounded-3xl bg-[#111827] border border-slate-800 p-4 sm:p-7 shadow-2xl shadow-black/80 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-500 ml-2">zenith.academic.workspace</span>
              </div>
              <span className="text-[11px] font-semibold text-[#00D4FF] bg-[#2563FF]/15 px-2 py-0.5 rounded border border-[#2563FF]/30">
                Live Preview
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
              <div className="p-4 rounded-xl bg-[#0B1020] border border-slate-800">
                <div className="text-[11px] font-bold text-[#94A3B8] uppercase">Next Critical Action</div>
                <div className="text-sm font-bold text-[#F8FAFC] mt-1">CS 301 Machine Problem 3</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">High Priority</span>
                  <span className="text-[11px] text-[#94A3B8]">Due Today, 11:59 PM</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1020] border border-slate-800">
                <div className="text-[11px] font-bold text-[#94A3B8] uppercase">AI Ingestion Engine</div>
                <div className="text-sm font-bold text-[#00D4FF] mt-1">Syllabus_Fall2026.pdf</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>14 Tasks Extracted & Normalized</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1020] border border-slate-800">
                <div className="text-[11px] font-bold text-[#94A3B8] uppercase">7-Day Study Planner</div>
                <div className="text-sm font-bold text-[#F8FAFC] mt-1">4 Focus Blocks Today</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-[#94A3B8]">
                  <Clock className="h-3.5 w-3.5 text-[#2563FF]" />
                  <span>180 Min Allocated Workload</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Who It Helps */}
        <section className="py-16 px-4 sm:px-8 border-t border-slate-800/80 bg-[#0B1020]" aria-labelledby="who-it-helps-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 id="who-it-helps-heading" className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
                Designed for Ambitious Students and Academic Researchers
              </h2>
              <p className="mt-3 text-sm text-[#94A3B8]">
                Whether balancing difficult STEM problem sets, clinical rotations, or research papers, ZENITH structures your workload into realistic daily actions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 hover:border-[#2563FF]/40 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-[#2563FF]/15 text-[#00D4FF] flex items-center justify-center font-bold mb-4">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#F8FAFC]">University Students</h3>
                <p className="mt-2 text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  Turn sprawling 15-page course syllabi and LMS announcements into concrete assignments with verified weightages and due dates.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 hover:border-[#2563FF]/40 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-[#2563FF]/15 text-[#2563FF] flex items-center justify-center font-bold mb-4">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#F8FAFC]">Graduate & Exam Candidates</h3>
                <p className="mt-2 text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  Distribute preparation for comprehensive exams, midterms, and project milestones across optimal 7-day study sprints.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 hover:border-[#2563FF]/40 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold mb-4">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#F8FAFC]">Self-Directed Learners</h3>
                <p className="mt-2 text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  Upload textbook chapters, tutorial outlines, or lecture summaries to generate actionable study commitments without calendar clutter.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: How It Works */}
        <section id="how-it-works" className="py-16 px-4 sm:px-8 border-t border-slate-800/80 bg-[#111827]/50" aria-labelledby="how-it-works-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 id="how-it-works-heading" className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
                How ZENITH Simplifies Academic Workflows
              </h2>
              <p className="mt-3 text-sm text-[#94A3B8]">
                A deliberate three-stage process transforms raw syllabus text into structured daily achievement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-[#00D4FF]">STEP 01</div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">Ingest Course Documents</h3>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  Upload PDF course outlines, assignment rubrics, or paste text announcements. Our ingestion pipeline parses text and identifies deadlines, grading weightages, and task types.
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-[#2563FF]">STEP 02</div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">Review & Prioritize</h3>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  Review extracted assignments before saving. Correct dates, detect duplicate entries, and let the Smart Priority Engine evaluate urgency based on remaining days and grade weight.
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-[#00D4FF]">STEP 03</div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">Execute 7-Day Plans</h3>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  Generate adaptive daily study blocks matching your preferred study capacity. Sync focus sessions with Google Calendar and receive 24-hour deadline protection emails.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Key Features */}
        <section id="features" className="py-16 px-4 sm:px-8 border-t border-slate-800/80 bg-[#0B1020]" aria-labelledby="features-heading">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 id="features-heading" className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
                Engineered for Academic Performance
              </h2>
              <p className="mt-3 text-sm text-[#94A3B8]">
                Every component is built around authentic student needs, without generic fluff or fabricated metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-[#2563FF]/15 text-[#00D4FF]">
                    <Upload className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Document Ingest Studio</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  Supports multi-page PDF documents and images up to 100 MB. Extracts explicit and inferred assignment commitments, allowing students to verify each task before persisting to the database.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-[#2563FF]/15 text-[#2563FF]">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Smart Today View & Unified Calendar</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  Unifies overdue tasks, assignments due today, and approaching deadlines in one clear view. Highlights next critical actions without overwhelming the student.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                    <Bot className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Academic Copilot Assistant</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  An AI study copilot grounded in your stored syllabus context. Ask questions regarding exam formats, homework submission guidelines, or subject focus strategies.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Scheduled Deadline Protection</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  Automated background reminder service running daily cron checks. Dispatches high-priority email alerts 24 hours prior to assignment submissions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Architecture and Privacy */}
        <section id="architecture" className="py-16 px-4 sm:px-8 border-t border-slate-800/80 bg-[#111827]/40" aria-labelledby="arch-heading">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 id="arch-heading" className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
              Enterprise-Grade Foundation & Privacy First
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              ZENITH is engineered on Supabase with strict PostgreSQL Row Level Security (RLS). Every task, document, and study schedule is accessible exclusively by its authenticated owner. Powered by resilient AI orchestration with Google Gemini and Groq Llama 3.3 models.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-[#94A3B8]">
              <span className="px-3 py-1 rounded-full bg-[#0B1020] border border-slate-800">PostgreSQL RLS Security</span>
              <span className="px-3 py-1 rounded-full bg-[#0B1020] border border-slate-800">100% Student Data Privacy</span>
              <span className="px-3 py-1 rounded-full bg-[#0B1020] border border-slate-800">Local Timezone Preservation</span>
              <span className="px-3 py-1 rounded-full bg-[#0B1020] border border-slate-800">Fast Edge Deployment</span>
            </div>
          </div>
        </section>

        {/* Section 6: Final CTA */}
        <section className="py-20 px-4 sm:px-8 border-t border-slate-800/80 bg-gradient-to-b from-[#111827] to-[#0B1020] text-center" aria-labelledby="cta-heading">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 id="cta-heading" className="text-3xl sm:text-4xl font-black text-[#F8FAFC] tracking-tight">
              Reach Higher. Live Brighter.
            </h2>
            <p className="text-sm text-[#94A3B8] max-w-xl mx-auto">
              Upgrade your academic workflow with ZENITH v1.1 by IMV. Sign in or create a free account to begin structuring your semester today.
            </p>
            <div className="pt-2">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#2563FF] via-[#1D4ED8] to-[#00D4FF] text-white font-bold text-sm shadow-xl shadow-[#2563FF]/30 hover:opacity-95 active:scale-95 transition-all"
              >
                <span>Launch ZENITH Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Semantic Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-4 sm:px-8 bg-[#0B1020] text-center text-xs text-[#94A3B8]" role="contentinfo">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ZenithLogo size="xs" showWordmark={true} showBadge={false} />
            <span>— Student Productivity Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/auth" className="hover:text-[#F8FAFC] transition-colors">Sign In</Link>
            <a href="#how-it-works" className="hover:text-[#F8FAFC] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#F8FAFC] transition-colors">Features</a>
          </div>

          <div>
            © 2026 ZENITH v1.1 • by IMV • All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
