import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { generateReminderEmailHtml } from '../templates/reminderTemplate.js';

dotenv.config();

// Cached Singleton Transporter Instance
let cachedTransporter = null;

/**
 * Returns a cached single Nodemailer Transporter instance with pooled connections and strict socket timeouts.
 */
export const createTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    pool: true, // Enable connection pooling to reuse socket handshakes
    maxConnections: 3,
    maxMessages: 100,
    // Strict Socket Timeouts (prevents 2-minute default hanging)
    connectionTimeout: 8000,  // 8s TCP connection timeout
    greetingTimeout: 8000,    // 8s SMTP greeting timeout
    socketTimeout: 10000,     // 10s socket inactivity timeout
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return cachedTransporter;
};

/**
 * Fast synchronous configuration check (0ms roundtrip).
 */
export const validateSmtpConfig = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = process.env.EMAIL_PORT || '587';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || user === 'your-email@gmail.com') {
    return { valid: false, reason: 'EMAIL_USER environment variable missing or set to default placeholder ("your-email@gmail.com")' };
  }

  if (!pass || pass === 'your-16-character-app-password') {
    return { valid: false, reason: 'EMAIL_PASS environment variable missing or set to default placeholder ("your-16-character-app-password")' };
  }

  return { valid: true, host, port, user };
};

/**
 * Verifies that Nodemailer environment variables are present and tests connection to Gmail SMTP.
 * Should be run at server startup or on-demand diagnostic checks, NOT in critical user request path.
 */
export const verifySmtpConnection = async () => {
  const configCheck = validateSmtpConfig();
  const maskedPass = process.env.EMAIL_PASS ? (process.env.EMAIL_PASS.length > 4 ? `${process.env.EMAIL_PASS.substring(0, 3)}***` : '***') : '[NOT SET]';

  console.log('🔍 [EMAIL CONFIG CHECK]:');
  console.log(`   - EMAIL_HOST: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}`);
  console.log(`   - EMAIL_PORT: ${process.env.EMAIL_PORT || '587'}`);
  console.log(`   - EMAIL_USER: ${process.env.EMAIL_USER || '[NOT SET]'}`);
  console.log(`   - EMAIL_PASS: ${maskedPass}`);
  console.log(`   - EMAIL_FROM: ${process.env.EMAIL_FROM || '[NOT SET]'}`);

  if (!configCheck.valid) {
    console.warn(`⚠️ [SMTP VERIFICATION]: ${configCheck.reason}. Real emails cannot be delivered.`);
    return { success: false, reason: configCheck.reason };
  }

  try {
    const startTime = performance.now();
    const transporter = createTransporter();
    console.log(`🔄 [SMTP VERIFICATION]: Testing connection to ${configCheck.host}:${configCheck.port}...`);
    await transporter.verify();
    const durationMs = (performance.now() - startTime).toFixed(2);
    console.log(`✅ [SMTP VERIFICATION]: Successfully verified Gmail SMTP connection in ${durationMs} ms!`);
    return { success: true, durationMs };
  } catch (err) {
    console.error(`❌ [SMTP VERIFICATION FAILED]: Unable to connect to SMTP server: ${err.message}`);
    return { success: false, reason: err.message, error: err };
  }
};

/**
 * Sends a deadline reminder email to a user with retry logic and high-precision performance metrics.
 */
export const sendDeadlineReminder = async ({
  toEmail,
  userName,
  assignmentTitle,
  subject,
  priority,
  deadlineFormatted,
  estimatedStudyTime,
  retries = 1
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
      const sendStart = performance.now();
      console.log(`📧 [EMAIL SENDING]: Dispatching mail to ${toEmail} (Attempt ${attempt}/${retries + 1})...`);
      
      const info = await transporter.sendMail(mailOptions);
      const sendDurationMs = (performance.now() - sendStart).toFixed(2);
      
      console.log(`⚡ [SMTP SENDMAIL TIME]: ${sendDurationMs} ms`);
      console.log(`✅ [EMAIL SENT SUCCESSFULLY]: Reminder sent to ${toEmail} (MessageId: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error(`❌ [EMAIL ATTEMPT ${attempt}/${retries + 1} FAILED]: ${err.message}`);
      if (attempt > retries) {
        console.error(`❌ [EMAIL FATAL]: Exhausted all ${retries + 1} retry attempts for ${toEmail}. Skipped.`);
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return false;
};

/**
 * Sends an immediate test email with microsecond performance measurements.
 */
export const sendTestEmail = async ({ toEmail, userName = 'Student' }) => {
  const funcStart = performance.now();
  console.log('\n📧 [TEST EMAIL INITIATED]: Preparing high-performance test email dispatch');
  console.log(`   Target Email: ${toEmail}`);
  console.log(`   Recipient Name: ${userName}`);

  // 1. Fast config validation (0ms roundtrip)
  const configCheck = validateSmtpConfig();
  if (!configCheck.valid) {
    console.error(`❌ [TEST EMAIL FAILED]: ${configCheck.reason}`);
    throw new Error(`SMTP Configuration Invalid: ${configCheck.reason}`);
  }

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

  const sendStart = performance.now();
  const success = await sendDeadlineReminder({
    toEmail,
    userName,
    assignmentTitle: 'Test Email Reminder - System Verification',
    subject: 'System Test',
    priority: 'high',
    deadlineFormatted,
    estimatedStudyTime: '1.0 hr (60 min)',
    retries: 0 // No retry delay on test requests for maximum speed
  });

  const totalDurationMs = (performance.now() - funcStart).toFixed(2);
  const smtpDurationMs = (performance.now() - sendStart).toFixed(2);

  if (!success) {
    throw new Error('Failed to deliver test email. Check server logs for exact SMTP error details.');
  }

  console.log(`⏱️ [EMAIL SERVICE TIMING BREAKDOWN]:`);
  console.log(`   - SMTP sendMail() duration: ${smtpDurationMs} ms`);
  console.log(`   - Total email service duration: ${totalDurationMs} ms`);
  console.log(`✅ [TEST EMAIL COMPLETED]: Email sent successfully to ${toEmail}`);

  return { success: true, smtpDurationMs, totalDurationMs };
};



