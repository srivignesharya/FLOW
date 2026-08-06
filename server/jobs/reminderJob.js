import cron from 'node-cron';
import { supabaseAdmin } from '../services/supabase.js';
import { sendDeadlineReminder, verifySmtpConnection } from '../services/emailService.js';

/**
 * Hourly Cron Job: Checks pending tasks due in the next 24 hours,
 * sends emails, and updates notification_sent = true.
 */
export const checkAndSendReminders = async () => {
  try {
    console.log('\n============================================================');
    console.log('⏰ [CRON JOB STARTED]: Deadline reminder sweep initiated');
    console.log(`   Execution Time: ${new Date().toISOString()}`);
    console.log('============================================================');

    // 1. Verify SMTP connection state
    await verifySmtpConnection();

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log(`\n🔍 [TASK QUERY]: Searching for pending tasks meeting filter:`);
    console.log(`   - status != 'completed'`);
    console.log(`   - notification_sent = false`);
    console.log(`   - deadline >= ${now.toISOString()} (Now)`);
    console.log(`   - deadline <= ${next24Hours.toISOString()} (+24 Hours)`);

    // 2. Query pending/in_progress tasks due in next 24h where notification_sent = false
    const { data: tasks, error: tasksErr } = await supabaseAdmin
      .from('tasks')
      .select('id, title, subject, priority, deadline, estimated_minutes, user_id, notification_sent, status, profiles(email, full_name)')
      .neq('status', 'completed')
      .eq('notification_sent', false)
      .gte('deadline', now.toISOString())
      .lte('deadline', next24Hours.toISOString());

    if (tasksErr) {
      console.error('❌ [REMINDER JOB DB ERROR]:', tasksErr.message);
      return;
    }

    const tasksFoundCount = tasks ? tasks.length : 0;
    console.log(`📊 [TASKS FOUND]: ${tasksFoundCount} task(s) matching criteria.`);

    if (!tasks || tasks.length === 0) {
      console.log('ℹ️ [REMINDER JOB]: No tasks due in the next 24 hours require email notification.');
      
      // Diagnostic query: find nearest upcoming pending tasks to explain why 0 were found
      const { data: upcoming } = await supabaseAdmin
        .from('tasks')
        .select('id, title, deadline, status, notification_sent')
        .neq('status', 'completed')
        .order('deadline', { ascending: true })
        .limit(3);

      if (upcoming && upcoming.length > 0) {
        console.log('📌 [DIAGNOSTIC - NEAREST UPCOMING TASKS IN DB]:');
        upcoming.forEach((t, i) => {
          console.log(`   ${i + 1}. "${t.title}" | Deadline: ${t.deadline} | Status: ${t.status} | Notified: ${t.notification_sent}`);
        });
        console.log(`💡 [EXPLANATION]: Nearest task deadline is "${upcoming[0].deadline}". That is beyond the 24-hour reminder threshold (${next24Hours.toISOString()}).`);
      } else {
        console.log('💡 [EXPLANATION]: Database has no active (non-completed) tasks.');
      }
      return;
    }

    // 3. Process each task
    for (const task of tasks) {
      const recipientEmail = task.profiles?.email;
      const userName = task.profiles?.full_name || 'Student';

      if (!recipientEmail) {
        console.warn(`⚠️ [REMINDER JOB WARNING]: Task "${task.title}" (ID: ${task.id}) has no associated profile email. Skipping.`);
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

      // 4. Send email
      const sentSuccess = await sendDeadlineReminder({
        toEmail: recipientEmail,
        userName,
        assignmentTitle: task.title,
        subject: task.subject || 'General',
        priority: task.priority || 'medium',
        deadlineFormatted,
        estimatedStudyTime: estHours
      });

      // 5. Update notification_sent status in DB
      if (sentSuccess) {
        const { error: updateErr } = await supabaseAdmin
          .from('tasks')
          .update({ notification_sent: true, updated_at: new Date().toISOString() })
          .eq('id', task.id);

        if (updateErr) {
          console.error(`❌ [REMINDER JOB DB UPDATE ERROR] for task ${task.id}:`, updateErr.message);
        } else {
          console.log(`✅ [REMINDER JOB]: Successfully marked notification_sent=true for task "${task.title}"`);
        }
      }
    }
  } catch (err) {
    console.error('❌ [REMINDER JOB UNHANDLED EXCEPTION]:', err.message);
  }
};

/**
 * Initializes the node-cron scheduler (runs once per hour: 0 * * * *).
 */
export const initReminderScheduler = () => {
  console.log('⚡ [REMINDER SCHEDULER]: Initializing node-cron hourly job schedule ("0 * * * *")...');
  
  // Run cron every hour on minute 0
  cron.schedule('0 * * * *', () => {
    console.log('⏰ [CRON TRIGGERED]: Hourly schedule (0 * * * *) triggered.');
    checkAndSendReminders();
  });

  // Run initial check 10 seconds after server startup
  setTimeout(() => {
    console.log('⏰ [CRON INITIAL RUN]: Running startup reminder check...');
    checkAndSendReminders();
  }, 10000);
};

