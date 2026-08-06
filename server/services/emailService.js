import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from 'dns';
import { generateReminderEmailHtml } from '../templates/reminderTemplate.js';

dotenv.config();

// Force Node.js DNS resolution to prefer IPv4 (prevents ENETUNREACH errors on Render/cloud environments without IPv6 routing)
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  // Ignore fallback if unsupported in older Node versions
}

// Cached Singleton Transporter Instance
let cachedTransporter = null;
let cachedTransporterPort = null;

/**
 * Resolves a hostname string to a guaranteed explicit IPv4 address string.
 * Prevents Linux container glibc gai.conf from binding sockets to IPv6 (:::0).
 */
export const resolveIPv4Host = async (hostname) => {
  if (!hostname || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return hostname;
  }

  return new Promise((resolve) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err || !address) {
        console.warn(`⚠️ [IPV4 RESOLVER WARN]: Could not resolve IPv4 for ${hostname}. Falling back to hostname. Error: ${err?.message}`);
        resolve(hostname);
      } else {
        console.log(`🌐 [IPV4 RESOLVER]: Resolved hostname "${hostname}" -> IPv4 Address "${address}"`);
        resolve(address);
      }
    });
  });
};

/**
 * Returns a Nodemailer Transporter instance configured with an explicit IPv4 address and strict socket timeouts.
 */
export const createTransporter = async (overridePort = null) => {
  const targetHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  
  // For Gmail SMTP (smtp.gmail.com), force Port 465 (Implicit TLS) because Port 587 is blocked by cloud firewalls (Render/AWS)
  let port = overridePort;
  if (!port) {
    if (targetHost.includes('gmail.com')) {
      port = 465;
    } else {
      port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 465;
    }
  }

  const secure = port === 465;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (cachedTransporter && cachedTransporterPort === port && !overridePort) {
    return cachedTransporter;
  }

  // Resolve hostname directly to IPv4 address string (e.g. "192.178.211.109")
  const resolvedIp = await resolveIPv4Host(targetHost);


  const transporter = nodemailer.createTransport({
    host: resolvedIp,
    port,
    secure,
    family: 4, // Force IPv4 family
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 8000,  // 8s TCP connection timeout
    greetingTimeout: 8000,    // 8s SMTP greeting timeout
    socketTimeout: 10000,     // 10s socket inactivity timeout
    auth: {
      user,
      pass
    },
    tls: {
      servername: targetHost, // SNI servername for SSL/TLS verification against Gmail certificate
      rejectUnauthorized: false
    }
  });

  if (!overridePort) {
    cachedTransporter = transporter;
    cachedTransporterPort = port;
  }

  return transporter;
};


/**
 * Startup validation for email service environment variables.
 */
export const validateEmailEnvironment = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const resendKey = process.env.RESEND_API_KEY;
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = process.env.EMAIL_PORT || '465';

  console.log('\n📧 [EMAIL SERVICE CONFIGURATION AUDIT]:');
  console.log(`   - RESEND_API_KEY: ${resendKey ? '✅ Configured (HTTPS Port 443 active)' : '⚠️ Not set (Using Nodemailer SMTP fallback)'}`);
  console.log(`   - EMAIL_HOST:     ${host}`);
  console.log(`   - EMAIL_PORT:     ${port}`);
  console.log(`   - EMAIL_USER:     ${user ? (user === 'your-email@gmail.com' ? '⚠️ Placeholder ("your-email@gmail.com")' : `✅ ${user}`) : '❌ Missing'}`);
  console.log(`   - EMAIL_PASS:     ${pass ? (pass === 'your-16-character-app-password' ? '⚠️ Placeholder ("your-16-character-app-password")' : '✅ Configured') : '❌ Missing'}`);

  if (!resendKey && (!user || user === 'your-email@gmail.com' || !pass || pass === 'your-16-character-app-password')) {
    console.warn('⚠️ [EMAIL SERVICE WARNING]: Credentials are missing or set to defaults. Email delivery will fail until updated.\n');
  } else {
    console.log('✅ [EMAIL SERVICE READY]: Email service configured cleanly.\n');
  }
};

/**
 * Fast synchronous configuration check (0ms roundtrip).
 */
