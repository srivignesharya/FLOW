import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { generateReminderEmailHtml } from '../templates/reminderTemplate.js';

dotenv.config();

// Create Nodemailer Transporter
export const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Verifies that Nodemailer environment variables are present and tests connection to Gmail SMTP.
 */
export const verifySmtpConnection = async () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = process.env.EMAIL_PORT || '587';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || (user ? `"FLOW AI" <${user}>` : undefined);

  const maskedPass = pass ? (pass.length > 4 ? `${pass.substring(0, 3)}***` : '***') : '[NOT SET]';

  console.log('🔍 [EMAIL CONFIG CHECK]:');
  console.log(`   - EMAIL_HOST: ${host}`);
  console.log(`   - EMAIL_PORT: ${port}`);
  console.log(`   - EMAIL_USER: ${user || '[NOT SET]'}`);
  console.log(`   - EMAIL_PASS: ${maskedPass}`);
  console.log(`   - EMAIL_FROM: ${from || '[NOT SET]'}`);

  if (!user || user === 'your-email@gmail.com') {
    console.warn('⚠️ [SMTP VERIFICATION]: EMAIL_USER is missing or set to placeholder ("your-email@gmail.com"). Real emails cannot be delivered.');
    return { success: false, reason: 'EMAIL_USER is set to placeholder or missing' };
  }

  if (!pass || pass === 'your-16-character-app-password') {
    console.warn('⚠️ [SMTP VERIFICATION]: EMAIL_PASS is missing or set to placeholder ("your-16-character-app-password"). Real emails cannot be delivered.');
    return { success: false, reason: 'EMAIL_PASS is set to placeholder or missing' };
  }

  try {
    const transporter = createTransporter();
    console.log(`🔄 [SMTP VERIFICATION]: Attempting connection test to ${host}:${port}...`);
    await transporter.verify();
    console.log('✅ [SMTP VERIFICATION]: Successfully connected to Gmail SMTP server!');
    return { success: true };
  } catch (err) {
    console.error(`❌ [SMTP VERIFICATION FAILED]: Unable to connect to SMTP server: ${err.message}`);
    return { success: false, reason: err.message, error: err };
  }
};

/**
 * Sends a deadline reminder email to a user with retry logic.
 */
export const sendDeadlineReminder = async ({
  toEmail,
  userName,
  assignmentTitle,
  subject,
  priority,
  deadlineFormatted,
  estimatedStudyTime,
  retries = 2
}) => {
  if (!toEmail || !toEmail.includes('@')) {
    console.error(`❌ [EMAIL ERROR]: Invalid or missing email address: "${toEmail}". Skipping.`);
    return false;
  }

  const transporter = createTransporter();
  const dashboardUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const fromAddress = process.env.EMAIL_FROM || `"FLOW AI (Powered by IMV)" <${process.env.EMAIL_USER}>`;

  const html = generateReminderEmailHtml({
    userName,
    assignmentTitle,
    subject,
    priority,
    deadlineFormatted,
    estimatedStudyTime,
    dashboardUrl
  });

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: `📚 Reminder: "${assignmentTitle}" is due tomorrow`,
    html
  };

  let attempt = 0;
  while (attempt <= retries) {
    try {
      attempt++;
      console.log(`📧 [EMAIL SENDING]: Sending email to ${toEmail} for assignment "${assignmentTitle}" (Attempt ${attempt}/${retries + 1})...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ [EMAIL SENT SUCCESSFULLY]: Reminder sent to ${toEmail} (MessageId: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error(`❌ [EMAIL ATTEMPT ${attempt}/${retries + 1} FAILED]: ${err.message}`);
      if (attempt > retries) {
        console.error(`❌ [EMAIL FATAL]: Exhausted all ${retries + 1} retry attempts for ${toEmail}. Skipped.`);
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return false;
};

/**
 * Sends an immediate test email to verify Nodemailer SMTP configuration.
 */
export const sendTestEmail = async ({ toEmail, userName = 'Student' }) => {
  console.log('\n📧 [TEST EMAIL INITIATED]: Preparing test email dispatch');
  console.log(`   Target Email: ${toEmail}`);
  console.log(`   Recipient Name: ${userName}`);

  // 1. Verify SMTP connection first
  const verifyRes = await verifySmtpConnection();
  if (!verifyRes.success) {
    console.error(`❌ [TEST EMAIL FAILED]: SMTP connection check failed. Reason: ${verifyRes.reason}`);
    throw new Error(`SMTP Connection Failed: ${verifyRes.reason}`);
  }

  console.log('✅ [TEST EMAIL]: SMTP connection successful');

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const deadlineFormatted = tomorrow.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const success = await sendDeadlineReminder({
    toEmail,
    userName,
    assignmentTitle: 'Test Email Reminder - System Verification',
    subject: 'System Test',
    priority: 'high',
    deadlineFormatted,
    estimatedStudyTime: '1.0 hr (60 min)',
    retries: 1
  });

  if (!success) {
    throw new Error('Failed to deliver test email. Check server logs for details.');
  }

  console.log(`✅ [TEST EMAIL]: Email sent successfully to ${toEmail}`);
  return true;
};


