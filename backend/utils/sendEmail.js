/* ============================================================
   IbadahConnect — utils/sendEmail.js (v6)
   - Professional branded verification email (SHEIN-style layout)
   - Lazy transporter (fresh creds per send — stale bug khatam)
   - Sahi .env path (backend/.env) + multi-name fallbacks
   - Compat exports: require() default + destructuring dono chalein
   CHANGELOG v6 (noise + token=undefined fixes):
   - 4-line [DEV FALLBACK] banner removed — tha HAR verification pe,
     chahe email sahi gayi ho. Ab: email gayi to sirf 1 ✅ line;
     email nahi gayi to 1 compact [VERIFY LINK] line (testing na rukey).
   - Network/DNS errors throttled: 10 min me sirf 1 short warning.
   - Recipient guard: khali/invalid "to" pe send skip (No recipients
     defined error ab possible hi nahi).
   - token missing ho to link me "token=undefined" nahi banta.
   ============================================================ */

const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

/* ---------- ENV LOAD (robust — pehla existing .env use karo) ---------- */
const ENV_CANDIDATES = [
  path.join(__dirname, '..', '.env'), // backend/.env  ← asli location
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '.env'),
];
for (const p of ENV_CANDIDATES) {
  if (fs.existsSync(p)) {
    require('dotenv').config({ path: p, override: false });
    break;
  }
}

const SMTP_USER =
  process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const EMAIL_FROM =
  process.env.EMAIL_FROM || 'IbadahConnect <' + (SMTP_USER || 'noreply@ibadahconnect.com') + '>';
const BASE_URL = process.env.BASE_URL || process.env.CLIENT_URL || 'http://localhost:5173';

/* ---------- LOG THROTTLE (same pattern as orders.js / auth.js) -------- */
const _logOnce = new Map();
function logOnce(key, msg, ttlMs = 10 * 60 * 1000) {
  const now = Date.now();
  const last = _logOnce.get(key) || 0;
  if (now - last < ttlMs) return;
  _logOnce.set(key, now);
  console.log(msg);
}

