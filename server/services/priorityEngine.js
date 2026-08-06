/**
 * Smart AI Priority Scoring Engine (Phase 2 & Phase 7 - Explainable AI)
 * Calculates task priority dynamically based on:
 * - Deadline proximity (Urgency score)
 * - Course grade weightage (%)
 * - Estimated study duration
 * - Task type (Exam vs Assignment vs Reading)
 * - User velocity & remaining tasks
 */
export const calculateSmartPriority = ({
  deadline,
  weightage = 0,
  estimatedMinutes = 60,
  taskType = 'assignment',
  remainingTasksCount = 0
}) => {
  const now = new Date();
  const dueDate = new Date(deadline);
  const diffHours = Math.max(0, (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));

  // 1. Urgency Score (0 - 40 points)
  let urgencyScore = 0;
  if (diffHours <= 24) urgencyScore = 40;
  else if (diffHours <= 48) urgencyScore = 32;
  else if (diffHours <= 96) urgencyScore = 24;
  else if (diffHours <= 168) urgencyScore = 16;
  else urgencyScore = 8;

  // 2. Weightage Score (0 - 30 points)
  let weightageScore = Math.min(30, Math.round(weightage * 1.5));

  // 3. Effort & Complexity Score (0 - 15 points)
  let effortScore = Math.min(15, Math.round((estimatedMinutes / 60) * 3));

  // 4. Task Type Score (0 - 15 points)
  let typeScore = 5;
  if (taskType === 'exam') typeScore = 15;
  else if (taskType === 'assignment') typeScore = 10;
  else if (taskType === 'reading') typeScore = 5;

  const totalScore = urgencyScore + weightageScore + effortScore + typeScore;

  let priority = 'medium';
  let levelName = 'Medium';
  if (totalScore >= 70 || diffHours <= 24 || (taskType === 'exam' && diffHours <= 72)) {
    priority = 'critical';
    levelName = 'Critical';
  } else if (totalScore >= 50 || diffHours <= 48 || weightage >= 15) {
    priority = 'high';
    levelName = 'High';
  } else if (totalScore < 30 && diffHours > 168) {
    priority = 'low';
    levelName = 'Low';
  }

  // Explainable AI Reasoning (Phase 7)
  const dueText = diffHours <= 24 ? 'due within 24 hours' : `due in ${(diffHours / 24).toFixed(1)} days`;
  const weightText = weightage > 0 ? `carries ${weightage}% grade weightage` : 'standard coursework';
  const effortText = `${(estimatedMinutes / 60).toFixed(1)} hrs estimated effort`;

  const reasoning = `${levelName} Priority (${totalScore}/100 score): ${taskType.toUpperCase()} is ${dueText}, ${weightText}, and requires ${effortText}.`;

  return {
    priority,
    score: totalScore,
    reasoning
  };
};

export default calculateSmartPriority;
