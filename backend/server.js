// ============================================================
// IbadahConnect — backend/server.js (FINAL v2.2)
// WHAT'S NEW:
//  A. DONATION SUB-CATEGORIES (Netflix rows — Ma'am ki demand):
//     har donation me subCategory attach — API-driven rows.
//  B. QUEUE LIFECYCLE (aaj ke 6 features ka aakhri piece):
//     - /api/queue routes mount (File 3)
//     - Order hooks -> OrderTimeline auto-events (Feature #1)
//     - Cancel -> queue shift earlier + sponsor mail (Feature #4)
//     - Auto-monitor har 6 ghante: late SLA mail + queue push
//       (Feature #2) + stuck nudge/escalation (Feature #3).
//       NOTE: active Umrah kabhi auto-reassign NAHI hota (fiqh:
//       ihram continuity) — sirf nudge + admin escalation.
// REQUIRES (defensive — koi file missing ho to server phir bhi
// chalega, bas wo feature skip hoga):
//   File 1: models/OrderTimeline.js
//   File 2: services/queueEngine.js
//   File 3: routes/queue.js
// KEPT FROM v2.1: Atlas-only options, single MONGO_URI rule,
//   boot repair of milestones.step, packages cache.
// ============================================================

// load .env FIRST — before any route/model require.
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

// BOOT CHECK — these lines must show LOADED right after restart
console.log('[BOOT] SMTP_USER :', process.env.SMTP_USER ? 'LOADED ✅ ' + process.env.SMTP_USER : 'MISSING ❌ (.env check karo)');
console.log('[BOOT] JWT_SECRET:', process.env.JWT_SECRET ? 'LOADED ✅' : 'MISSING ❌ (.env line 2 mein daalo)');
console.log('[BOOT] EMAIL_FROM:', process.env.EMAIL_FROM || '(not set — default use hoga)');
console.log('[BOOT] MONGO_URI :', process.env.MONGO_URI ? 'LOADED ✅ (host hidden)' : 'MISSING ❌ (.env check karo)');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Models Import
const User = require('./models/User');
const Package = require('./models/Package');
const Order = require('./models/Order');

// Queue lifecycle deps (Files 1-2 — defensive: missing to skip)
let OrderTimeline = null;
let queueEngine = null;
try { OrderTimeline = require('./models/OrderTimeline'); } catch (e) { console.log('[BOOT] OrderTimeline missing — File 1 (models/OrderTimeline.js) save karo'); }
try { queueEngine = require('./services/queueEngine'); } catch (e) { console.log('[BOOT] queueEngine missing — File 2 (services/queueEngine.js) save karo'); }
const EVENTS = OrderTimeline ? OrderTimeline.EVENTS : null;

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
const chatRoute = require('./routes/chat'); // sponsor <-> performer chat

// Queue + Timeline routes (File 3 — defensive)
let queueRoute = null;
try { queueRoute = require('./routes/queue'); } catch (e) { console.log('[BOOT] /api/queue skipped — routes/queue.js (File 3) missing'); }

// Legacy payment route (optional)
let legacyPaymentRoute = null;
try { legacyPaymentRoute = require('./routes/payment'); } catch (e) { legacyPaymentRoute = null; }

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '15mb' }));
// PACKAGES CACHE — Atlas latency fix (v2.1 se unchanged).
let packagesCache = null;
app.use('/api/packages', (req, res, next) => {
  if (req.method !== 'GET') { packagesCache = null; return next(); } // write -> bust cache
  if ((req.path === '/all' || req.path === '/') && packagesCache) {
    return res.json(packagesCache);
  }
  if (req.path === '/all' || req.path === '/') {
    const json = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode < 400) packagesCache = data; // only cache success
      return json(data);
    };
  }
  next();
});

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
app.use('/api/chat', chatRoute);
if (queueRoute) app.use('/api/queue', queueRoute); // NEW: timeline/position/deadline endpoints

// Serve uploaded files (profile pics + proof photos + bank receipts)
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

// ============================================================
// ORDER LIFECYCLE (NEW in v2.2)
// Order.js LOCKED hai — hooks EXTERNAL file se register hote
// hain (mongoose model singleton). Ye section:
//   1. har status change / milestone completion par timeline
//      event likhta hai (Feature #1)
//   2. Cancel par queue shift + mails (Feature #4)
//   3. monitor loop: late + stuck orders (Features #2, #3)
// ============================================================
const SPONSOR_FIELDS = ['sponsor', 'sponsorId', 'user', 'userId', 'createdBy', 'customer', 'owner'];

