import cron from 'node-cron';
import { supabaseAdmin } from '../services/supabase.js';
import { sendDeadlineReminder, validateSmtpConfig } from '../services/emailService.js';

/**
 * Masks an email address for secure logging.
 * e.g., 'student@university.edu' -> 'st***t@university.edu'
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '<unknown email>';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
};

/**
 * Checks pending tasks due in the next 24 hours (or due today),
 * sends emails, and updates notification_sent = true only after success.
 */
export const checkAndSendReminders = async () => {
  try {
    console.log('🔎 [REMINDER CHECK] Checking upcoming deadlines');

    // 1. Validate email service configuration
    const configCheck = validateSmtpConfig();
    if (!configCheck.valid) {
      console.warn(`⚠️ [REMINDER CHECK SKIPPED]: ${configCheck.reason}`);
      return;
    }

    const now = new Date();
    // 24 hours in future
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // 24 hours in past grace period (catches today's deadlines stored with UTC 00:00:00 timestamp)
    const pastGracePeriod = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 2. Query pending tasks due today or within next 24h where notification_sent is false/null
    const { data: tasks, error: tasksErr } = await supabaseAdmin
      .from('tasks')
      .select('id, title, subject, priority, deadline, estimated_minutes, user_id, notification_sent, status, profiles(email, full_name)')
      .neq('status', 'completed')
      .or('notification_sent.eq.false,notification_sent.is.null')
      .gte('deadline', pastGracePeriod.toISOString())
      .lte('deadline', next24Hours.toISOString());

    if (tasksErr) {
      console.error('❌ [REMINDER CHECK DB ERROR]:', tasksErr.message);
      return;
    }

    const tasksFoundCount = tasks ? tasks.length : 0;
    console.log(`📋 [REMINDER CHECK] Tasks found: ${tasksFoundCount}`);

    if (!tasks || tasks.length === 0) {
      return;
    }

    // 3. Dispatch reminder for each task
    for (const task of tasks) {
      const recipientEmail = task.profiles?.email;
      const userName = task.profiles?.full_name || 'Student';

      if (!recipientEmail) {
        console.warn(`⚠️ [REMINDER] Task "${task.title}" (ID: ${task.id}) has no associated profile email. Skipping.`);
        continue;
      }

      const masked = maskEmail(recipientEmail);
      console.log(`📨 [REMINDER] Sending email to ${masked}`);

      const deadlineDate = new Date(task.deadline);
      const deadlineFormatted = deadlineDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      const estHours = task.estimated_minutes
        ? `${(task.estimated_minutes / 60).toFixed(1)} hrs (${task.estimated_minutes} min)`
        : '1 hour';

      try {
        // Send email with throwOnError to catch failures accurately
        const sentSuccess = await sendDeadlineReminder({
          toEmail: recipientEmail,
          userName,
          assignmentTitle: task.title,
          subject: task.subject || 'General',
          priority: task.priority || 'medium',
          deadlineFormatted,
          estimatedStudyTime: estHours,
          retries: 1,
          throwOnError: true
        });

        // 4. Mark notification_sent = true ONLY AFTER email is confirmed sent
        if (sentSuccess) {
          const { error: updateErr } = await supabaseAdmin
            .from('tasks')
            .update({ notification_sent: true, updated_at: new Date().toISOString() })
            .eq('id', task.id);

          if (updateErr) {
            console.error(`❌ [REMINDER] Email sent but failed to update notification_sent in DB for task "${task.title}":`, updateErr.message);
          } else {
            console.log(`✅ [REMINDER] Email sent successfully`);
          }
        }
      } catch (sendErr) {
        // Notification_sent remains false so subsequent scheduler checks will retry
        console.error(`❌ [REMINDER] Email failed for ${masked}: ${sendErr.message}`);
      }
    }
  } catch (err) {
    console.error('❌ [REMINDER JOB UNHANDLED EXCEPTION]:', err.message);
  }
};

/**
 * Initializes the node-cron scheduler.
 * Runs every 15 minutes and immediately 5 seconds after server startup.
 */
export const initReminderScheduler = () => {
  console.log('📧 [REMINDER SCHEDULER] Started');

  // Run cron every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    checkAndSendReminders();
  });

  // Run startup reminder check 5 seconds after server startup
  setTimeout(() => {
    checkAndSendReminders();
  }, 5000);
};

