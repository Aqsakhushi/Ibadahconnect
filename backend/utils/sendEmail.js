// ============================================================
// sendEmail.js - Nodemailer transporter (Email Verification + future emails)
// Env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, BASE_URL
// ============================================================
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('[EMAIL] SMTP env vars missing - email send skipped. (.env check karo)');
      return false;
    }
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `IbadahConnect <${process.env.SMTP_USER}>`,
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