// --- defensive mailer (utils/sendEmail ka shape jo bhi ho) ---
let _mailer = null;
try {
  const m = require('./utils/sendEmail');
  _mailer = typeof m === 'function' ? m : (m.sendEmail || m.default || null);
} catch (e) { _mailer = null; }

async function sendMailSafe(to, subject, html) {
  if (!to) return;
  if (typeof _mailer !== 'function') { console.log('[MAIL] mailer unavailable — skipped:', subject); return; }
  const attempts = [
    () => _mailer({ to, subject, html }),
    () => _mailer({ email: to, subject, message: html }),
    () => _mailer(to, subject, html),
  ];
  for (const attempt of attempts) {
    try { await attempt(); return; } catch (e) { /* next shape */ }
  }
  console.log('[MAIL] failed (all shapes):', subject, '->', to);
}

function sponsorIdOf(order) {
  for (const f of SPONSOR_FIELDS) {
    if (order[f]) return order[f]._id || order[f];
  }
  return null;
}
async function userEmail(id) {
  try {
    const u = await User.findById(id).select('email');
    return u ? u.email : null;
  } catch (e) { return null; }
}

// --- milestone "done" tolerant check ---
function milestoneDone(m) {
  if (!m) return false;
  const st = String(m.status || '').toLowerCase();
  if (['completed', 'complete', 'done', 'verified', 'approved', 'finished'].includes(st)) return true;
  if (m.completed === true || m.done === true || m.verified === true) return true;
  if (m.completedAt || m.completedDate || m.verifiedAt) return true;
  return false;
}

// purane vs naye milestones ka diff — naye complete hue log karo
async function diffMilestones(order, prev) {
  try {
    if (!prev || !Array.isArray(prev.milestones) || !Array.isArray(order.milestones)) return;
    const n = Math.min(prev.milestones.length, order.milestones.length);
    for (let i = 0; i < n; i++) {
      if (!milestoneDone(prev.milestones[i]) && milestoneDone(order.milestones[i])) {
        const t = order.milestones[i].title ? `: ${order.milestones[i].title}` : '';
        await OrderTimeline.log({
          orderId: order._id,
          event: EVENTS.MILESTONE_COMPLETED,
          title: `Milestone ${i + 1} completed${t}`,
          milestoneStep: i + 1,
        });
      }
    }
  } catch (e) { console.log('[LIFECYCLE] milestone diff failed:', e.message); }
}

// status transition handler — timeline + side-effects
async function handleTransition(order, prev) {
  try {
    const FIELDS = queueEngine.FIELDS;
    if (!FIELDS.status) { await diffMilestones(order, prev); return; }
    const cur = String(order[FIELDS.status] || '').toLowerCase().trim();
    const before = prev ? String(prev.status || '').toLowerCase().trim() : null;
    if (before === cur) { await diffMilestones(order, prev); return; }

    const S = queueEngine.STATUS_SETS;

    if (S.cancelled.includes(cur) && !(before && S.cancelled.includes(before))) {
      // FEATURE #4: cancel -> queue shift earlier + notifications
      await OrderTimeline.log({
        orderId: order._id,
        event: EVENTS.ORDER_CANCELLED,
        title: 'Order cancelled',
        description: 'Remaining scheduled orders moved earlier automatically.',
        meta: { from: before, to: cur },
      });
      try {
        const res = await queueEngine.shiftQueueAfterCancellation(order._id);
        if (res.shifted && res.shifted.length) {
          console.log(`[LIFECYCLE] queue shifted earlier for ${res.shifted.length} order(s) after cancel`);
        }
      } catch (e) { console.log('[LIFECYCLE] queue shift failed:', e.message); }
      const se = await userEmail(sponsorIdOf(order));
      await sendMailSafe(se, 'IbadahConnect: Order cancelled',
        `<p>Your order <b>${order._id}</b> has been cancelled.</p><p>Any scheduled orders in the performer queue were moved earlier automatically.</p>`);
    } else if (S.completed.includes(cur) && !(before && S.completed.includes(before))) {
      await OrderTimeline.log({
        orderId: order._id,
        event: EVENTS.ORDER_COMPLETED,
        title: 'Order completed',
        description: 'All milestones done. Completion certificate available.',
        meta: { from: before, to: cur },
      });
      const se = await userEmail(sponsorIdOf(order));
      await sendMailSafe(se, 'IbadahConnect: Order completed',
        `<p>Good news! Your order <b>${order._id}</b> is complete. Your completion certificate and full proof set are ready in your dashboard.</p>`);
    } else if (S.active.includes(cur) && !(before && S.active.includes(before))) {
      await OrderTimeline.log({
        orderId: order._id,
        event: EVENTS.ORDER_STARTED,
        title: 'Order started',
        description: 'Performer has begun the rituals/execution.',
        meta: { from: before, to: cur },
      });
    } else if (S.scheduled.includes(cur) && !(before && S.scheduled.includes(before))) {
      await OrderTimeline.log({
        orderId: order._id,
        event: EVENTS.ORDER_SCHEDULED,
        title: 'Order scheduled',
        description: 'A date has been set for this order.',
        meta: { from: before, to: cur },
      });
    }
    await diffMilestones(order, prev);
  } catch (e) { console.log('[LIFECYCLE] transition handler failed:', e.message); }
}

