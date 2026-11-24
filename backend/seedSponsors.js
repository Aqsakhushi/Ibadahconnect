/**
 * seedSponsors.js — ONE-TIME DB utility
 * Kya karta hai:
 *   1) Purane SAB sponsors delete (role: 'Sponsor') — MAGAR default user
 *      aqsa@ibadah.com preserve rehta hai (server.js ka default user)
 *   2) 6 naye Sponsors create (bcrypt hashed password — login ready)
 *   3) Bonus: agar koi Admin exist nahi karta to 1 Admin account bana deta hai
 *      (payment/CNIC verification ke liye — agar zaroorat na ho to ignore karo)
 *
 * NOTE: Purane sponsors (Rafia waghera jo signup se aaye thay) DB me mojood
 *       nahi rahe — wo wapis nahi aa sakte (koi backup nahi). Ye script demo
 *       ke liye fresh, known-password sponsor accounts bana deti hai.
 *       (Orders cleanup is baar nahi — orders collection pehle se khali hai.)
 *
 * Run (backend folder se):  node seedSponsors.js
 */

try { require('dotenv').config(); } catch (e) { /* dotenv na ho to bhi chale */ }

const mongoose = require('mongoose');
let bcrypt;
try { bcrypt = require('bcryptjs'); } catch (e) { bcrypt = require('bcrypt'); }
const User = require('./models/User');

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  'mongodb://127.0.0.1:27017/ibadahconnect';

const PASSWORD = 'Sponsor@123';
const ADMIN_PASSWORD = 'Admin@123';

const SPONSORS = [
  { firstName: 'Rafia',  lastName: 'Khan',     email: 'rafia.khan@gmail.com',     phone: '+92 321 3234601', city: 'Lahore' },
  { firstName: 'Fatima', lastName: 'Noor',     email: 'fatima.noor@gmail.com',    phone: '+92 322 3394602', city: 'Karachi' },
  { firstName: 'Hira',   lastName: 'Shahid',   email: 'hira.shahid@gmail.com',    phone: '+92 342 8234603', city: 'Islamabad' },
  { firstName: 'Sana',   lastName: 'Malik',    email: 'sana.malik@gmail.com',     phone: '+92 322 7234604', city: 'Multan' },
  { firstName: 'Zainab', lastName: 'Ali',      email: 'zainab.ali@gmail.com',     phone: '+92 301 0934605', city: 'Faisalabad' },
  { firstName: 'Maryam', lastName: 'Siddiqui', email: 'maryam.siddiqui@gmail.com', phone: '+92 327 8234606', city: 'Rawalpindi' },
];

const buildDoc = (p, hash) => ({
  firstName: p.firstName,
  lastName: p.lastName,
  country: 'Pakistan',
  phone: p.phone,
  email: p.email,
  password: hash,
  role: 'Sponsor',
  isVerified: true,          // koi approval-pending block na aaye — testing ke liye
  isEmailVerified: true,     // email verification bypass — testing ke liye
  city: p.city,
  bio: 'Sponsor account for testing — books Umrah/Hajj Badal and donations for loved ones via IbadahConnect.',
});

(async () => {
  try {
    console.log('MongoDB connect ho raha hai...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected:', MONGO_URI);

    // 1) Purane sponsors DELETE — aqsa@ibadah.com (default user) SAFE rehta hai
    const del = await User.deleteMany({ role: 'Sponsor', email: { $ne: 'aqsa@ibadah.com' } });
    console.log(`Purane sponsors delete: ${del.deletedCount} (aqsa@ibadah.com preserved)`);

    // 2) 6 naye sponsors CREATE
    const hash = await bcrypt.hash(PASSWORD, 10);
    let ok = 0;
    for (const p of SPONSORS) {
      try {
        await User.create(buildDoc(p, hash));
        ok++;
        console.log(`Created: ${p.firstName} ${p.lastName} — ${p.email}`);
      } catch (e) {
        console.log(`FAILED: ${p.email} — ${e.message}`);
      }
    }

    // 3) BONUS: Admin account — sirf tab jab koi Admin mojood na ho
    try {
      const adminExists = await User.findOne({ role: 'Admin' });
      if (!adminExists) {
        const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await User.create({
          firstName: 'Aqsa',
          lastName: 'Admin',
          country: 'Pakistan',
          phone: '+92 300 1234600',
          email: 'admin@ibadah.com',
          password: adminHash,
          role: 'Admin',
          isVerified: true,
          isEmailVerified: true,
          city: 'Lahore',
          bio: 'Platform administrator — payment proof verification, CNIC verification aur stuck orders handling.',
        });
        console.log('Created: Admin — admin@ibadah.com');
      } else {
        console.log('Admin already exists — skip (no changes).');
      }
    } catch (e) {
      console.log('Admin create skip:', e.message);
    }

    // 4) Credentials summary
    console.log('\n================ LOGIN CREDENTIALS ================');
    console.log('Password (sab sponsors ka same): Sponsor@123\n');
    SPONSORS.forEach((p, i) => {
      console.log(`${i + 1}. ${p.email}  —  ${p.firstName} ${p.lastName} (${p.city})`);
    });
    console.log('\nAdmin: admin@ibadah.com  —  Admin@123 (agar upar "Created: Admin" aya ho)');
    console.log('Preserved default user: aqsa@ibadah.com — password wahi purana hai (default: 123456)');
    console.log('====================================================\n');
    console.log(`Done: ${ok}/${SPONSORS.length} sponsors ban gaye. Ab app me login test karo (frontend refresh: Ctrl+F5).`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (e) {
    console.error('Seed failed:', e.message);
    process.exit(1);
  }
})();