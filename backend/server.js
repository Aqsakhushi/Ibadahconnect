// ⚡ FIX: .env ko SAB SE PEHLE load karo — routes require hone se PEHLE.
// Pehle dotenv.config() neeche call ho raha tha (routes ke baad), jiski wajah se
// utils/sendEmail.js ka transporter require-time par KHALI SMTP_USER/SMTP_PASS
// pakar leta tha — isi liye "Missing credentials for PLAIN" aa raha tha.
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

// ⚡ BOOT CHECK — restart ke foran baad terminal mein yeh 3 lines dikhni chahiye:
console.log('[BOOT] SMTP_USER :', process.env.SMTP_USER ? 'LOADED ✅ ' + process.env.SMTP_USER : 'MISSING ❌ (.env check karo)');
console.log('[BOOT] JWT_SECRET:', process.env.JWT_SECRET ? 'LOADED ✅' : 'MISSING ❌ (.env line 2 mein daalo)');
console.log('[BOOT] EMAIL_FROM:', process.env.EMAIL_FROM || '(not set — default use hoga)');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Models Import
const User = require('./models/User');
const Package = require('./models/Package');

// Routes Import
const authRoute = require('./routes/auth');
const ordersRoute = require('./routes/orders');
const packagesRoute = require('./routes/packages');
const paymentRoute = require('./routes/payments');
const paymentAdminRoute = require('./routes/payment-admin');
const rulesRoute = require('./routes/rules');
const ocrRoute = require('./routes/ocr');
const uploadRoute = require('./routes/upload');
const performerOrdersRoute = require('./routes/performerOrders');
const trackRoute = require('./routes/track');
const chatRoute = require('./routes/chat'); // NEW: sponsor <-> performer chat

