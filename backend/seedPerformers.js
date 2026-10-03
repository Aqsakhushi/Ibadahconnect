/**
 * seedPerformers.js — ONE-TIME DB utility
 * Kya karta hai:
 *   1) Purane SAB performers delete (role: 'Performer')
 *   2) Orders ki purani performer assignment clear (Ali Khan wali)
 *   3) 10 naye performers create (bcrypt hashed password — login ready)
 *
 * Run (backend folder se):  node seedPerformers.js
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

const PASSWORD = 'Performer@123';

const PERFORMERS = [
  { firstName: 'Ahmad',    lastName: 'Raza',       email: 'ahmad.raza@gmail.com',      phone: '+92 300 1234501', city: 'Lahore',     idNumber: '35201-1234501-1' },
  { firstName: 'Bilal',    lastName: 'Ahmed',      email: 'bilal.ahmed@gmail.com',     phone: '+92 300 1234502', city: 'Karachi',    idNumber: '42101-1234502-2' },
  { firstName: 'Usman',    lastName: 'Khan',       email: 'usman.khan@gmail.com',      phone: '+92 300 1234503', city: 'Islamabad',  idNumber: '61101-1234503-3' },
  { firstName: 'Hamza',    lastName: 'Tariq',      email: 'hamza.tariq@gmail.com',     phone: '+92 300 1234504', city: 'Multan',     idNumber: '36302-1234504-4' },
  { firstName: 'Zain',     lastName: 'Ul Abideen', email: 'zain.abideen@gmail.com',    phone: '+92 300 1234505', city: 'Faisalabad', idNumber: '33100-1234505-5' },
  { firstName: 'Faizan',   lastName: 'Aslam',      email: 'faizan.aslam@gmail.com',    phone: '+92 300 1234506', city: 'Rawalpindi', idNumber: '37405-1234506-6' },
  { firstName: 'Omar',     lastName: 'Farooq',     email: 'omar.farooq@gmail.com',     phone: '+92 300 1234507', city: 'Peshawar',    idNumber: '17301-1234507-7' },
  { firstName: 'Hassan',   lastName: 'Mujtaba',    email: 'hassan.mujtaba@gmail.com',  phone: '+92 300 1234508', city: 'Sialkot',     idNumber: '34603-1234508-8' },
  { firstName: 'Abdullah', lastName: 'Yousaf',     email: 'abdullah.yousaf@gmail.com', phone: '+92 300 1234509', city: 'Gujranwala',  idNumber: '34101-1234509-9' },
  { firstName: 'Ibrahim',  lastName: 'Noor',       email: 'ibrahim.noor@gmail.com',    phone: '+92 300 1234510', city: 'Quetta',      idNumber: '54401-1234510-0' },
];

const buildDoc = (p, hash) => ({
  firstName: p.firstName,
  lastName: p.lastName,
  country: 'Pakistan',
  phone: p.phone,
  email: p.email,
  password: hash,
  role: 'Performer',
  isVerified: true,            // Admin-approved performer — login/testing block na ho
  isEmailVerified: true,       // Email verification bypass — testing ke liye
  performerType: 'Ibadah Team',
  city: p.city,
  experience: '5+ years performing Umrah rituals in Makkah',
  languages: 'Urdu, English, Arabic',
  bio: `Experienced performer based in ${p.city}, dedicated to completing Umrah/Hajj Badal with full care and authenticity.`,
  idNumber: p.idNumber,
  cnicNumber: p.idNumber,
  cnicStatus: 'Unverified',    // Clean slate — CNIC upload + admin verify flow test kar sakti ho
  hasIdDoc: false,
  hasProfilePhoto: false,
  agencyConnect: 'None',
});

(async () => {
  try {
    console.log('MongoDB connect ho raha hai...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected:', MONGO_URI);

    // 1) Purane sab performers DELETE
    const del = await User.deleteMany({ role: 'Performer' });
    console.log(`Purane performers delete: ${del.deletedCount}`);

    // 2) Orders ki purani performer assignment CLEAR (Ali Khan isi liye dikha raha tha)
    //    Raw collection use kar rahe hain — jo field exist nahi karti woh safely skip ho jati hai
    try {
      const ordersCol = mongoose.connection.collection('orders');
      const r = await ordersCol.updateMany({}, { $unset: { performerId: '', performer: '', performerName: '', performerEmail: '' } });
      console.log(`Orders ki purani assignment clear: ${r.modifiedCount} orders`);
    } catch (e) {
      console.log('Orders cleanup skip:', e.message);
    }

    // 3) 10 naye performers CREATE
    const hash = await bcrypt.hash(PASSWORD, 10);
    let ok = 0;
    for (const p of PERFORMERS) {
      try {
        await User.create(buildDoc(p, hash));
        ok++;
        console.log(`Created: ${p.firstName} ${p.lastName} — ${p.email}`);
      } catch (e) {
        console.log(`FAILED: ${p.email} — ${e.message}`);
      }
    }

    // 4) Credentials summary
    console.log('\n================ LOGIN CREDENTIALS ================');
    console.log('Password (sab performers ka same): Performer@123\n');
    PERFORMERS.forEach((p, i) => {
      console.log(`${i + 1}. ${p.email}  —  ${p.firstName} ${p.lastName} (${p.city})`);
    });
    console.log('====================================================\n');
    console.log(`Done: ${ok}/10 performers ban gaye. Ab admin panel pe Ctrl+F5 karo.`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (e) {
    console.error('Seed failed:', e.message);
    process.exit(1);
  }
})();