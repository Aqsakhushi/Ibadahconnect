// backend/mailer.js — standalone SMTP helper (env-based, kisi aur file pe depend nahi)
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function sendMail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || `IbadahConnect <${process.env.SMTP_USER}>`;
  return transporter.sendMail({ from, to, subject, html, text: text || '' });
}

module.exports = { sendMail };