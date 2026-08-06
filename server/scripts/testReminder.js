import { checkAndSendReminders } from '../jobs/reminderJob.js';

/**
 * Script to manually trigger the reminder job once for testing.
 * Usage: node scripts/testReminder.js
 */
async function runTest() {
  console.log('🧪 ============================================================');
  console.log('🧪 [TEST SCRIPT]: Starting End-to-End Email Reminder System Diagnosis');
  console.log('🧪 ============================================================');

  try {
    await checkAndSendReminders();
    console.log('\n🧪 ============================================================');
    console.log('🧪 [TEST SCRIPT]: Diagnosis & Test Run Completed Successfully.');
    console.log('🧪 ============================================================');
  } catch (err) {
    console.error('❌ [TEST SCRIPT ERROR]:', err);
  } finally {
    // Short delay before exit to allow pending log outputs to flush cleanly
    setTimeout(() => {
      process.exit(0);
    }, 500);
  }
}

runTest();

