import { checkAndSendReminders } from '../jobs/reminderJob.js';

/**
 * Script to manually trigger the reminder job once for testing.
 * Usage: node scripts/testReminder.js
 */
async function runTest() {
  console.log('🧪 [TEST SCRIPT]: Executing manual deadline reminder test run...');
  await checkAndSendReminders();
  console.log('🧪 [TEST SCRIPT]: Manual deadline reminder test run complete.');
  process.exit(0);
}

runTest();
