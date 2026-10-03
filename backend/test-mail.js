/* ============================================================
   TEMP DEBUG SCRIPT — SMTP login test (baad mein DELETE karna)
   Run: backend folder mein  →  node test-mail.js
   Yeh current SMTP_PASS ko DONO gmail accounts ke saath test karta
   hai aur batata hai kaunsa combination sahi hai.
   ============================================================ */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const nodemailer = require('nodemailer');

const PASS = (process.env.SMTP_PASS || '').trim();
const TO = 'maryamsalman420@gmail.com';

const candidates = [
  'aqsakhushi47@gmail.com',
  'maryamsalman420@gmail.com',
];

(async () => {
  console.log('================================================');
  console.log('SMTP LOGIN TEST — app password:', PASS ? 'loaded (length ' + PASS.length + ')' : 'MISSING ❌');

  if (!PASS) {
    console.log('.env mein SMTP_PASS nahi mili — pehle woh add karo.');
    process.exit(1);
  }
  if (/\s/.test(process.env.SMTP_PASS)) {
    console.log('⚠️ WARNING: SMTP_PASS mein SPACES hain! .env mein spaces hata kar do.');
  }
  if (/^["']|["']$/.test(process.env.SMTP_PASS)) {
    console.log('⚠️ WARNING: SMTP_PASS ke around quotes hain! .env mein quotes hata do.');
  }

  for (const user of candidates) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user, pass: PASS },
        connectionTimeout: 15000,
      });
      const info = await transporter.sendMail({
        from: 'IbadahConnect <' + user + '>',
        to: TO,
        subject: 'SMTP Test OK — ' + user,
        text: 'Agar yeh email aayi hai to is combo se email jayegi: ' + user,
      });
      console.log('✅ SUCCESS with ' + user + '  (id: ' + info.messageId + ')');
      console.log('');
      console.log('👉 AB .env MEIN YEH 2 LINES KARO:');
      console.log('   SMTP_USER=' + user);
      console.log('   EMAIL_FROM=IbadahConnect <' + user + '>');
      console.log('   (SMTP_PASS wahi rehne do) → phir backend restart karo → DONE!');
      console.log('');
      console.log('Is test ke doran ' + TO + ' pe ek test email bhi gayi hai — Spam check karna.');
      process.exit(0);
    } catch (e) {
      const reason = (e.response || e.message || '').split('\n')[0];
      console.log('❌ FAILED with ' + user + '  →  ' + reason);
    }
  }

  console.log('');
  console.log('❌ DONO combos fail — matlab yeh App Password kisi teesre account ka hai');
  console.log('   ya Google ne revoke kar diya hai. NAYA App Password is tarah banao:');
  console.log('   1) Gmail kholo → top-right avatar → confirm karo KAUNSA account logged in hai');
  console.log('   2) myaccount.google.com/apppasswords  →  IbadahConnect  →  Create');
  console.log('   3) Naya 16-char password → .env mein SMTP_PASS= replace karo');
  console.log('   4) Fir yeh script dobara chalao: node test-mail.js');
  process.exit(1);
})();