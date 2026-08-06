/**
 * Client Date & Timezone Utilities
 */

/**
 * Formats an ISO date string to a localized human-readable format.
 */
export const formatDate = (isoString: string): string => {
  if (!isoString) return 'No deadline';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Invalid date';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

/**
 * Returns a human-friendly relative deadline string (e.g. "Due in 2 days", "Overdue by 3 hours", "Due today").
 */
export const getRelativeDeadline = (isoString: string): { label: string; isOverdue: boolean; isUrgent: boolean } => {
  if (!isoString) return { label: 'No deadline', isOverdue: false, isUrgent: false };

  const deadline = new Date(isoString).getTime();
  if (isNaN(deadline)) return { label: 'Invalid date', isOverdue: false, isUrgent: false };

  const now = Date.now();
  const diffMs = deadline - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    const absHours = Math.abs(diffHours);
    if (absHours < 24) {
      return { label: `Overdue by ${absHours} hr${absHours === 1 ? '' : 's'}`, isOverdue: true, isUrgent: true };
    }
    const absDays = Math.abs(diffDays);
    return { label: `Overdue by ${absDays} day${absDays === 1 ? '' : 's'}`, isOverdue: true, isUrgent: true };
  }

  if (diffHours < 24) {
    return { label: `Due today (${diffHours} hr${diffHours === 1 ? '' : 's'} left)`, isOverdue: false, isUrgent: true };
  }

  if (diffDays <= 2) {
    return { label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`, isOverdue: false, isUrgent: true };
  }

  return { label: `Due in ${diffDays} days`, isOverdue: false, isUrgent: false };
};