// hooks install — Order.js ko chhere baghair, external se
function installOrderLifecycleHooks() {
  if (!queueEngine || !OrderTimeline || !EVENTS) return;
  const FIELDS = queueEngine.FIELDS;
  const sel = FIELDS.status ? `milestones ${FIELDS.status}` : 'milestones';

  async function snapshot(query) {
    try { return await Order.findOne(query).select(sel).lean(); } catch (e) { return null; }
  }
  function stash(ctx, snap) {
    ctx.$__qPrev = snap
      ? { status: FIELDS.status ? snap[FIELDS.status] : null, milestones: snap.milestones || [] }
      : null;
  }
  function copyMilestones(list) {
    return (list || []).map((m) => (m && m.toObject ? m.toObject() : { ...(m || {}) }));
  }

  // ---- save() path ----
  Order.schema.post('init', function (doc) {
    try {
      doc.$__qSnap = {
        status: FIELDS.status ? doc[FIELDS.status] : null,
        milestones: copyMilestones(doc.milestones),
      };
    } catch (e) { /* ignore */ }
  });
  Order.schema.pre('save', function (next) {
    this.$__qWasNew = this.isNew;
    if (!this.$__qSnap) {
      this.$__qSnap = {
        status: FIELDS.status ? this[FIELDS.status] : null,
        milestones: copyMilestones(this.milestones),
      };
    }
    next();
  });
  Order.schema.post('save', function (doc) {
    (async () => {
      try {
        const prev = doc.$__qWasNew ? { status: null, milestones: [] } : (doc.$__qSnap || null);
        if (doc.$__qWasNew) {
          await OrderTimeline.log({ orderId: doc._id, event: EVENTS.ORDER_CREATED, title: 'Order placed', actorRole: 'sponsor' });
        }
        await handleTransition(doc.toObject ? doc.toObject() : doc, prev);
      } catch (e) { console.log('[LIFECYCLE] save hook failed:', e.message); }
    })();
  });

  // ---- findOneAndUpdate / updateOne path (zyada tar routes yahi use karte hain) ----
  async function preUpdate() {
    stash(this, await snapshot(this.getQuery()));
  }
  function postUpdate() {
    const prev = this.$__qPrev;
    const filter = this.getQuery();
    (async () => {
      try {
        const fresh = await Order.findOne(filter).lean();
        if (fresh) await handleTransition(fresh, prev);
      } catch (e) { console.log('[LIFECYCLE] update hook failed:', e.message); }
    })();
  }
  Order.schema.pre('findOneAndUpdate', preUpdate);
  Order.schema.post('findOneAndUpdate', postUpdate);
  Order.schema.pre('updateOne', preUpdate);
  Order.schema.post('updateOne', postUpdate);

  console.log('[LIFECYCLE] order hooks installed (timeline + cancel-shift active)');
}

