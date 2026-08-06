interface CalendarTask {
  title: string;
  description?: string;
  deadline: string;
  estimatedMinutes?: number;
  subject?: string;
}

/**
 * Generates a direct Google Calendar web event creation URL.
 */
export const getGoogleCalendarUrl = (task: CalendarTask): string => {
  const startDate = new Date(task.deadline);
  const durationMinutes = task.estimatedMinutes || 60;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const formatIsoForGCal = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const dates = `${formatIsoForGCal(startDate)}/${formatIsoForGCal(endDate)}`;
  const title = encodeURIComponent(`[FLOW] ${task.title} (${task.subject || 'Academic'})`);
  const details = encodeURIComponent(`${task.description || ''}\n\nOrganized by FLOW AI Academic Platform.`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
};

/**
 * Generates and triggers browser download of an .ics iCalendar file.
 */
export const downloadIcsFile = (task: CalendarTask): void => {
  const startDate = new Date(task.deadline);
  const durationMinutes = task.estimatedMinutes || 60;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const formatIcsDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const csContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FLOW AI Academic Platform//EN',
    'BEGIN:VEVENT',
    `UID:flow-${Date.now()}@flow-ai.app`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:[FLOW] ${task.title}`,
    `DESCRIPTION:${(task.description || '').replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([csContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default getGoogleCalendarUrl;
