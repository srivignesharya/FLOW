-- ============================================================
-- FLOW Platform — Initial Database Schema
-- Migration: 20260806000000_init_schema.sql
-- ============================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  academic_institution TEXT,
  preferred_study_hours_per_day INT DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. DOCUMENTS TABLE
-- ============================================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT,
  file_type TEXT NOT NULL, -- 'pdf', 'image', 'text'
  raw_text_content TEXT,
  storage_bucket TEXT DEFAULT 'academic-documents',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TASKS TABLE
-- ============================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'General',
  deadline TIMESTAMPTZ NOT NULL,
  weightage NUMERIC(5,2) DEFAULT 0.00,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  estimated_minutes INT DEFAULT 60,
  description TEXT,
  task_type TEXT CHECK (task_type IN ('assignment', 'exam', 'announcement', 'reading')) DEFAULT 'assignment',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. STUDY_SCHEDULES TABLE
-- ============================================================
CREATE TABLE public.study_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL DEFAULT CURRENT_DATE,
  generated_plan JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. COPILOT_MESSAGES TABLE
-- ============================================================
CREATE TABLE public.copilot_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE AT SCALE
-- ============================================================
CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX idx_documents_user ON public.documents(user_id);
CREATE INDEX idx_copilot_user_doc ON public.copilot_messages(user_id, document_id);
CREATE INDEX idx_schedules_user ON public.study_schedules(user_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Users only access their own data
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles access policy"
  ON public.profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Documents access policy"
  ON public.documents FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tasks access policy"
  ON public.tasks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Schedules access policy"
  ON public.study_schedules FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Copilot access policy"
  ON public.copilot_messages FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER — Auto-create profile on new user registration
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Student'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE BUCKET SETUP
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('academic-documents', 'academic-documents', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Storage read policy"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'academic-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Storage insert policy"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'academic-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