// purane orders me Order Created event (timeline khali na lage)
async function backfillTimelines() {
  try {
    const withEvents = await OrderTimeline.distinct('order');
    const have = new Set(withEvents.map(String));
    const allOrders = await Order.find({}).select('_id').lean();
    let made = 0;
    for (const o of allOrders) {
      if (!have.has(String(o._id))) {
        await OrderTimeline.log({
          orderId: o._id,
          event: EVENTS.ORDER_CREATED,
          title: 'Order placed',
          description: 'Backfilled from existing order record.',
          meta: { backfilled: true },
        });
        made++;
      }
    }
    if (made > 0) console.log(`Timeline backfill: ${made} order(s) updated.`);
  } catch (e) { console.log('Timeline backfill failed:', e.message); }
}

// ---- AUTO-MONITOR (Features #2 + #3) — har 6 ghante sweep ----
async function runQueueSweep() {
  if (!queueEngine || !OrderTimeline || !EVENTS) return;
  try {
    // FEATURE #2: late active orders -> sponsor mail + queue push
    const late = await queueEngine.findLateOrders();
    for (const row of late) {
      try {
        if (row.canNotify) {
          await OrderTimeline.log({
            orderId: row.order._id,
            event: EVENTS.SLA_LATE,
            title: `Running ${row.daysLate} day(s) late`,
            description: 'Sponsor informed; performer queue re-adjusted.',
          });
          const se = await userEmail(sponsorIdOf(row.order));
          await sendMailSafe(se, 'IbadahConnect: Your order is running late',
            `<p>Order <b>${row.order._id}</b> is about <b>${row.daysLate} day(s)</b> behind schedule.</p><p>Your performer's queue has been re-adjusted automatically and we are monitoring it closely.</p>`);
        }
        await queueEngine.pushQueueForDelay(row.order._id, row.daysLate);
      } catch (e) { console.log('[QUEUE MONITOR] late-handling failed:', e.message); }
    }

    // FEATURE #3: stuck orders -> performer nudge + admin escalation
    // (kabhi auto-reassign NAHI — fiqh: ihram continuity)
    const stuck = await queueEngine.findStuckOrders();
    for (const row of stuck) {
      try {
        if (row.canEscalate) {
          await OrderTimeline.log({
            orderId: row.order._id,
            event: EVENTS.STUCK_NUDGED,
            title: `No progress for ${row.hoursStuck}h — performer nudged`,
            visibility: 'performer',
          });
          await OrderTimeline.log({
            orderId: row.order._id,
            event: EVENTS.STUCK_ESCALATED,
            title: `Stuck ${row.hoursStuck}h — escalated to admin`,
            visibility: 'admin',
          });
          const pf = queueEngine.FIELDS.performer;
          const pid = pf && row.order[pf] ? (row.order[pf]._id || row.order[pf]) : null;
          const pe = await userEmail(pid);
          await sendMailSafe(pe, 'IbadahConnect: Action needed on your active order',
            `<p>Order <b>${row.order._id}</b> has had no progress update for <b>${row.hoursStuck} hours</b>. Please upload the next milestone proof as soon as possible.</p>`);
          await sendMailSafe(process.env.ADMIN_EMAIL || 'aqsa@ibadah.com', 'IbadahConnect: Stuck order escalated',
            `<p>Order <b>${row.order._id}</b> has been stuck for ${row.hoursStuck}h. Performer has been nudged.</p><p>Note: active orders are never auto-reassigned (ihram continuity rule).</p>`);
        }
      } catch (e) { console.log('[QUEUE MONITOR] stuck-handling failed:', e.message); }
    }

    if (!late.length && !stuck.length) console.log('[QUEUE MONITOR] sweep clean — all orders on track.');
    else console.log(`[QUEUE MONITOR] sweep done — late: ${late.length}, stuck: ${stuck.length}`);
  } catch (e) {
    console.log('[QUEUE MONITOR] sweep failed:', e.message);
  }
}

function startQueueMonitor() {
  if (!queueEngine) return;
  const FIRST_SWEEP_MS = 2 * 60 * 1000;        // boot ke 2 min baad
  const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000; // har 6 ghante
  setTimeout(() => runQueueSweep(), FIRST_SWEEP_MS);
  setInterval(() => runQueueSweep(), SWEEP_INTERVAL_MS);
  console.log('[QUEUE MONITOR] started — sweep every 6h (first sweep in 2 min)');
}

if (queueEngine && OrderTimeline && EVENTS) {
  installOrderLifecycleHooks();
  startQueueMonitor();
} else {
  console.log('[LIFECYCLE] disabled — Files 1-2 missing (server phir bhi chalega).');
}

