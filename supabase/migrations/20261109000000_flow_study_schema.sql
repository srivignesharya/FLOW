-- ============================================================
-- FLOW V1.1 — Study & Exam Preparation Schema Migration
-- Migration: 20261109000000_flow_study_schema.sql
-- ============================================================

-- 1. STUDY SUBJECTS & EXAMS
CREATE TABLE IF NOT EXISTS public.study_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  exam_date TIMESTAMPTZ NOT NULL,
  syllabus_text TEXT,
  target_score INT DEFAULT 85,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STUDY UNITS & TOPICS
CREATE TABLE IF NOT EXISTS public.study_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.study_exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unit_name TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  importance_level TEXT CHECK (importance_level IN ('high', 'medium', 'low')) DEFAULT 'medium',
  is_understood BOOLEAN DEFAULT FALSE,
  is_difficult BOOLEAN DEFAULT FALSE,
  revision_count INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDY FLASHCARDS
CREATE TABLE IF NOT EXISTS public.study_flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.study_exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_name TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  mastery_level INT DEFAULT 0, -- 0 to 5
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRIORITIZED QUESTIONS & EXAM BANK
CREATE TABLE IF NOT EXISTS public.study_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.study_exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unit_name TEXT,
  topic_name TEXT,
  question TEXT NOT NULL,
  answer_key TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  priority_reason TEXT,
  expected_marks INT DEFAULT 5,
  suggested_time_minutes INT DEFAULT 10,
  is_attempted BOOLEAN DEFAULT FALSE,
  attempt_verdict TEXT CHECK (attempt_verdict IN ('understood', 'practice_needed', 'not_understood', null)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STUDY SESSIONS & FOCUS TIMER TELEMETRY
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES public.study_exams(id) ON DELETE SET NULL,
  mode TEXT CHECK (mode IN ('learn', 'priority', 'test', 'pomodoro')) NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 25,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_study_exams_user ON public.study_exams(user_id);
CREATE INDEX IF NOT EXISTS idx_study_topics_exam ON public.study_topics(exam_id);
CREATE INDEX IF NOT EXISTS idx_study_flashcards_exam ON public.study_flashcards(exam_id);
CREATE INDEX IF NOT EXISTS idx_study_questions_exam ON public.study_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON public.study_sessions(user_id);

-- 7. RLS POLICIES
ALTER TABLE public.study_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Study exams user policy') THEN
    CREATE POLICY "Study exams user policy" ON public.study_exams FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Study topics user policy') THEN
    CREATE POLICY "Study topics user policy" ON public.study_topics FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Study flashcards user policy') THEN
    CREATE POLICY "Study flashcards user policy" ON public.study_flashcards FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Study questions user policy') THEN
    CREATE POLICY "Study questions user policy" ON public.study_questions FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Study sessions user policy') THEN
    CREATE POLICY "Study sessions user policy" ON public.study_sessions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

