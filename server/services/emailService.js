import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { generateReminderEmailHtml } from '../templates/reminderTemplate.js';

dotenv.config();

// Create Nodemailer Transporter
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('⚠️ [EMAIL SERVICE]: EMAIL_USER or EMAIL_PASS environment variables missing. Email sending will fail until configured.');
  }

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
    console.error(`[EMAIL ERROR]: Invalid or missing email address: "${toEmail}". Skipping.`);
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
      const info = await transporter.sendMail(mailOptions);
      console.log(`⚡ [EMAIL SUCCESS]: Reminder sent for "${assignmentTitle}" to ${toEmail} (MessageId: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error(`❌ [EMAIL ATTEMPT ${attempt}/${retries + 1} FAILED]: ${err.message}`);
      if (attempt > retries) {
        console.error(`[EMAIL FATAL]: Exhausted all ${retries + 1} retry attempts for ${toEmail}. Skipped.`);
        return false;
      }
      // Wait 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return false;
};
