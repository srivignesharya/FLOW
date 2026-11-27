import React from 'react';
import { BarChart3, CheckCircle2, HelpCircle, Brain, AlertTriangle } from 'lucide-react';
import { StudyTopic, StudyQuestion, StudyFlashcard } from './types';

interface ProgressCentreProps {
  subject: string;
  topics: StudyTopic[];
  questions: StudyQuestion[];
  flashcards: StudyFlashcard[];
}

export const ProgressCentre: React.FC<ProgressCentreProps> = ({
  subject,
  topics,
  questions,
  flashcards
}) => {
  const understoodTopics = topics.filter((t) => t.is_understood);
  const pendingTopics = topics.filter((t) => !t.is_understood);
  const topicPct = topics.length > 0 ? Math.round((understoodTopics.length / topics.length) * 100) : 0;

  const attemptedQs = questions.filter((q) => q.is_attempted);
  const understoodQs = questions.filter((q) => q.attempt_verdict === 'understood');
  const practiceQs = questions.filter((q) => q.attempt_verdict === 'practice_needed' || q.attempt_verdict === 'not_understood');
  const qPct = questions.length > 0 ? Math.round((attemptedQs.length / questions.length) * 100) : 0;

  const overallReadiness = Math.round(topicPct * 0.6 + qPct * 0.4);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#101114] border border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#FF8A00]" />
              <span>Progress Centre — {subject}</span>
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Calculated from your persisted topic completions and question attempts.
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#FF9D24]">{overallReadiness}%</span>
            <p className="text-[10px] text-[#A1A1AA] uppercase tracking-wider">Exam Readiness</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#18191D] border border-white/5">
            <div className="flex items-center gap-2 text-xs text-[#A1A1AA] mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Syllabus Coverage</span>
            </div>
            <div className="text-xl font-black text-white">{topicPct}%</div>
            <div className="text-[11px] text-[#A1A1AA]">{understoodTopics.length} / {topics.length} topics</div>
          </div>

          <div className="p-4 rounded-xl bg-[#18191D] border border-white/5">
            <div className="flex items-center gap-2 text-xs text-[#A1A1AA] mb-1">
              <HelpCircle className="h-3.5 w-3.5 text-[#FF9D24]" />
              <span>Priority Questions</span>
            </div>
            <div className="text-xl font-black text-white">{qPct}%</div>
            <div className="text-[11px] text-[#A1A1AA]">{attemptedQs.length} / {questions.length} attempted</div>
          </div>

          <div className="p-4 rounded-xl bg-[#18191D] border border-white/5">
            <div className="flex items-center gap-2 text-xs text-[#A1A1AA] mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#FF8A00]" />
              <span>Mastered Qs</span>
            </div>
            <div className="text-xl font-black text-white">{understoodQs.length}</div>
            <div className="text-[11px] text-[#A1A1AA]">{practiceQs.length} need revision</div>
          </div>

          <div className="p-4 rounded-xl bg-[#18191D] border border-white/5">
            <div className="flex items-center gap-2 text-xs text-[#A1A1AA] mb-1">
              <Brain className="h-3.5 w-3.5 text-purple-400" />
              <span>Flashcards</span>
            </div>
            <div className="text-xl font-black text-white">{flashcards.length}</div>
            <div className="text-[11px] text-[#A1A1AA]">Active recall deck</div>
          </div>
        </div>
      </div>

      {/* Weak / Pending Topics */}
      <div className="p-6 rounded-2xl bg-[#101114] border border-white/10 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-[#FF9D24]" />
          <span>Topics Needing Attention ({pendingTopics.length})</span>
        </h4>
        {pendingTopics.length === 0 ? (
          <p className="text-xs text-[#A1A1AA]">
            {topics.length === 0
              ? 'No syllabus topics extracted yet. Upload your syllabus in Document Centre.'
              : 'All extracted topics are marked as understood!'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pendingTopics.slice(0, 8).map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-[#18191D] border border-white/5 flex items-center justify-between gap-2"
              >
                <div className="truncate">
                  <div className="text-xs font-semibold text-white truncate">{t.topic_name}</div>
                  <div className="text-[10px] text-[#A1A1AA] truncate">{t.unit_name}</div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FF8A00]/15 text-[#FF9D24] shrink-0">
                  {t.importance_level}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