export const validateSmtpConfig = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = process.env.EMAIL_PORT || '465';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (process.env.RESEND_API_KEY) {
    return { valid: true, host: 'https://api.resend.com', port: '443', user: 'Resend API' };
  }

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
  console.log(`   - EMAIL_PORT: ${process.env.EMAIL_PORT || '465 (Default)'}`);
  console.log(`   - EMAIL_USER: ${process.env.EMAIL_USER || '[NOT SET]'}`);
  console.log(`   - EMAIL_PASS: ${maskedPass}`);
  console.log(`   - EMAIL_FROM: ${process.env.EMAIL_FROM || '[NOT SET]'}`);

  if (!configCheck.valid) {
    console.warn(`⚠️ [SMTP VERIFICATION]: ${configCheck.reason}. Real emails cannot be delivered.`);
    return { success: false, reason: configCheck.reason };
  }

  try {
    const startTime = performance.now();
    const transporter = await createTransporter();
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
 * Sends email via Resend HTTP REST API (HTTPS Port 443 — supported on all cloud platforms including Render).
 */
export const sendViaResendApi = async ({ toEmail, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const sender = process.env.EMAIL_FROM || 'FLOW AI <onboarding@resend.dev>';
  console.log(`📧 [RESEND HTTPS]: Dispatching mail to ${toEmail} via HTTPS Port 443 (Resend REST API)...`);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: sender,
      to: [toEmail],
      subject,
      html
    })
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.message || `Resend API Error (HTTP ${res.status})`;
    console.error(`❌ [RESEND HTTPS ERROR]: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  console.log(`✅ [RESEND HTTPS SUCCESS]: Reminder sent to ${toEmail} (ID: ${data.id})`);
  return true;
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
  retries = 1,
  throwOnError = false
}) => {
  if (!toEmail || !toEmail.includes('@')) {
    const msg = `Invalid or missing email address: "${toEmail}". Skipping.`;
    console.error(`❌ [EMAIL ERROR]: ${msg}`);
    if (throwOnError) throw new Error(msg);
    return false;
  }

  const dashboardUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const html = generateReminderEmailHtml({
    userName,
    assignmentTitle,
    subject,
    priority,
    deadlineFormatted,
    estimatedStudyTime,
    dashboardUrl
  });
  const emailSubject = `📚 Reminder: "${assignmentTitle}" is due tomorrow`;

  // Option 1: Fast HTTPS API Dispatch if RESEND_API_KEY is configured
  if (process.env.RESEND_API_KEY) {
    try {
      return await sendViaResendApi({ toEmail, subject: emailSubject, html });
    } catch (err) {
      console.warn(`⚠️ [RESEND HTTPS FAILED]: Falling back to Nodemailer SMTP. Error: ${err.message}`);
    }
  }

  // Option 2: Nodemailer SMTP
  const emailUser = process.env.EMAIL_USER;
  const fromAddress = process.env.EMAIL_FROM || (emailUser ? `"FLOW AI (Powered by IMV)" <${emailUser}>` : undefined);

  if (!fromAddress) {
    const msg = 'EMAIL_FROM or EMAIL_USER environment variable is not configured.';
    console.error(`❌ [EMAIL ERROR]: ${msg}`);
    if (throwOnError) throw new Error(msg);
    return false;
  }

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: emailSubject,
    html
  };

  let attempt = 0;
  let lastError = null;
  let currentPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 465;

  while (attempt <= retries) {
    try {
      attempt++;
      const sendStart = performance.now();
      console.log(`📧 [EMAIL SENDING]: Dispatching mail to ${toEmail} via ${process.env.EMAIL_HOST || 'smtp.gmail.com'}:${currentPort} (Attempt ${attempt}/${retries + 1})...`);

      const transporter = await createTransporter(currentPort);
      const info = await transporter.sendMail(mailOptions);
      const sendDurationMs = (performance.now() - sendStart).toFixed(2);

      console.log(`⚡ [SMTP SENDMAIL TIME]: ${sendDurationMs} ms`);
      console.log(`✅ [EMAIL SENT SUCCESSFULLY]: Reminder sent to ${toEmail} (MessageId: ${info.messageId})`);
      return true;
    } catch (err) {
      lastError = err;
      cachedTransporter = null;
      console.error(`❌ [EMAIL ATTEMPT ${attempt}/${retries + 1} FAILED]: [${err.code || err.name || 'SMTP_ERROR'}] ${err.message}`);

      // Auto-fallback: If port 587 times out or fails (common on cloud hosts), switch to Port 465 SMTPS (Implicit TLS)
      if (currentPort === 587) {
        console.warn('⚠️ [SMTP FALLBACK]: Connection on Port 587 failed/timed out. Switching to SMTPS Port 465 (Implicit TLS)...');
        currentPort = 465;
      }

      if (attempt > retries) {
        let failureReason = err.message;
        if (err.message.includes('timeout') || err.code === 'ETIMEDOUT' || err.code === 'ESOCKET') {
          failureReason = 'Render Cloud Firewall blocks raw SMTP TCP sockets (Ports 25/587/465). Add RESEND_API_KEY to Render environment variables to send via HTTPS Port 443!';
        }
        console.error(`❌ [EMAIL FATAL]: Exhausted all ${retries + 1} retry attempts for ${toEmail}. Reason: ${failureReason}`);
        if (throwOnError) {
          throw new Error(failureReason);
        }
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  if (throwOnError && lastError) {
    throw new Error(`SMTP Delivery Failed: ${lastError.message}`);
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
    retries: 2,
    throwOnError: true // Propagate exact SMTP error message (e.g. 535 authentication, host unreachable, sender rejected)
  });

  const totalDurationMs = (performance.now() - funcStart).toFixed(2);
  const smtpDurationMs = (performance.now() - sendStart).toFixed(2);

  if (!success) {
    throw new Error('Failed to deliver test email.');
  }

  console.log(`⏱️ [EMAIL SERVICE TIMING BREAKDOWN]:`);
  console.log(`   - SMTP sendMail() duration: ${smtpDurationMs} ms`);
  console.log(`   - Total email service duration: ${totalDurationMs} ms`);
  console.log(`✅ [TEST EMAIL COMPLETED]: Email sent successfully to ${toEmail}`);

  return { success: true, smtpDurationMs, totalDurationMs };
};




