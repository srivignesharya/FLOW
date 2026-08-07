/**
 * Defensive Task Validation Engine for Database Ingestion.
 * Ensures zero null values for title, deadline, priority, or description reach Supabase.
 */

export const sanitizeAndValidateTask = (rawTask, index = 0, defaultSubject = 'General') => {
  if (!rawTask || typeof rawTask !== 'object') {
    console.warn(`⚠️ [TASK VALIDATOR]: Skipped non-object task payload at index ${index}.`);
    return null;
  }

  // 1. Title Validation & Fallbacks (MUST NOT BE NULL OR EMPTY)
  let title = (rawTask.title || rawTask.name || rawTask.heading || rawTask.task_title || '').toString().trim();
  
  if (!title) {
    // Attempt fallback from description or subject
    const rawDesc = (rawTask.description || '').toString().trim();
    if (rawDesc.length > 0) {
      title = rawDesc.split(/[\n.]/)[0].slice(0, 60).trim();
    }
  }

  if (!title) {
    const rawSubject = (rawTask.subject || defaultSubject).toString().trim();
    title = `${rawSubject} — Academic Commitment ${index + 1}`;
  }

  // Final emergency safety net for title
  if (!title || title.length === 0) {
    title = `Extracted Academic Task ${index + 1}`;
  }

  // 2. Deadline Validation (Ensure valid ISO 8601 string)
  let deadline = rawTask.deadline;
  if (!deadline || isNaN(Date.parse(deadline))) {
    // Default deadline to 3 days from today if unparseable
    deadline = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
  } else {
    deadline = new Date(deadline).toISOString();
  }

  // 3. Priority Normalization & Validation
  const validPriorities = ['critical', 'high', 'medium', 'low'];
  let priority = (rawTask.priority || 'medium').toString().toLowerCase().trim();
  if (!validPriorities.includes(priority)) {
    priority = 'medium';
  }

  // 4. Task Type Normalization
  const validTypes = ['assignment', 'exam', 'announcement', 'reading', 'project'];
  let taskType = (rawTask.taskType || rawTask.task_type || 'assignment').toString().toLowerCase().trim();
  if (!validTypes.includes(taskType)) {
    taskType = 'assignment';
  }

  // 5. Subject & Numerical Bounds
  const subject = (rawTask.subject || defaultSubject).toString().trim() || 'General';
  const weightage = Math.max(0, Math.min(100, Number(rawTask.weightage) || 0));
  const estimatedMinutes = Math.max(15, Math.min(1440, Number(rawTask.estimatedMinutes || rawTask.estimated_minutes) || 60));
  const description = (rawTask.description || '').toString().trim();

  return {
    title,
    subject,
    deadline,
    weightage,
    priority,
    estimatedMinutes,
    description,
    taskType
  };
};

/**
 * Filter and sanitize array of raw extracted tasks
 */
export const sanitizeTaskBatch = (rawTasks = [], defaultSubject = 'General') => {
  if (!Array.isArray(rawTasks)) return [];

  const validTasks = [];
  rawTasks.forEach((raw, idx) => {
    const sanitized = sanitizeAndValidateTask(raw, idx, defaultSubject);
    if (sanitized) {
      validTasks.push(sanitized);
    } else {
      console.warn(`⚠️ [TASK VALIDATOR]: Skipped invalid task entry #${idx + 1}`);
    }
  });

  return validTasks;
};