// MongoDB Connection + Seeders (SINGLE chain - do not split)
mongoose
  .connect(process.env.MONGO_URI, {
    family: 4,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    // NOTE: no directConnection here — Atlas replica set needs normal topology.
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
    const UMRAH_PACKAGES = [
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
    ];
    const HAJJ_PACKAGES = [
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
    ];
    // ---------- DONATION IN MECCA (28) — EXPLICIT IMAGE PATHS ----------
    const DONATION_PACKAGES = [
      { title: 'Wheelchair Donation in Mecca', price: 15000, desc: 'Donate a wheelchair to Masjid al-Haram — help elderly and disabled pilgrims complete their Tawaf and rituals with ease, with photo confirmation of your donation.', category: 'Donation in Mecca', image: '/images/Wheelchair Donation in Mecca.jpg' },
      { title: 'Quran Donation in Mecca', price: 4500, desc: 'A fresh copy of the Holy Quran distributed in the Haram on your behalf — sadaqah jariya that keeps rewarding you every time it is recited.', category: 'Donation in Mecca', image: '/images/Quran Donation in Mecca.jpg' },
      { title: 'Donate Water in Makkah', price: 4500, desc: 'Provide chilled drinking water for pilgrims in Makkah — a simple act of sadaqah that quenches the thirst of the guests of Allah in the holiest city on earth.', category: 'Donation in Mecca', image: '/images/Donate Water in Makkah.jpg' },
      { title: 'Donate Iftar in Mecca', price: 4500, desc: 'Sponsor a complete Iftar meal for fasting pilgrims in Makkah — dates, water and a warm meal served near the Haram on your behalf.', category: 'Donation in Mecca', image: '/images/Donate Iftar in Mecca.jpg' },
      { title: 'Feed a Pilgrim', price: 2500, desc: 'Provide a wholesome meal to a pilgrim performing their rituals — food donated in your name near Masjid al-Haram, with photo proof of distribution.', category: 'Donation in Mecca', image: '/images/Feed a Pilgrim.jpg' },
      { title: 'Hajj Food Donation', price: 20000, desc: 'Sponsor food packages for pilgrims during the Hajj season — meals distributed among the guests of Allah in Mina and Arafat on your behalf.', category: 'Donation in Mecca', image: '/images/Hajj Food Donation.jpg' },
      { title: 'Roza Kushai', price: 12000, desc: 'Arrange the traditional first-fast celebration (Roza Kushai) for a poor child — a complete meal and celebration arranged in your name for a deserving family.', category: 'Donation in Mecca', image: '/images/Roza Kushai.jpg' },
      { title: 'Iftar for Orphans', price: 8000, desc: 'Sponsor a full Iftar for orphaned children in Makkah — nutritious meals served with dignity in your name during the blessed month.', category: 'Donation in Mecca', image: '/images/Iftar for Orphans.jpg' },
      { title: 'Tasbeeh Distribution', price: 3000, desc: 'Distribute sets of prayer beads (tasbeeh) to worshippers in the Haram — a small gift that aids the dhikr of hundreds, with photo proof of distribution.', category: 'Donation in Mecca', image: '/images/Tasbeeh Distribution.jpg' },
      { title: 'Ab-e-Zamzam Delivery', price: 6000, desc: 'Arrange pure Zamzam water, drawn and packaged in Makkah, to be distributed on your behalf — the blessed water delivered to pilgrims and the needy.', category: 'Donation in Mecca', image: '/images/Ab-e-Zamzam Delivery.jpg' },
      { title: 'Zamzam for Pilgrims', price: 3500, desc: 'Provide bottled Zamzam water to tired pilgrims outside the Haram — refresh the guests of Allah with the most blessed water on earth.', category: 'Donation in Mecca', image: '/images/Zamzam for Pilgrims.jpg' },
      { title: 'Kafan & Burial Fund', price: 15000, desc: 'Contribute to the kafan and burial fund of Makkah — help shroud and bury with dignity those who pass away in the holy city, on your behalf.', category: 'Donation in Mecca', image: '/images/Kafan & Burial Fund.jpg' },
      { title: 'Prayer Mat', price: 4000, desc: 'Donate prayer mats to the courtyards of the Haram — every prostration offered on your mat becomes a source of ongoing reward for you.', category: 'Donation in Mecca', image: '/images/Prayer Mat.jpg' },
      { title: 'Hijab & Ihram', price: 5500, desc: 'Provide Ihram garments and hijabs to pilgrims who cannot afford them — help them enter the state of Ihram with dignity on your behalf.', category: 'Donation in Mecca', image: '/images/Hijab & Ihram.jpg' },
      { title: 'Shoes & Slippers', price: 2500, desc: 'Donate slippers to pilgrims walking between the Haram and their hotels — a small comfort that eases the journey of the guests of Allah.', category: 'Donation in Mecca', image: '/images/Shoes & Slippers.jpg' },
      { title: 'Orphan Sponsorship', price: 10000, desc: 'Sponsor the monthly care of an orphan in Makkah — food, education and clothing provided in your name, a deed most beloved to Allah.', category: 'Donation in Mecca', image: '/images/Orphan Sponsorship.jpg' },
      { title: 'Widows of Makkah', price: 12000, desc: 'Support widows living in Makkah with essential ration packages — a full month of supplies delivered to deserving households in your name.', category: 'Donation in Mecca', image: '/images/Widows of Makkah.jpg' },
      { title: 'Iftar for Haram Workers', price: 7000, desc: 'Sponsor Iftar for the cleaners and workers of the Haram — honour those who serve the guests of Allah by serving them a warm meal in your name.', category: 'Donation in Mecca', image: '/images/Iftar for Haram Workers.jpg' },
      { title: 'Wheelchair Repair', price: 8000, desc: 'Fund the repair of damaged wheelchairs in the Haram — restore mobility for disabled pilgrims and earn the reward of every Tawaf made easy.', category: 'Donation in Mecca', image: '/images/Wheelchair Repair.jpg' },
      { title: 'Ajwa Dates', price: 9000, desc: 'Distribute premium Ajwa dates of Madinah among pilgrims and the poor of Makkah — the sunnah food shared in your name.', category: 'Donation in Mecca', image: '/images/Ajwa Dates.jpg' },
      { title: 'Qurans for Madrasa', price: 13000, desc: 'Provide complete Quran sets to a madrasa in Makkah — equip young students with the Book of Allah and earn sadaqah jariya with every verse they learn.', category: 'Donation in Mecca', image: '/images/Qurans for Madrasa.jpg' },
      { title: 'Winter Blankets', price: 6500, desc: 'Donate warm blankets to the poor of Makkah during cold desert nights — warmth provided to the needy of the holy city on your behalf.', category: 'Donation in Mecca', image: '/images/Winter Blankets.jpg' },
      { title: 'Medical Aid', price: 18000, desc: 'Contribute to medical aid for poor pilgrims — treatment and medicines arranged for those who fall ill during their sacred journey.', category: 'Donation in Mecca', image: '/images/Medical Aid.jpg' },
      { title: 'Umrah for a Poor Pilgrim', price: 25000, desc: 'Sponsor a complete Umrah for a poor Muslim who could never afford it — the journey of a lifetime arranged in your name, with photo proof.', category: 'Donation in Mecca', image: '/images/Umrah for a Poor Pilgrim.jpg' },
      { title: 'Water Coolers', price: 22000, desc: 'Install a water cooler near the Haram — chilled water served to thousands of pilgrims, a standing sadaqah that rewards you with every sip.', category: 'Donation in Mecca', image: '/images/Water Coolers.jpg' },
      { title: 'Sadaqah Jariya Bundle', price: 15000, desc: 'A complete sadaqah jariya bundle — Quran copies, prayer mats and water distribution combined, building a stream of ongoing reward for you or your loved one.', category: 'Donation in Mecca', image: '/images/Sadaqah Jariya Bundle.jpg' },
      { title: 'Eid Gift Bundle', price: 11000, desc: 'Send Eid gifts to orphans and poor children of Makkah — clothes, sweets and toys distributed on your behalf on the day of Eid.', category: 'Donation in Mecca', image: '/images/Eid Gift Bundle.jpg' },
      { title: 'Baraka Starter Bundle', price: 8500, desc: 'A baraka starter bundle for a needy family — ration, kitchen essentials and bedding to help them begin a new chapter with dignity.', category: 'Donation in Mecca', image: '/images/Baraka Starter Bundle.jpg' },
    ];

    // NEW (v2.2): DONATION SUB-CATEGORIES — Netflix rows ka data base.
    // Single source of truth: title -> subCategory map (exact 28).
    const DONATION_SUBCATEGORY = {
      'Water & Iftar': ['Donate Water in Makkah', 'Donate Iftar in Mecca', 'Iftar for Orphans', 'Iftar for Haram Workers', 'Feed a Pilgrim', 'Hajj Food Donation', 'Ab-e-Zamzam Delivery', 'Zamzam for Pilgrims', 'Water Coolers', 'Ajwa Dates'],
      'Quran & Ibadah': ['Quran Donation in Mecca', 'Qurans for Madrasa', 'Prayer Mat', 'Tasbeeh Distribution', 'Hijab & Ihram'],
      'Orphans, Widows & Families': ['Orphan Sponsorship', 'Widows of Makkah', 'Roza Kushai', 'Eid Gift Bundle', 'Baraka Starter Bundle'],
      'Care & Comfort': ['Wheelchair Donation in Mecca', 'Wheelchair Repair', 'Shoes & Slippers', 'Winter Blankets', 'Medical Aid'],
      'Sadaqah Jariya & Special': ['Sadaqah Jariya Bundle', 'Umrah for a Poor Pilgrim', 'Kafan & Burial Fund'],
    };
    for (const pkg of DONATION_PACKAGES) {
      const group = Object.keys(DONATION_SUBCATEGORY).find((k) => DONATION_SUBCATEGORY[k].includes(pkg.title));
      pkg.subCategory = group || 'Other';
    }

    const DEFAULT_PACKAGES = [...UMRAH_PACKAGES, ...HAJJ_PACKAGES, ...DONATION_PACKAGES];
    for (const pkg of DEFAULT_PACKAGES) {
      await Package.findOneAndUpdate(
        { title: pkg.title },
        { $set: {
          price: pkg.price,
          desc: pkg.desc,
          category: pkg.category,
          image: pkg.image,
          ...(pkg.subCategory ? { subCategory: pkg.subCategory } : {}), // NEW v2.2
        } },
        { upsert: true }
      );
    }
    console.log('48 Default Packages synced successfully (donation sub-categories included)!');

    // 3. DUPLICATE / STALE CLEANUP
    const validTitles = DEFAULT_PACKAGES.map((p) => p.title);
    const removed = await Package.deleteMany({ title: { $nin: validTitles } });
    if (removed.deletedCount > 0) {
      console.log(`Cleanup: ${removed.deletedCount} old/duplicate package(s) removed!`);
    } else {
      console.log('Cleanup: no old/duplicate packages found.');
    }

    // 4. ORDER REPAIR (v2.1) — string step -> number
    const badOrders = await Order.find({ 'milestones.step': { $type: 'string' } });
    if (badOrders.length > 0) {
      let fixed = 0;
      for (const ord of badOrders) {
        try {
          ord.milestones = ord.milestones.map((m, i) => {
            const obj = typeof m.toObject === 'function' ? m.toObject() : { ...m };
            if (typeof obj.step !== 'number') {
              if (obj.title == null && obj.step) obj.title = String(obj.step);
              obj.step = i + 1;
            }
            return obj;
          });
          await ord.save();
          fixed++;
        } catch (e) {
          console.log(`Order Repair: could not fix order ${ord._id} — ${e.message}`);
        }
      }
      console.log(`Order Repair: ${fixed}/${badOrders.length} corrupted order(s) fixed (string step -> number).`);
    } else {
      console.log('Order Repair: all orders healthy.');
    }

    // 5. TIMELINE BACKFILL (NEW v2.2) — purane orders me Order Created event
    if (OrderTimeline && EVENTS) {
      try {
        const withEvents = await OrderTimeline.distinct('order');
        const have = new Set(withEvents.map(String));
        const allOrders = await Order.find({}).select('_id').lean();
        let made = 0;
        for (const o of allOrders) {
          if (!have.has(String(o._id))) {
            await OrderTimeline.log({
              orderId: o._id,
              event: EVENTS.ORDER_CREATED,
              title: 'Order placed',
              description: 'Backfilled from existing order record.',
              meta: { backfilled: true },
            });
            made++;
          }
        }
        if (made > 0) console.log(`Timeline backfill: ${made} order(s) — Order Created events added.`);
      } catch (e) {
        console.log('Timeline backfill failed:', e.message);
      }
    }
  })
  .catch((err) => console.log('MongoDB Error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT} !`);
});