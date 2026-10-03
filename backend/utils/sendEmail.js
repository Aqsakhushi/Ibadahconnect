// ============================================================
// sendEmail.js - Nodemailer transporter (Email Verification + future emails)
// Env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, BASE_URL
// ============================================================
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// ---- SAFETY NET: dotenv/dotenvx fail bhi ho jaye to ye khud .env file parh lega ----
(function loadEnvFileManually() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('', envPath);
    return;
  }
  const raw = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
  const keys = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    keys.push(key);
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = val;
    }
  }
  console.log('[ENV FILE] .env ke keys mile:', keys.join(', '));
})();

const SMTP_USER_ENV = process.env.SMTP_USER || '';
const SMTP_PASS_ENV = process.env.SMTP_PASS || '';

// ---- STARTUP DIAGNOSTIC: har start par batayega kya mila kya missing ----
console.log('---------------- [EMAIL CONFIG] ----------------');
console.log(`SMTP_USER: ${SMTP_USER_ENV ? `SET (${SMTP_USER_ENV})` : 'MISSING - .env check karo!'}`);
console.log(`SMTP_PASS: ${SMTP_PASS_ENV ? `SET (length ${SMTP_PASS_ENV.length})` : 'MISSING - .env check karo!'}`);
console.log(`SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com (default)'}`);
console.log(`SMTP_PORT: ${process.env.SMTP_PORT || '587 (default)'}`);
console.log('------------------------------------------------');

const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  family: 4,
  auth: {
    user: SMTP_USER_ENV,
    pass: SMTP_PASS_ENV
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!SMTP_USER_ENV || !SMTP_PASS_ENV) {
      console.log('[EMAIL] SMTP_USER / SMTP_PASS missing - email skipped. Upar [EMAIL CONFIG] lines dekho.');
      return false;
    }
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `IbadahConnect <${SMTP_USER_ENV}>`,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('[EMAIL] SEND ERROR:', error.message);
    return false;
  }
};

const sendVerificationEmail = async (user, token) => {
  const base = process.env.BASE_URL || 'http://localhost:5173';
  const verifyUrl = `${base}/verify-email?token=${token}`;

  console.log('\n========================================================');
  console.log('[DEV FALLBACK] VERIFICATION LINK:');
  console.log(verifyUrl);
  console.log('========================================================\n');

  return sendEmail({
    to: user.email,
    subject: 'Verify your IbadahConnect account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px;">
        <h2 style="color:#1B5E20;margin:0 0 8px;">Assalam-o-Alaikum, ${user.firstName}!</h2>
        <p style="color:#444;line-height:1.6;">Welcome to <b>IbadahConnect</b>. Please confirm your email address to activate your account and start booking Badal services.</p>
        <p style="text-align:center;margin:28px 0;">
          <a href="${verifyUrl}" style="background:#1B5E20;color:#ffffff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:bold;border:2px solid #D4AF37;">
            Verify My Email
          </a>
        </p>
        <p style="color:#888;font-size:13px;line-height:1.5;">This link expires in 24 hours. If you did not create this account, you can safely ignore this email.</p>
        <p style="color:#1B5E20;font-weight:bold;margin-top:24px;">- Team IbadahConnect</p>
      </div>
    `
  });
};

module.exports = { sendEmail, sendVerificationEmail };