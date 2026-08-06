import cron from 'node-cron';
import { supabaseAdmin } from '../services/supabase.js';
import { sendDeadlineReminder } from '../services/emailService.js';

/**
 * Hourly Cron Job: Checks pending tasks due in the next 24 hours,
 * sends emails, and updates notification_sent = true.
 */
export const checkAndSendReminders = async () => {
  try {
    console.log('⏰ [REMINDER JOB]: Checking for tasks due within the next 24 hours...');

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Query pending/in_progress tasks due in next 24h where notification_sent = false
    const { data: tasks, error: tasksErr } = await supabaseAdmin
      .from('tasks')
      .select('id, title, subject, priority, deadline, estimated_minutes, user_id, notification_sent, status, profiles(email, full_name)')
      .neq('status', 'completed')
      .eq('notification_sent', false)
      .gte('deadline', now.toISOString())
      .lte('deadline', next24Hours.toISOString());

    if (tasksErr) {
      console.error('[REMINDER JOB DB ERROR]:', tasksErr.message);
      return;
    }

    if (!tasks || tasks.length === 0) {
      console.log('⏰ [REMINDER JOB]: No upcoming deadlines require notification at this time.');
      return;
    }

    console.log(`⏰ [REMINDER JOB]: Found ${tasks.length} task(s) requiring deadline reminders.`);

    for (const task of tasks) {
      const recipientEmail = task.profiles?.email;
      const userName = task.profiles?.full_name || 'Student';

      if (!recipientEmail) {
        console.warn(`[REMINDER JOB WARNING]: Task "${task.title}" (ID: ${task.id}) has no associated profile email. Skipping.`);
        continue;
      }

      const deadlineDate = new Date(task.deadline);
      const deadlineFormatted = deadlineDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      const estHours = task.estimated_minutes ? `${(task.estimated_minutes / 60).toFixed(1)} hrs (${task.estimated_minutes} min)` : '1 hour';

      // Attempt sending email
      const sentSuccess = await sendDeadlineReminder({
        toEmail: recipientEmail,
        userName,
        assignmentTitle: task.title,
        subject: task.subject || 'General',
        priority: task.priority || 'medium',
        deadlineFormatted,
        estimatedStudyTime: estHours
      });

      // Update database status if notification succeeded
      if (sentSuccess) {
        const { error: updateErr } = await supabaseAdmin
          .from('tasks')
          .update({ notification_sent: true, updated_at: new Date().toISOString() })
          .eq('id', task.id);

        if (updateErr) {
          console.error(`[REMINDER JOB DB UPDATE ERROR] for task ${task.id}:`, updateErr.message);
        } else {
          console.log(`✅ [REMINDER JOB]: Successfully marked notification_sent=true for task "${task.title}"`);
        }
      }
    }
  } catch (err) {
    console.error('[REMINDER JOB UNHANDLED EXCEPTION]:', err.message);
  }
};

/**
 * Initializes the node-cron scheduler (runs once per hour: 0 * * * *).
 */
export const initReminderScheduler = () => {
  console.log('⚡ [REMINDER SCHEDULER]: Initializing node-cron hourly job (0 * * * *)...');
  
  // Run cron every hour on minute 0
  cron.schedule('0 * * * *', () => {
    checkAndSendReminders();
  });

  // Run initial check 10 seconds after server startup
  setTimeout(() => {
    checkAndSendReminders();
  }, 10000);
};
