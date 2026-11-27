export interface StudyExam {
  id: string;
  user_id?: string;
  subject: string;
  exam_name: string;
  exam_date: string;
  syllabus_text?: string;
  target_score?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StudyTopic {
  id: string;
  exam_id: string;
  unit_name: string;
  topic_name: string;
  importance_level: 'high' | 'medium' | 'low';
  is_understood: boolean;
  is_difficult?: boolean;
}

export interface StudyQuestion {
  id: string;
  exam_id: string;
  unit_name: string;
  topic_name: string;
  question: string;
  answer_key: string;
  priority: 'high' | 'medium' | 'low';
  priority_reason?: string;
  expected_marks?: number;
  suggested_time_minutes?: number;
  is_attempted: boolean;
  attempt_verdict?: 'understood' | 'practice_needed' | 'not_understood' | null;
}

export interface StudyFlashcard {
  id: string;
  exam_id: string;
  topic_name: string;
  question: string;
  answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface ExamDetail {
  exam: StudyExam;
  topics: StudyTopic[];
  questions: StudyQuestion[];
  flashcards: StudyFlashcard[];
}

export type StudySection = 'home' | 'workspace' | 'documents' | 'progress';
export type StudyMode = 'learn' | 'priority' | 'test' | 'focus';
export type IngestionStage =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'analysing'
  | 'validating'
  | 'saving'
  | 'completed'
  | 'failed';
