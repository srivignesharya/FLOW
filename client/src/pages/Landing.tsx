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
    <div className="min-h-screen bg-[#101114] text-[#F8FAFC] selection:bg-[#FF8A00]/30 selection:text-[#FF9D24] relative overflow-hidden font-sans">
      {/* Background Astronomy Atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#FF8A00]/15 via-[#FF9D24]/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FF8A00]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#FF9D24]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Semantic Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#101114]/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="cursor-pointer" aria-label="FLOW Home">
            <ZenithLogo size="sm" showWordmark={true} showBadge={true} />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#A1A1AA]" aria-label="Main Navigation">
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FF9D24] text-white text-xs font-bold shadow-md shadow-[#FF8A00]/25 hover:opacity-95 transition-all cursor-pointer"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#A1A1AA] hover:text-[#F8FAFC] hover:bg-slate-800/60 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF8A00] via-[#EA580C] to-[#FF9D24] text-white text-xs font-bold shadow-md shadow-[#FF8A00]/25 hover:opacity-95 active:scale-95 transition-all"
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF8A00]/10 border border-[#FF8A00]/25 text-[#FF9D24] text-xs font-bold mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>FLOW v1.1 • Reach Higher. Live Brighter.</span>
          </div>

          {/* Primary Descriptive H1 */}
          <h1 id="hero-heading" className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-[#F8FAFC] max-w-4xl mx-auto">
            AI-Powered Student Productivity Platform for Structured Academic Execution
          </h1>

          {/* Natural, descriptive subtitle */}
          <p className="mt-6 text-sm sm:text-lg text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed font-normal">
            Organize assignments, deadlines, documents, and study plans with FLOW by IMV. Extract syllabus tasks automatically, schedule 7-day adaptive study blocks, and execute with clarity.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/auth"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#FF8A00] via-[#EA580C] to-[#FF9D24] text-white font-bold text-sm shadow-xl shadow-[#FF8A00]/25 hover:opacity-95 active:scale-98 transition-all"
            >
              <span>Start Organizing Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#18191E] hover:bg-[#1E293B] text-[#F8FAFC] border border-slate-700/80 font-semibold text-sm transition-colors"
            >
              <Compass className="h-4 w-4 text-[#FF9D24]" />
              <span>Explore Features</span>
            </a>
          </div>

          {/* Hero Feature Visual: Astronomy Card Preview */}
          <div className="mt-14 relative max-w-4xl mx-auto rounded-2xl sm:rounded-3xl bg-[#18191E] border border-slate-800 p-4 sm:p-7 shadow-2xl shadow-black/80 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-500 ml-2">flow.academic.workspace</span>
              </div>
              <span className="text-[11px] font-semibold text-[#FF9D24] bg-[#FF8A00]/15 px-2 py-0.5 rounded border border-[#FF8A00]/30">
                Live Preview
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
              <div className="p-4 rounded-xl bg-[#101114] border border-slate-800">
                <div className="text-[11px] font-bold text-[#A1A1AA] uppercase">Next Critical Action</div>
                <div className="text-sm font-bold text-[#F8FAFC] mt-1">CS 301 Machine Problem 3</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">High Priority</span>
                  <span className="text-[11px] text-[#A1A1AA]">Due Today, 11:59 PM</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#101114] border border-slate-800">
                <div className="text-[11px] font-bold text-[#A1A1AA] uppercase">AI Ingestion Engine</div>
                <div className="text-sm font-bold text-[#FF9D24] mt-1">Syllabus_Fall2026.pdf</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>14 Tasks Extracted & Normalized</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#101114] border border-slate-800">
                <div className="text-[11px] font-bold text-[#A1A1AA] uppercase">7-Day Study Planner</div>
                <div className="text-sm font-bold text-[#F8FAFC] mt-1">4 Focus Blocks Today</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-[#A1A1AA]">
                  <Clock className="h-3.5 w-3.5 text-[#FF8A00]" />
                  <span>180 Min Allocated Workload</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Who It Helps */}
        <section className="py-16 px-4 sm:px-8 border-t border-slate-800/80 bg-[#101114]" aria-labelledby="who-it-helps-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 id="who-it-helps-heading" className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
                Designed for Ambitious Students and Academic Researchers
              </h2>
              <p className="mt-3 text-sm text-[#A1A1AA]">
                Whether balancing difficult STEM problem sets, clinical rotations, or research papers, FLOW structures your workload into realistic daily actions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#18191E] border border-slate-800 hover:border-[#FF8A00]/40 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-[#FF8A00]/15 text-[#FF9D24] flex items-center justify-center font-bold mb-4">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#F8FAFC]">University Students</h3>
                <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  Turn sprawling 15-page course syllabi and LMS announcements into concrete assignments with verified weightages and due dates.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#18191E] border border-slate-800 hover:border-[#FF8A00]/40 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-[#FF8A00]/15 text-[#FF8A00] flex items-center justify-center font-bold mb-4">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#F8FAFC]">Graduate & Exam Candidates</h3>
                <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  Distribute preparation for comprehensive exams, midterms, and project milestones across optimal 7-day study sprints.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#18191E] border border-slate-800 hover:border-[#FF8A00]/40 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold mb-4">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#F8FAFC]">Self-Directed Learners</h3>
                <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  Upload textbook chapters, tutorial outlines, or lecture summaries to generate actionable study commitments without calendar clutter.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: How It Works */}
        <section id="how-it-works" className="py-16 px-4 sm:px-8 border-t border-slate-800/80 bg-[#18191E]/50" aria-labelledby="how-it-works-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 id="how-it-works-heading" className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
                How FLOW Simplifies Academic Workflows
              </h2>
              <p className="mt-3 text-sm text-[#A1A1AA]">
                A deliberate three-stage process transforms raw syllabus text into structured daily achievement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-[#FF9D24]">STEP 01</div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">Ingest Course Documents</h3>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  Upload PDF course outlines, assignment rubrics, or paste text announcements. Our ingestion pipeline parses text and identifies deadlines, grading weightages, and task types.
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-[#FF8A00]">STEP 02</div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">Review & Prioritize</h3>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  Review extracted assignments before saving. Correct dates, detect duplicate entries, and let the Smart Priority Engine evaluate urgency based on remaining days and grade weight.
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-[#FF9D24]">STEP 03</div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">Execute 7-Day Plans</h3>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  Generate adaptive daily study blocks matching your preferred study capacity. Sync focus sessions with Google Calendar and receive 24-hour deadline protection emails.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Key Features */}
        <section id="features" className="py-16 px-4 sm:px-8 border-t border-slate-800/80 bg-[#101114]" aria-labelledby="features-heading">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 id="features-heading" className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
                Engineered for Academic Performance
              </h2>
              <p className="mt-3 text-sm text-[#A1A1AA]">
                Every component is built around authentic student needs, without generic fluff or fabricated metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#18191E] border border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-[#FF8A00]/15 text-[#FF9D24]">
                    <Upload className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Document Ingest Studio</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  Supports multi-page PDF documents and images up to 100 MB. Extracts explicit and inferred assignment commitments, allowing students to verify each task before persisting to the database.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#18191E] border border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-[#FF8A00]/15 text-[#FF8A00]">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Smart Today View & Unified Calendar</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  Unifies overdue tasks, assignments due today, and approaching deadlines in one clear view. Highlights next critical actions without overwhelming the student.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#18191E] border border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                    <Bot className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">LEMON AI Assistant</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  An intelligent AI academic assistant grounded in your stored syllabus context. Ask questions regarding exam formats, homework submission guidelines, or subject focus strategies.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#18191E] border border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Scheduled Deadline Protection</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  Automated background reminder service running daily cron checks. Dispatches high-priority email alerts 24 hours prior to assignment submissions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Architecture and Privacy */}
        <section id="architecture" className="py-16 px-4 sm:px-8 border-t border-slate-800/80 bg-[#18191E]/40" aria-labelledby="arch-heading">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 id="arch-heading" className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
              Enterprise-Grade Foundation & Privacy First
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
              FLOW is engineered on Supabase with strict PostgreSQL Row Level Security (RLS). Every task, document, and study schedule is accessible exclusively by its authenticated owner. Powered by resilient AI orchestration with Google Gemini and Groq Llama 3.3 models.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-[#A1A1AA]">
              <span className="px-3 py-1 rounded-full bg-[#101114] border border-slate-800">PostgreSQL RLS Security</span>
              <span className="px-3 py-1 rounded-full bg-[#101114] border border-slate-800">100% Student Data Privacy</span>
              <span className="px-3 py-1 rounded-full bg-[#101114] border border-slate-800">Local Timezone Preservation</span>
              <span className="px-3 py-1 rounded-full bg-[#101114] border border-slate-800">Fast Edge Deployment</span>
            </div>
          </div>
        </section>

        {/* Section 6: Final CTA */}
        <section className="py-20 px-4 sm:px-8 border-t border-slate-800/80 bg-gradient-to-b from-[#18191E] to-[#101114] text-center" aria-labelledby="cta-heading">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 id="cta-heading" className="text-3xl sm:text-4xl font-black text-[#F8FAFC] tracking-tight">
              Reach Higher. Live Brighter.
            </h2>
            <p className="text-sm text-[#A1A1AA] max-w-xl mx-auto">
              Upgrade your academic workflow with FLOW v1.1 by IMV. Sign in or create a free account to begin structuring your semester today.
            </p>
            <div className="pt-2">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#FF8A00] via-[#EA580C] to-[#FF9D24] text-white font-bold text-sm shadow-xl shadow-[#FF8A00]/30 hover:opacity-95 active:scale-95 transition-all"
              >
                <span>Launch FLOW Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Semantic Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-4 sm:px-8 bg-[#101114] text-center text-xs text-[#A1A1AA]" role="contentinfo">
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
            © 2026 FLOW v1.1 • by IMV • All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