/* ---------- NETWORK ERROR? (Wi-Fi off / DNS / Gmail unreachable) ------ */
function isNetworkError(err) {
  if (!err) return false;
  const code = err.code || '';
  const msg = String(err.message || '');
  return (
    ['ENETUNREACH', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EHOSTUNREACH', 'ENOTFOUND', 'EAI_AGAIN', 'ESOCKET']
      .includes(code) ||
    /timeout|TLS|greeting/i.test(msg)
  );
}

/* ------------------------- EMAIL HTML TEMPLATE ------------------------- */

function buildVerifyHtml({ name, verifyUrl }) {
  const year = new Date().getFullYear();
  const benefit = (txt) =>
    '<tr><td style="padding:5px 0;color:#4b5f57;font-size:14px;line-height:1.6;">' +
    '<span style="color:#0d6b44;font-weight:bold;">&#10004;</span>&nbsp;&nbsp;' + txt + '</td></tr>';

  return (
    '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#eef5f1;font-family:Arial,Helvetica,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef5f1;padding:28px 12px;">' +
    '<tr><td align="center">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">' +

    /* HEADER */
    '<tr><td style="background:#0a4d32;padding:30px 36px;text-align:center;border-radius:14px 14px 0 0;border-bottom:4px solid #c9a227;">' +
    '<div style="font-size:32px;line-height:1;">&#128331;</div>' +
    '<div style="color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:1px;margin-top:10px;">IbadahConnect</div>' +
    '<div style="color:#c9e5d6;font-size:11px;letter-spacing:3px;margin-top:5px;">HAJJ &amp; UMRAH BADAL PLATFORM</div>' +
    '</td></tr>' +

    /* BODY */
    '<tr><td style="background:#ffffff;padding:38px 40px;">' +
    '<h1 style="color:#123528;font-size:21px;margin:0 0 18px;">Please Verify Your Email Address</h1>' +
    '<p style="color:#4b5f57;font-size:15px;line-height:1.7;margin:0 0 14px;">Dear ' + name + ',</p>' +
    '<p style="color:#4b5f57;font-size:15px;line-height:1.7;margin:0 0 6px;">Thank you for joining <b style="color:#0a4d32;">IbadahConnect</b> — the trusted platform to perform Hajj &amp; Umrah on behalf of your loved ones.</p>' +
    '<p style="color:#4b5f57;font-size:15px;line-height:1.7;margin:0 0 8px;">To activate your account, please confirm your email address by clicking the button below:</p>' +

    /* CTA BUTTON */
    '<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:26px auto;"><tr>' +
    '<td style="background:#0d6b44;border-radius:10px;">' +
    '<a href="' + verifyUrl + '" style="display:inline-block;padding:15px 44px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;">Verify Account</a>' +
    '</td></tr></table>' +

    '<p style="color:#8fa39a;font-size:12px;text-align:center;margin:18px 0 6px;">Button kaam na kare to yeh link copy karke browser mein kholo:</p>' +
    '<p style="word-break:break-all;color:#0d6b44;font-size:12px;text-align:center;margin:0 0 8px;">' + verifyUrl + '</p>' +

    /* BENEFITS */
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f3;border:1px solid #d8eae0;border-radius:12px;padding:18px 22px;margin:24px 0;">' +
    '<tr><td style="padding:4px 8px;"><p style="color:#123528;font-weight:bold;font-size:14px;margin:0 0 8px;">After verification, you can:</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    benefit('Book Umrah, Hajj &amp; Donation Badal packages') +
    benefit('Receive photo proof of every ritual milestone') +
    benefit('Get real-time order status &amp; performer updates') +
    benefit('Enjoy a secure account with full support access') +
    '</table></td></tr></table>' +

    '<p style="color:#8a6d1a;background:#fdf6e3;border:1px solid #f0e3bb;border-radius:10px;padding:12px 16px;font-size:13px;line-height:1.6;margin:20px 0 16px;">&#9203; For security reasons, this verification link is valid for a limited time.</p>' +
    '<p style="color:#8fa39a;font-size:12px;line-height:1.6;margin:0;">If you did not create an account on IbadahConnect, you can safely ignore this email.</p>' +
    '</td></tr>' +

    /* FOOTER */
    '<tr><td style="background:#0a4d32;border-radius:0 0 14px 14px;padding:22px 30px;text-align:center;">' +
    '<div style="color:#c9e5d6;font-size:12px;letter-spacing:1px;">Perform Hajj &amp; Umrah on behalf of your loved ones</div>' +
    '<div style="color:#7da894;font-size:10.5px;line-height:1.7;margin-top:10px;">&#169; ' + year + ' IbadahConnect. All rights reserved.<br>This e-mail was sent from a notification-only address that cannot accept incoming e-mails. Please do not reply.</div>' +
    '</td></tr>' +

    '</table></td></tr></table></body></html>'
  );
}

/* ---------------------------- CORE SENDER ---------------------------- */

async function sendMailSafe({ to, subject, html, text }) {
  if (!SMTP_USER || !SMTP_PASS) {
    logOnce(
      'email-creds',
      '[EMAIL] SMTP creds missing (.env) — email skip, verify link console me aa raha hai.'
    );
    return { success: false, dev: true };
  }

  // Recipient guard — "No recipients defined" ab kabhi throw hi nahi hoga
  const safeTo = String(to || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(safeTo)) {
    logOnce('email-no-recipient', '[EMAIL] Recipient email missing/invalid — email skipped, app flow unaffected.');
    return { success: false, error: new Error('No recipients defined') };
  }

  try {
    // Fresh transporter per send — koi stale credentials bug possible nahi
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
    await transporter.sendMail({ from: EMAIL_FROM, to: safeTo, subject, html, text });
    console.log('[EMAIL] ✅ Sent to ' + safeTo);
    return { success: true };
  } catch (err) {
    if (isNetworkError(err)) {
      // Wi-Fi off / DNS issue / Gmail down — 10 min me sirf 1 dafa short warning
      logOnce('email-net', '[EMAIL] Gmail SMTP abhi reachable nahi (network/DNS) — email skipped, app flow unaffected.');
    } else {
      // Real config problem (wrong password etc.) — per-error ek dafa
      logOnce(
        'email-err-' + String(err.code || err.message || 'unknown').slice(0, 60),
        '[EMAIL] Send failed: ' + (err.message || err)
      );
    }
    return { success: false, error: err };
  }
}

/* ------------------------ VERIFICATION EMAIL ------------------------- */

async function sendVerificationEmail(userOrPayload, tokenArg) {
  // Flexible signature support:
  //   sendVerificationEmail(user, token)
  //   sendVerificationEmail({ email, name, firstName, token })
  let user = {};
  let token = tokenArg;
  if (userOrPayload && typeof userOrPayload === 'object') {
    user = userOrPayload;
    if (!token && userOrPayload.token) token = userOrPayload.token;
  } else if (userOrPayload) {
    user = { email: userOrPayload };
  }

  const to = user.email || (typeof userOrPayload === 'string' ? userOrPayload : '') || '';
  const name = user.firstName || user.name || 'User';

  // FIX (token=undefined): token na ho to link me "token=undefined" nahi jayega
  const safeToken = token ? String(token) : '';
  if (!safeToken) {
    logOnce('verify-token-missing', '[EMAIL] Verification token missing — link bina token ke hai.');
  }
  const verifyUrl = BASE_URL + '/verify-email' + (safeToken ? '?token=' + safeToken : '');

  const html = buildVerifyHtml({ name, verifyUrl });
  const text =
    'Please Verify Your Email Address\n\nDear ' + name + ',\n\n' +
    'Thank you for joining IbadahConnect. Click the link below to verify your account:\n' +
    verifyUrl + '\n\nIf you did not create an account, you can safely ignore this email.\n\n— IbadahConnect';

  const result = await sendMailSafe({
    to,
    subject: 'IbadahConnect — Please Verify Your Email Address',
    html,
    text,
  });

  // Email nahi gayi (creds missing ya network down) — link console pe,
  // ek compact line, taake dev/testing flow kabhi na rukey.
  if (!result.success) {
    console.log('[VERIFY LINK] ' + verifyUrl);
  }

  return { dev: true, ...result };
}

/* --------------------- GENERIC EMAIL (compat) ------------------------ */

async function sendEmail(opts) {
  return sendMailSafe({
    to: opts && opts.to,
    subject: (opts && opts.subject) || 'IbadahConnect',
    html: (opts && opts.html) || '<p>' + ((opts && opts.text) || '') + '</p>',
    text: (opts && opts.text) || '',
  });
}

/* --------- COMPAT EXPORTS (har import style pe chalega) -------------- */
sendVerificationEmail.sendVerificationEmail = sendVerificationEmail;
sendVerificationEmail.sendEmail = sendEmail;
sendVerificationEmail.sendMailSafe = sendMailSafe;

module.exports = sendVerificationEmail;