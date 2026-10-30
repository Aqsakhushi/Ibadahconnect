// ============================================================
// IbadahConnect — SMTP Diagnostic Tool (standalone, safe)
// ------------------------------------------------------------
// - Does NOT modify any other file. Safe to delete anytime.
// - Run:           node checkEmail.js
// - Custom target: node checkEmail.js someone@gmail.com
// ============================================================

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// ---- Load backend/.env manually (no dotenv dependency needed) ----
const envKeys = [];
try {
  const raw = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)\s*$/);
    if (m) {
      if (process.env[m[1]] === undefined) {
        process.env[m[1]] = (m[2] || '').replace(/^["']|["']$/g, '');
      }
      envKeys.push(m[1]);
    }
  }
} catch (err) {
  console.log('[ENV] No .env file found next to this script.');
}

// ---- Recipient (optional CLI arg) ----
const TO = process.argv[2] || 'nabeelchoudhry325@gmail.com';

// ---- Support common password variable names ----
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS =
  process.env.SMTP_PASS ||
  process.env.EMAIL_PASS ||
  process.env.GMAIL_PASS ||
  process.env.SMTP_PASSWORD ||
  process.env.EMAIL_PASSWORD ||
  process.env.MAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || `"IbadahConnect" <${SMTP_USER}>`;

(async () => {
  console.log('========== SMTP DIAGNOSTIC START ==========');
  console.log('[ENV] Keys in .env (values hidden):', envKeys.join(', ') || '(none)');
  console.log('[CONFIG] SMTP_USER :', SMTP_USER || '(MISSING)');
  console.log('[CONFIG] SMTP_PASS :', SMTP_PASS ? 'LOADED (hidden)' : '(MISSING)');
  console.log('[CONFIG] EMAIL_FROM:', EMAIL_FROM);
  console.log('[CONFIG] Test TO   :', TO);

  if (!SMTP_USER || !SMTP_PASS) {
    console.error('\n[ERROR] SMTP_USER or password not found.');
    console.error('Make sure backend/.env has these two lines:');
    console.error('  SMTP_USER=yourgmail@gmail.com');
    console.error('  SMTP_PASS=your-16-char-app-password');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // 465 = SSL
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    // Step 1: verify connection + login
    await transporter.verify();
    console.log('\n[STEP 1] SMTP connection + login OK');

    // Step 2: send one test email
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: TO,
      replyTo: SMTP_USER,
      subject: 'IbadahConnect SMTP Test — ' + new Date().toLocaleString(),
      text: 'SMTP test email from IbadahConnect backend. If you can read this, email delivery is working.',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#0d9488;margin-top:0;">IbadahConnect SMTP Test</h2>
          <p>This is a <b>test email</b> sent at <b>${new Date().toLocaleString()}</b> from the IbadahConnect backend.</p>
          <p style="color:#059669;font-weight:bold;">If you can read this, email delivery is working correctly.</p>
          <p style="color:#6b7280;font-size:12px;">Standalone diagnostic email — safe to ignore or delete.</p>
        </div>
      `,
    });

    console.log('\n[STEP 2] Send result:');
    console.log('  Message ID    :', info.messageId);
    console.log('  Accepted      :', JSON.stringify(info.accepted));
    console.log('  Rejected      :', JSON.stringify(info.rejected));
    console.log('  SMTP Response :', info.response);

    if (info.rejected && info.rejected.length > 0) {
      console.log('\n[RESULT] Gmail REJECTED the recipient:', JSON.stringify(info.rejected));
    } else if (String(info.response).startsWith('250')) {
      console.log('\n[RESULT] Gmail ACCEPTED the email (250 OK).');
      console.log('=> Now check Inbox + SPAM + "All Mail" of ' + TO);
      console.log('=> If found in SPAM, click "Not spam" once.');
    }
  } catch (err) {
    console.error('\n[SMTP ERROR] Email send FAILED:');
    console.error('  Code    :', err.code);
    console.error('  Response:', err.response || '(none)');
    console.error('  Message :', err.message);
  } finally {
    console.log('========== SMTP DIAGNOSTIC END ==========');
    process.exit(0);
  }
})();