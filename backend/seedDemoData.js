// ============================================================
// seedDemoData.js — ONE-TIME DB utility (IbadahConnect)
// ------------------------------------------------------------
// 1) 3 demo users ensure karta hai — 1 Admin, 1 Sponsor, 1 Performer
//    (purane users delete NAHI hote — sirf in 3 emails pe upsert)
// 2) 3 demo requests banata hai taake har category k pass requests aayen:
//      #1  Pending   → Performer k "available" list mein aayegi
//      #2  Accepted  → Performer assigned — Sponsor ko status dikhegi
//      #3  Completed → Admin k pass verify karne k liye aayegi
// Run: backend folder se →  node seedDemoData.js
// ============================================================

try { require('dotenv').config(); } catch (e) { /* dotenv na ho to bhi chale */ }

const mongoose = require('mongoose');
let bcrypt;
try { bcrypt = require('bcryptjs'); } catch (e) { bcrypt = require('bcrypt'); }
const User = require('./models/User');

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI ||
  process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/ibadahconnect';

// ---------- Demo accounts (har category ka 1) ----------
const ADMIN = {
  firstName: 'Main', lastName: 'Admin', email: 'admin@ibadahconnect.com',
  phone: '+92 300 0000001', city: 'Islamabad', password: 'Admin@123', role: 'Admin',
};
const SPONSOR = {
  firstName: 'Demo', lastName: 'Sponsor', email: 'sponsor@ibadahconnect.com',
  phone: '+92 300 0000002', city: 'Lahore', password: 'Sponsor@123', role: 'Sponsor',
};
const PERFORMER = {
  firstName: 'Demo', lastName: 'Performer', email: 'performer@ibadahconnect.com',
  phone: '+92 300 0000003', city: 'Karachi', password: 'Performer@123', role: 'Performer',
};

(async () => {
  try {
    console.log('Connecting to:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    // ---------- STEP 1: users upsert (delete nahi — baqi data safe) ----------
    const upsertUser = async (u, hash) => {
      const doc = await User.findOneAndUpdate(
        { email: u.email },
        {
          $set: {
            firstName: u.firstName, lastName: u.lastName, email: u.email,
            password: hash, role: u.role, phone: u.phone, city: u.city,
            country: 'Pakistan',
            isVerified: true,       // Admin approved — login block na ho
            isEmailVerified: true,  // email verification bypass
          },
        },
        { upsert: true, new: true }
      );
      console.log(`[OK] ${u.role.padEnd(9)} -> ${u.email}`);
      return doc;
    };

    const admin     = await upsertUser(ADMIN,     await bcrypt.hash(ADMIN.password, 10));
    const sponsor   = await upsertUser(SPONSOR,   await bcrypt.hash(SPONSOR.password, 10));
    const performer = await upsertUser(PERFORMER, await bcrypt.hash(PERFORMER.password, 10));

    // ---------- STEP 2: demo requests (raw orders collection) ----------
    const ordersCol = mongoose.connection.collection('orders');

    // Sirf demo requests clear — baqi orders safe
    const del = await ordersCol.deleteMany({ sponsorEmail: SPONSOR.email });
    console.log(`Old demo requests deleted: ${del.deletedCount}`);

    const now = new Date();
    const base = {
      sponsorId: sponsor._id,
      sponsorName: `${sponsor.firstName} ${sponsor.lastName}`,
      sponsorEmail: sponsor.email,
    };
    const perf = {
      performerId: performer._id,
      performerName: `${performer.firstName} ${performer.lastName}`,
      performerEmail: performer.email,
    };

    await ordersCol.insertMany([
      {
        ...base, // #1 — PENDING: Performer k pass "available" mein aayegi
        ibadahType: 'Umrah Badal',
        personName: 'Marhoom Muhammad Yousaf', personRelation: 'Walid',
        city: 'Lahore', price: 25000,
        notes: 'Umrah badal — meethi dua zaroor karna',
        status: 'Pending',
        createdAt: now, updatedAt: now,
      },
      {
        ...base, ...perf, // #2 — ACCEPTED: Sponsor ko status dikhegi, Performer k pass assigned
        ibadahType: 'Umrah Badal',
        personName: 'Marhooma Fatima Bibi', personRelation: 'Dadi',
        city: 'Lahore', price: 30000,
        notes: 'Sponsor k naam se Umrah',
        status: 'Accepted', acceptedAt: now,
        createdAt: now, updatedAt: now,
      },
      {
        ...base, ...perf, // #3 — COMPLETED: Admin k pass verify karne k liye
        ibadahType: 'Hajj Badal',
        personName: 'Marhoom Abdul Rehman', personRelation: 'Chacha',
        city: 'Karachi', price: 45000,
        notes: 'Hajj badal — complete, verification pending',
        status: 'Completed', acceptedAt: now, completedAt: now,
        createdAt: now, updatedAt: now,
      },
    ]);
    console.log('3 demo requests created (1 Pending, 1 Accepted, 1 Completed)');

    // ---------- LOGIN CREDENTIALS ----------
    console.log('\n================ LOGIN CREDENTIALS ================');
    console.log(`Admin     -> ${ADMIN.email} / ${ADMIN.password}`);
    console.log(`Sponsor   -> ${SPONSOR.email} / ${SPONSOR.password}`);
    console.log(`Performer -> ${PERFORMER.email} / ${PERFORMER.password}`);
    console.log('====================================================');

    await mongoose.connection.close();
    console.log('\nDone — DB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('SEED FAILED:', err.message);
    process.exit(1);
  }
})();