// Legacy payment route (optional — agar purani payment.js hai to chalegi, warna skip)
let legacyPaymentRoute = null;
try { legacyPaymentRoute = require('./routes/payment'); } catch (e) { legacyPaymentRoute = null; }

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '15mb' }));
// API Routes
app.use('/api/auth', authRoute);
app.use('/api/orders/performer', performerOrdersRoute); // MUST stay BEFORE /api/orders
app.use('/api/orders', ordersRoute);
app.use('/api/devfix', require('./routes/devfix'));
app.use('/api/packages', packagesRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/payments-admin', paymentAdminRoute);
if (legacyPaymentRoute) app.use('/api/payment', legacyPaymentRoute); // old route (optional)
app.use('/api/rules', rulesRoute);
app.use('/api/proof', ocrRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/track', trackRoute);
app.use('/api/chat', chatRoute); // NEW

// Serve uploaded files (profile pics + proof photos + bank receipts)
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

// MongoDB Connection + Seeders (SINGLE chain - do not split)
mongoose
  .connect(process.env.MONGO_URI, {
    family: 4,
    serverSelectionTimeoutMS: 30000,
  })
  .then(async () => {
    console.log('MongoDB Connected');

    // 1. Default User
    const existingUser = await User.findOne({ email: 'aqsa@ibadah.com' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await User.create({
        firstName: 'First Name',
        lastName: 'Last Name',
        country: 'Pakistan',
        phone: '03001234567',
        email: 'Someone@ibadah.com',
        password: hashedPassword,
        role: 'Sponsor',
      });
      console.log('Default user created: aqsa@ibadah.com');
    }

    // 2. Default Packages Seeder — 10 Umrah + 10 Hajj + 28 Donations (Force Sync)
    // NOTE: Images sirf woh files use karti hain jo public/images mein EXIST karti hain,
    // baaki services ke liye Kaaba fallback pic (DONATION_IMG) — koi broken image nahi.
    console.log('Syncing 48 default packages (10 Umrah + 10 Hajj + 28 Donations)...');
    const DONATION_IMG = 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=800&auto=format&fit=crop';
    const DEFAULT_PACKAGES = [
      // ---------- UMRAH BADAL (10) ----------
      { title: 'Economy Umrah Badal', price: 50000, desc: 'Complete Umrah performed on behalf of your loved one by a verified student of Makkah — Ehram, Tawaf, Sai and Halq done step by step, with photo proof of every milestone shared with you.', category: 'Umrah Badal', image: '/images/umrah1.jpg' },
      { title: 'Business Umrah Badal', price: 80000, desc: 'Umrah Badal with full video documentation — your performer records Tawaf, Sai and the final dua, and you receive the complete recording with photos as permanent proof.', category: 'Umrah Badal', image: '/images/umrah2.jpg' },
      { title: 'Premium Umrah Badal', price: 100000, desc: 'Priority Umrah Badal with a dedicated scholar, live video call access during the rituals, and premium support from our team until your completion certificate is delivered.', category: 'Umrah Badal', image: '/images/umrah3.jpg' },
      { title: 'Executive Umrah Badal', price: 120000, desc: 'Executive Umrah Badal with regular progress updates — milestone notifications at Ehram, Tawaf, Sai and Dua, performed inside Masjid al-Haram by a verified performer.', category: 'Umrah Badal', image: '/images/umrah1.jpg' },
      { title: 'Gold Umrah Badal', price: 150000, desc: 'Gold Umrah Badal combining photo and video documentation with a scholar performer, live tracking of every ritual, and an official IbadahConnect completion certificate.', category: 'Umrah Badal', image: '/images/umrah2.jpg' },
      { title: 'Platinum Umrah Badal', price: 180000, desc: 'Platinum Umrah Badal with a dedicated verified performer assigned only to your booking — full HD video proof, live milestone tracking and VIP support throughout the journey.', category: 'Umrah Badal', image: '/images/umrah3.jpg' },
      { title: 'Elite Umrah Badal', price: 200000, desc: 'Elite Umrah Badal performed by a certified scholar of an Islamic university in Makkah, with complete Shariah compliance, live video access and signed documentation of every rite.', category: 'Umrah Badal', image: '/images/umrah1.jpg' },
      { title: 'Royal Umrah Badal', price: 230000, desc: 'Royal Umrah Badal offering a premium experience — performed on your behalf with daily updates, professional photo and video coverage, and a personal case manager until completion.', category: 'Umrah Badal', image: '/images/umrah2.jpg' },
      { title: 'Signature Umrah Badal', price: 260000, desc: 'Our signature Umrah Badal with complete documentation — every ritual recorded, verified and compiled into an official report with video, photos and a signed completion certificate.', category: 'Umrah Badal', image: '/images/umrah3.jpg' },
      { title: 'VIP Umrah Badal', price: 300000, desc: 'The highest tier of Umrah Badal — VIP priority scheduling, the most senior verified scholar, complete live video coverage of all rites and instant certificate issuance upon completion.', category: 'Umrah Badal', image: '/images/umrah1.jpg' },

      // ---------- HAJJ BADAL (10) ----------
      { title: 'Economy Hajj Badal', price: 300000, desc: 'Essential Hajj Badal performed on behalf of your loved one by a verified performer — Ihram, Tawaf, Sai, Arafat, Muzdalifah, Mina and Rami completed with photo proof of every stage.', category: 'Hajj Badal', image: '/images/hajj1.jpg' },
      { title: 'Business Hajj Badal', price: 450000, desc: 'Hajj Badal with enhanced video documentation — watch the key rites of Hajj being performed on your behalf and receive the complete recording with photos as permanent proof.', category: 'Hajj Badal', image: '/images/hajj2.jpg' },
      { title: 'Premium Hajj Badal', price: 550000, desc: 'Priority Hajj Badal with premium support — a dedicated performer completes the full Hajj on behalf of your loved one with live milestone updates and official certification.', category: 'Hajj Badal', image: '/images/hajj3.jpg' },
      { title: 'Executive Hajj Badal', price: 650000, desc: 'Executive Hajj Badal with milestone updates at every stage of the journey — from Ihram to the farewell Tawaf — performed inside the holy sites by a verified performer.', category: 'Hajj Badal', image: '/images/hajj1.jpg' },
      { title: 'Gold Hajj Badal', price: 750000, desc: 'Gold Hajj Badal with full photo and video documentation of all Hajj rites, performed by a verified scholar with live tracking and an official IbadahConnect certificate.', category: 'Hajj Badal', image: '/images/hajj2.jpg' },
      { title: 'Platinum Hajj Badal', price: 900000, desc: 'Platinum Hajj Badal with a dedicated performer for your booking alone — complete HD coverage of every rite, daily progress reports and VIP support from booking to certificate.', category: 'Hajj Badal', image: '/images/hajj3.jpg' },
      { title: 'Elite Hajj Badal', price: 1050000, desc: 'Elite Hajj Badal performed by a certified scholar with complete Shariah compliance — every rite documented live, verified and compiled into an official completion report.', category: 'Hajj Badal', image: '/images/hajj1.jpg' },
      { title: 'Royal Hajj Badal', price: 1200000, desc: 'Royal Hajj Badal with premium execution — a senior verified scholar performs the entire Hajj on your behalf with professional documentation and a personal case manager.', category: 'Hajj Badal', image: '/images/hajj2.jpg' },
      { title: 'Signature Hajj Badal', price: 1350000, desc: 'Our signature Hajj Badal with complete documentation — every ritual of Hajj recorded and verified, delivered to you with video, photos and a signed completion certificate.', category: 'Hajj Badal', image: '/images/hajj3.jpg' },
      { title: 'VIP Hajj Badal', price: 1500000, desc: 'The highest tier of Hajj Badal — VIP priority scheduling, the most senior certified scholar, complete live coverage of all rites and instant certificate issuance upon completion.', category: 'Hajj Badal', image: '/images/hajj1.jpg' },

      // ---------- DONATION IN MECCA (28) — sirf existing images use ho rahi hain ----------
      { title: 'Wheelchair Donation in Mecca', price: 15000, desc: 'Donate a wheelchair to Masjid al-Haram — help elderly and disabled pilgrims complete their Tawaf and rituals with ease, with photo confirmation of your donation.', category: 'Donation in Mecca', image: '/images/wheelchair.jpg' },
      { title: 'Quran Donation in Mecca', price: 4500, desc: 'A fresh copy of the Holy Quran distributed in the Haram on your behalf — sadaqah jariya that keeps rewarding you every time it is recited.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Donate Water in Makkah', price: 4500, desc: 'Provide chilled drinking water for pilgrims in Makkah — a simple act of sadaqah that quenches the thirst of the guests of Allah in the holiest city on earth.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Donate Iftar in Mecca', price: 4500, desc: 'Sponsor a complete Iftar meal for fasting pilgrims in Makkah — dates, water and a warm meal served near the Haram on your behalf.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Feed a Pilgrim', price: 2500, desc: 'Provide a wholesome meal to a pilgrim performing their rituals — food donated in your name near Masjid al-Haram, with photo proof of distribution.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Hajj Food Donation', price: 20000, desc: 'Sponsor food packages for pilgrims during the Hajj season — meals distributed among the guests of Allah in Mina and Arafat on your behalf.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Roza Kushai', price: 12000, desc: 'Arrange the traditional first-fast celebration (Roza Kushai) for a poor child — a complete meal and celebration arranged in your name for a deserving family.', category: 'Donation in Mecca', image: '/images/roza.jpg' },
      { title: 'Iftar for Orphans', price: 8000, desc: 'Sponsor a full Iftar for orphaned children in Makkah — nutritious meals served with dignity in your name during the blessed month.', category: 'Donation in Mecca', image: '/images/orphans.jpg' },
      { title: 'Tasbeeh Distribution', price: 3000, desc: 'Distribute sets of prayer beads (tasbeeh) to worshippers in the Haram — a small gift that aids the dhikr of hundreds, with photo proof of distribution.', category: 'Donation in Mecca', image: '/images/tasbeeh.jpg' },
      { title: 'Ab-e-Zamzam Delivery', price: 6000, desc: 'Arrange pure Zamzam water, drawn and packaged in Makkah, to be distributed on your behalf — the blessed water delivered to pilgrims and the needy.', category: 'Donation in Mecca', image: '/images/zamzam.jpg' },
      { title: 'Zamzam for Pilgrims', price: 3500, desc: 'Provide bottled Zamzam water to tired pilgrims outside the Haram — refresh the guests of Allah with the most blessed water on earth.', category: 'Donation in Mecca', image: '/images/zamzam.jpg' },
      { title: 'Kafan & Burial Fund', price: 15000, desc: 'Contribute to the kafan and burial fund of Makkah — help shroud and bury with dignity those who pass away in the holy city, on your behalf.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Prayer Mat', price: 4000, desc: 'Donate prayer mats to the courtyards of the Haram — every prostration offered on your mat becomes a source of ongoing reward for you.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Hijab & Ihram', price: 5500, desc: 'Provide Ihram garments and hijabs to pilgrims who cannot afford them — help them enter the state of Ihram with dignity on your behalf.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Shoes & Slippers', price: 2500, desc: 'Donate slippers to pilgrims walking between the Haram and their hotels — a small comfort that eases the journey of the guests of Allah.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Orphan Sponsorship', price: 10000, desc: 'Sponsor the monthly care of an orphan in Makkah — food, education and clothing provided in your name, a deed most beloved to Allah.', category: 'Donation in Mecca', image: '/images/orphans.jpg' },
      { title: 'Widows of Makkah', price: 12000, desc: 'Support widows living in Makkah with essential ration packages — a full month of supplies delivered to deserving households in your name.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Iftar for Haram Workers', price: 7000, desc: 'Sponsor Iftar for the cleaners and workers of the Haram — honour those who serve the guests of Allah by serving them a warm meal in your name.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Wheelchair Repair', price: 8000, desc: 'Fund the repair of damaged wheelchairs in the Haram — restore mobility for disabled pilgrims and earn the reward of every Tawaf made easy.', category: 'Donation in Mecca', image: '/images/wheelchair.jpg' },
      { title: 'Ajwa Dates', price: 9000, desc: 'Distribute premium Ajwa dates of Madinah among pilgrims and the poor of Makkah — the sunnah food shared in your name.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Qurans for Madrasa', price: 13000, desc: 'Provide complete Quran sets to a madrasa in Makkah — equip young students with the Book of Allah and earn sadaqah jariya with every verse they learn.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Winter Blankets', price: 6500, desc: 'Donate warm blankets to the poor of Makkah during cold desert nights — warmth provided to the needy of the holy city on your behalf.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Medical Aid', price: 18000, desc: 'Contribute to medical aid for poor pilgrims — treatment and medicines arranged for those who fall ill during their sacred journey.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Umrah for a Poor Pilgrim', price: 25000, desc: 'Sponsor a complete Umrah for a poor Muslim who could never afford it — the journey of a lifetime arranged in your name, with photo proof.', category: 'Donation in Mecca', image: '/images/umrah1.jpg' },
      { title: 'Water Coolers', price: 22000, desc: 'Install a water cooler near the Haram — chilled water served to thousands of pilgrims, a standing sadaqah that rewards you with every sip.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Sadaqah Jariya Bundle', price: 15000, desc: 'A complete sadaqah jariya bundle — Quran copies, prayer mats and water distribution combined, building a stream of ongoing reward for you or your loved one.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Eid Gift Bundle', price: 11000, desc: 'Send Eid gifts to orphans and poor children of Makkah — clothes, sweets and toys distributed on your behalf on the day of Eid.', category: 'Donation in Mecca', image: DONATION_IMG },
      { title: 'Baraka Starter Bundle', price: 8500, desc: 'A baraka starter bundle for a needy family — ration, kitchen essentials and bedding to help them begin a new chapter with dignity.', category: 'Donation in Mecca', image: DONATION_IMG },
    ];
    for (const pkg of DEFAULT_PACKAGES) {
      await Package.findOneAndUpdate(
        { title: pkg.title },
        { $set: { price: pkg.price, desc: pkg.desc, category: pkg.category, image: pkg.image } },
        { upsert: true }
      );
    }
    console.log('48 Default Packages synced successfully!');
  })
  .catch((err) => console.log('MongoDB Error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT} !`);
});