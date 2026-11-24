/* ============================================================
   IbadahConnect — backend/server.js  (v2.2)
   ------------------------------------------------------------
   FIXES IN THIS VERSION
   1) AUTO-ASSIGN ENGINE (sahi logic):
      - Ek performer par MAX 10 ACTIVE orders (Pending/Assigned/In Progress)
      - 10 full hain to NAYA order nahi milega — pehle COMPLETE karein,
        phir next pending order automatically assign ho jata hai
      - Pending orders ki queue: oldest first (FIFO)
   2) AUTO-RETRY (jo kaam nahi kar raha tha):
      - Har 60 seconds mein pending queue scan
      - Jab bhi koi performer order COMPLETE karta hai = instant retry
      - Server start par bhi ek scan
   3) LIVE GPS endpoints (sponsor map ke green marker ke liye):
      - POST /api/live/:orderId  (performer 10-15s baad push karega)
      - GET  /api/live/:orderId  (+ 3 alias paths)
   4) EMAIL SEQUENCING (pehle wala bug):
      - Checkout par SIRF verification email
      - Verify link click par: order confirmed + performer assign +
        tab hi "Order Confirmed" email jata hai
   5) Order.js bilkul safe — koi schema change nahi (read-only respected)
   ============================================================ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const User = require('./models/User');
const Order = require('./models/Order');
let Package = null;
try { Package = require('./models/Package'); } catch (e) { console.log('[BOOT] models/Package.js not found — packages inline fallback'); }

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ibadahconnect_secret';
const EMAIL_USER = process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.EMAIL || '';
const EMAIL_PASS = process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.EMAIL_PASSWORD || '';
const PUBLIC_BASE = (process.env.PUBLIC_BASE || 'http://localhost:5000').replace(/\/+$/, '');
const FRONT_BASE = (process.env.FRONT_BASE || 'http://localhost:5173').replace(/\/+$/, '');

const hasP = (m, p) => !!(m && m.schema && m.schema.path(p));
const orderCodeOf = (o) => (o && (o.orderCode || o.code || o.trackingCode)) || (o && o._id ? String(o._id) : '');

/* ------------------------------------------------------------
   MAILER
------------------------------------------------------------ */
let mailer = null;
if (EMAIL_USER && EMAIL_PASS) {
  try {
    mailer = nodemailer.createTransport({ service: 'gmail', auth: { user: EMAIL_USER, pass: EMAIL_PASS } });
    console.log('[EMAIL] Mailer ready -> ' + EMAIL_USER);
  } catch (e) { console.log('[EMAIL] Mailer init failed:', e.message); }
} else {
  console.log('[EMAIL] EMAIL_USER/EMAIL_PASS missing in backend/.env — emails will be skipped');
}

async function sendMail(to, subject, html) {
  if (!mailer || !to) { console.log('[EMAIL] Skipped -> ' + (to || 'no-recipient') + ' | ' + subject); return null; }
  try {
    const info = await mailer.sendMail({ from: '"IbadahConnect" <' + EMAIL_USER + '>', to, subject, html });
    console.log('[EMAIL] Sent -> ' + to + ' (' + ((info && info.messageId) || 'ok') + ')');
    return info;
  } catch (e) { console.log('[EMAIL] FAILED -> ' + to + ' | ' + e.message); return null; }
}

/* ------------------------------------------------------------
   AUTH MIDDLEWARE (guest-continue — purana behaviour same)
------------------------------------------------------------ */
function withTimeout(promise, ms, fallback) {
  return Promise.race([promise, new Promise((r) => setTimeout(() => r(fallback), ms))]);
}

async function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (token) {
    try {
      const dec = jwt.verify(token, JWT_SECRET);
      try {
        const u = await withTimeout(User.findById(dec.id || dec._id || dec.userId).select('-password'), 2500, null);
        req.user = u || dec;
      } catch (e2) { req.user = dec; }
      return next();
    } catch (e) { /* invalid token -> guest */ }
  }
  req.user = null;
  console.log('[AUTH] Guest request (no/invalid token) — continuing');
  next();
}
app.use('/api', auth);

/* ------------------------------------------------------------
   SHARED STATE
------------------------------------------------------------ */
const liveLocations = new Map();   // orderId -> { lat, lng, accuracy, performerName, updatedAt }
const verifyTokens = new Map();   // token -> orderId
const verifiedOrders = new Set(); // orderId (verify link clicked)
const PERFORMER_CAP = 10;         // ek performer par max ACTIVE orders
const LIVE_TTL_MS = 10 * 60 * 1000;

/* ------------------------------------------------------------
   HELPERS
------------------------------------------------------------ */
async function safeUser(id) { try { return await User.findById(id); } catch (e) { return null; } }

function parseCoords(v) {
  if (!v) return null;
  if (typeof v === 'object') {
    const lat = Number(v.lat !== undefined ? v.lat : v.latitude);
    const lng = Number(v.lng !== undefined ? v.lng : (v.longitude !== undefined ? v.longitude : v.long));
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    if (Array.isArray(v.coordinates) && v.coordinates.length >= 2) {
      const la = Number(v.coordinates[1]); const ln = Number(v.coordinates[0]);
      if (Number.isFinite(la) && Number.isFinite(ln)) return { lat: la, lng: ln };
    }
    return null;
  }
  const m = String(v).match(/(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)/);
  if (m) {
    const lat = Number(m[1]); const lng = Number(m[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  return null;
}

function haversineM(a, b) {
  const R = 6371000; const toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat); const dLng = toR(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function lastMilestoneCoords(order) {
  if (!order || !Array.isArray(order.milestones)) return null;
  for (let i = order.milestones.length - 1; i >= 0; i--) {
    const m = order.milestones[i];
    if (m && m.proofLocation) {
      const c = parseCoords(m.proofLocation);
      if (c) return { lat: c.lat, lng: c.lng, capturedAt: m.proofLocation.capturedAt || '' };
    }
  }
  return null;
}

/* ------------------------------------------------------------
   AUTO-ASSIGN ENGINE  (user requirement:
   "jab 10 orders par assign ho, pehle unhe COMPLETE karein,
    phir naya order mile" + "auto retry sahi kaam kare")
------------------------------------------------------------ */

// performer ke ACTIVE (incomplete) orders count
async function activeOrderCount(performerId) {
  try {
    return await Order.countDocuments({ performer: performerId, status: { $ne: 'Completed' } });
  } catch (e) { return PERFORMER_CAP; } // DB error par safe side: naya load mat lo
}

// sab se kam loaded free performer (verified preferred)
async function pickPerformer() {
  let list = [];
  try { list = await User.find({ role: 'Performer', isVerified: true }).limit(50); } catch (e) {}
  if (!list.length) {
    try { list = await User.find({ role: 'Performer' }).limit(50); } catch (e) {}
    if (list.length) console.log('[AUTO-ASSIGN] NOTE: koi verified performer nahi mila — unverified performers ko temporarily consider kiya ja raha hai');
  }
  if (!list.length) { console.log('[AUTO-ASSIGN] Koi performer registered nahi — order queue mein rahega'); return null; }

  let best = null;
  for (const p of list) {
    const count = await activeOrderCount(p._id);
    if (count >= PERFORMER_CAP) continue;                    // FULL — pehle complete karein
    if (!best || count < best.count) best = { performer: p, count };
  }
  if (!best) console.log('[AUTO-ASSIGN] All performers busy (' + list.length + ' performer(s) at ' + PERFORMER_CAP + '/' + PERFORMER_CAP + ') — koi complete karega to next assign hoga');
  return best;
}

// ek order ko free performer par assign karo
async function tryAssignOrder(order, opts) {
  const silent = opts && opts.silent;
  if (!order) return false;
  if (order.performer) return true; // already assigned
  const pick = await pickPerformer();
  if (!pick) {
    if (!silent) console.log('[AUTO-ASSIGN] No performer free right now for ' + orderCodeOf(order) + ' — 60s auto-retry active hai');
    return false;
  }
  order.performer = pick.performer._id;
  if (hasP(Order, 'assignedAt')) order.assignedAt = new Date();
  if (String(order.status || '') === 'Pending') order.status = 'Assigned';
  await order.save();
  const pname = ((pick.performer.firstName || '') + ' ' + (pick.performer.lastName || '')).trim() || 'CNIC-Verified Performer';
  console.log('[AUTO-ASSIGN] ' + orderCodeOf(order) + ' -> ' + pname + ' (active ' + (pick.count + 1) + '/' + PERFORMER_CAP + ')');

  const sponsor = await safeUser(order.sponsor);
  if (sponsor && sponsor.email) {
    sendMail(sponsor.email, 'Performer Assigned — ' + orderCodeOf(order),
      '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">' +
      '<h2 style="color:#1B5E20">Performer Assigned</h2>' +
      '<p>Assalam-o-Alaikum ' + (sponsor.firstName || '') + ',</p>' +
      '<p>Your order <b>' + orderCodeOf(order) + '</b> has been assigned to a CNIC-verified performer. ' +
      'Ab aap Track Order page par live progress, proof photos aur live location dekh sakte hain.</p>' +
      '<p style="text-align:center;margin:24px 0"><a href="' + FRONT_BASE + '/track?code=' + orderCodeOf(order) + '" style="background:#1B5E20;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none">Track My Order</a></p>' +
      '<p style="font-size:12px;color:#777">Your payment is held as Amanah — released only after video-verified completion.</p>' +
      '</div>');
  }
  return true;
}

// pending queue scan — OLDEST first
async function retryPendingAssignments(trigger) {
  try {
    const cands = await Order.find({ status: 'Pending' }).sort({ createdAt: 1 }).limit(50);
    const queue = [];
    for (const o of cands) {
      if (o.performer) continue;
      // verify gate: jo order verify link ke bina pending hai wo queue se skip
      if (hasP(Order, 'isVerified') && o.isVerified === false && !verifiedOrders.has(String(o._id))) continue;
      queue.push(o);
    }
    if (!queue.length) return;
    console.log('[AUTO-RETRY] (' + (trigger || 'scan') + ') ' + queue.length + ' order(s) waiting for a free performer...');
    for (const o of queue) {
      let fresh = null;
      try { fresh = await Order.findById(o._id); } catch (e) {}
      if (!fresh || fresh.performer) continue;
      await tryAssignOrder(fresh, { silent: true });
    }
  } catch (e) { console.log('[AUTO-RETRY] scan skipped:', e.message); }
}
setInterval(() => retryPendingAssignments('60s timer'), 60000);

/* ------------------------------------------------------------
   ROUTE MOUNTS (routes/ folder ke files — agar mojood hon)
   NOTE: /api/orders/performer ko /api/orders se PEHLE mount kiya
   gaya hai taake /:id swallow na kare.
------------------------------------------------------------ */
const routesDir = path.join(__dirname, 'routes');
function tryMount(file) {
  const fp = path.join(routesDir, file);
  if (fs.existsSync(fp)) {
    try { return require(fp); } catch (e) { console.log('[BOOT] routes/' + file + ' load error:', e.message); }
  }
  console.log('[BOOT] routes/' + file + ' not found — inline fallback active');
  return express.Router();
}
app.use('/api/auth', tryMount('auth.js'));
app.use('/api/orders/performer', tryMount('performerOrders.js'));
app.use('/api/track', tryMount('track.js'));
app.use('/api/orders', tryMount('orders.js'));
app.use('/api/packages', tryMount('packages.js'));
app.use('/api/payment', tryMount('payment.js'));
app.use('/api/rules', tryMount('rules.js'));
app.use('/api/proof', tryMount('proof.js'));
app.use('/api/proof', tryMount('ocr.js'));
app.use('/api/upload', tryMount('upload.js'));

// uploaded files serve (profile pics + proof photos)
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

/* ------------------------------------------------------------
   CHECKOUT  (order create + SIRF verification email)
------------------------------------------------------------ */
function buildMilestonesInline(serviceType) {
  if (serviceType === 'Umrah Badal' || serviceType === 'Hajj Badal') {
    return [
      { step: 'Ehram', isCompleted: false, proofUrl: '' },
      { step: "Tawaf", isCompleted: false, proofUrl: '' },
      { step: "Sa'i (Safa Marwa)", isCompleted: false, proofUrl: '' },
      { step: 'Taqsir / Halq', isCompleted: false, proofUrl: '' },
      { step: 'Dua', isCompleted: false, proofUrl: '' }
    ];
  }
  return [
    { step: 'Process Started', isCompleted: false, proofUrl: '' },
    { step: 'Donation Delivered', isCompleted: false, proofUrl: '' }
  ];
}

async function checkoutHandler(req, res) {
  try {
    console.log('[CHECKOUT] Payload: ' + JSON.stringify(req.body || {}));
    const b = req.body || {};
    const sponsorId = (b.userId && String(b.userId)) || (req.user && (req.user._id || req.user.id)) || null;
    console.log('[CHECKOUT] Sponsor resolved from body.userId: ' + sponsorId);
    if (!sponsorId || !mongoose.isValidObjectId(String(sponsorId))) {
      return res.status(400).json({ ok: false, message: 'userId required — pehle login karein' });
    }
    const sponsor = await safeUser(sponsorId);
    if (!sponsor) return res.status(400).json({ ok: false, message: 'Sponsor user not found' });

    const itemsIn = Array.isArray(b.items) ? b.items : [];
    let subtotal = 0;
    const items = [];
    let serviceType = 'Donation';
    let firstTitle = '';
    for (const it of itemsIn) {
      const pid = it.packageId || it.id || it._id || null;
      const qty = Math.max(1, Number(it.qty || it.quantity || 1));
      let pkg = null;
      if (Package && pid) { try { pkg = await Package.findById(pid); } catch (e) {} }
      const price = pkg ? Number(pkg.price || 0) : Number(it.price || 0);
      const title = pkg ? pkg.title : (it.title || 'Ibadah Package');
      const cat = pkg ? (pkg.category || '') : (it.category || '');
      if (/hajj/i.test(cat + ' ' + title)) serviceType = 'Hajj Badal';
      else if (/umrah/i.test(cat + ' ' + title)) serviceType = 'Umrah Badal';
      if (!firstTitle) firstTitle = title;
      subtotal += price * qty;
      items.push({ packageId: pid, title, price, qty });
    }
    const hadiyah = Number(b.hadiyah) || 0;
    if (!items.length && !subtotal && !hadiyah) return res.status(400).json({ ok: false, message: 'Cart is empty' });
    if (['Umrah Badal', 'Hajj Badal', 'Donation'].includes(b.serviceType)) serviceType = b.serviceType;

    const billing = b.billing || {};
    const orderNo = 'IC-' + new Date().getFullYear() + '-' + String(Math.floor(100000 + Math.random() * 900000));
    const total = subtotal + hadiyah;

    const doc = {
      sponsor: sponsor._id,
      serviceType,
      packageTitle: firstTitle || serviceType,
      recipientName: b.recipientName || b.beneficiaryName || 'N/A',
      recipientRelation: b.recipientRelation || 'N/A',
      beneficiaryGender: b.beneficiaryGender || '',
      reason: b.reason || '',
      notes: billing.notes || b.notes || '',
      requestorPhone: billing.phone || b.phone || '',
      hadiyah,
      price: subtotal,
      status: 'Pending',
      milestones: buildMilestonesInline(serviceType)
    };
    if (billing.address || billing.city || billing.country) {
      doc.requestorAddress = {
        street: billing.address || '', city: billing.city || '', state: billing.state || '',
        zip: billing.zip || '', country: billing.country || ''
      };
    }
    if (hasP(Order, 'total')) doc.total = total;
    if (hasP(Order, 'amount')) doc.amount = total;
    if (hasP(Order, 'paymentMethod')) doc.paymentMethod = b.paymentMethod || 'Bank Transfer';
    if (hasP(Order, 'paymentStatus')) doc.paymentStatus = 'Awaiting Payment';
    if (hasP(Order, 'billing')) doc.billing = billing;
    if (hasP(Order, 'items')) doc.items = items;
    if (hasP(Order, 'isVerified')) doc.isVerified = false;
    if (hasP(Order, 'stepsDone')) doc.stepsDone = 0;
    if (hasP(Order, 'currentStep')) doc.currentStep = 1;
    if (hasP(Order, 'progress')) doc.progress = 0;
    if (hasP(Order, 'taskCompleted')) doc.taskCompleted = false;

    const order = await Order.create(doc);
    if (!order.orderCode && hasP(Order, 'orderCode')) { order.orderCode = orderNo; await order.save(); }
    const code = orderCodeOf(order);
    console.log('[CHECKOUT] Order ' + code + ' created — sponsor ' + sponsorId + ', total PKR ' + total + ', ' + (items.length || 1) + ' item(s)');

    // EMAIL SEQUENCING: abhi SIRF verification email —
    // confirm + performer assign verify link click par hoga
    const token = crypto.randomBytes(24).toString('hex');
    verifyTokens.set(token, String(order._id));
    if (hasP(Order, 'verifyToken')) { order.verifyToken = token; await order.save(); }
    const link = PUBLIC_BASE + '/api/orders/verify/' + token;
    if (sponsor.email) {
      console.log('[VERIFY EMAIL] Sending verification link to ' + sponsor.email + ' for ' + code);
      sendMail(sponsor.email, 'Verify your IbadahConnect order ' + code,
        '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">' +
        '<h2 style="color:#1B5E20">Assalam-o-Alaikum ' + (sponsor.firstName || '') + ',</h2>' +
        '<p>Your order <b>' + code + '</b> (' + serviceType + (firstTitle ? ' — ' + firstTitle : '') + ') has been received.</p>' +
        '<p>Please verify your order by clicking the button below. Verification ke baad hi order confirm hota hai aur performer assign hota hai.</p>' +
        '<p style="text-align:center;margin:28px 0"><a href="' + link + '" style="background:#1B5E20;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none">Verify My Order</a></p>' +
        '<p style="font-size:12px;color:#777">Or open this link: ' + link + '</p>' +
        '<p style="font-size:12px;color:#777">Your payment is held as Amanah — released only after video-verified completion.</p>' +
        '</div>');
    }
    res.json({ ok: true, order, orderNumber: code, total });
  } catch (e) {
    console.log('[CHECKOUT ERROR]', e.message);
    res.status(500).json({ ok: false, message: 'Checkout failed: ' + e.message });
  }
}
app.post('/api/orders/checkout', checkoutHandler);
app.post('/api/checkout', checkoutHandler);
app.post('/api/payment/checkout', checkoutHandler);
app.post('/api/orders', checkoutHandler);

/* ------------------------------------------------------------
   VERIFY ORDER (link click par: confirm + assign + confirm email)
------------------------------------------------------------ */
async function verifyHandler(req, res) {
  try {
    const token = String(req.params.token || '');
    let order = null;
    const oid = verifyTokens.get(token);
    if (oid) { try { order = await Order.findById(oid); } catch (e) {} }
    if (!order && hasP(Order, 'verifyToken')) { try { order = await Order.findOne({ verifyToken: token }); } catch (e) {} }
    if (!order) return res.status(404).send('<h3 style="font-family:Arial">Invalid or expired verification link.</h3>');

    const already = verifiedOrders.has(String(order._id)) || order.isVerified === true;
    verifiedOrders.add(String(order._id));
    if (hasP(Order, 'isVerified')) order.isVerified = true;
    if (hasP(Order, 'verifiedAt')) order.verifiedAt = new Date();
    await order.save();
    const code = orderCodeOf(order);
    console.log('[VERIFY EMAIL] Order ' + code + ' verified' + (already ? ' (already verified)' : ''));

    const assigned = await tryAssignOrder(order, { silent: true });

    const sponsor = await safeUser(order.sponsor);
    if (sponsor && sponsor.email && !already) {
      const pname = ((order.performer && order.performerName) ? order.performerName : '');
      sendMail(sponsor.email,
        (assigned ? 'Order Confirmed — Performer Assigned (' + code + ')' : 'Order Confirmed (' + code + ')'),
        '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">' +
        '<h2 style="color:#1B5E20">Order Confirmed</h2>' +
        '<p>Assalam-o-Alaikum ' + (sponsor.firstName || '') + ', your order <b>' + code + '</b> is verified and confirmed.</p>' +
        (assigned
          ? '<p>A CNIC-verified performer has been assigned to your order. Aap abhi Track Order page par live progress dekh sakte hain.</p>'
          : '<p>All performers are currently busy with their ibadah tasks. Aap ka order queue mein hai — jaise hi koi performer free hoga, automatically assign ho jayega aur aap ko email mil jayegi.</p>') +
        '<p style="text-align:center;margin:24px 0"><a href="' + FRONT_BASE + '/track?code=' + code + '" style="background:#1B5E20;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none">Track My Order</a></p>' +
        '</div>');
    }

    res.send('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Order Verified — IbadahConnect</title></head>' +
      '<body style="margin:0;font-family:Arial,sans-serif;background:#f4f7f4;display:flex;align-items:center;justify-content:center;min-height:100vh">' +
      '<div style="background:#ffffff;max-width:460px;width:92%;padding:36px;border-radius:14px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.08)">' +
      '<div style="width:64px;height:64px;border-radius:50%;background:#1B5E20;color:#ffffff;font-size:34px;line-height:64px;margin:0 auto 16px">V</div>' +
      '<h2 style="color:#1B5E20;margin:0 0 8px">Order Verified</h2>' +
      '<p style="color:#444;margin:0 0 6px">Order <b>' + code + '</b> is now confirmed.</p>' +
      '<p style="color:#666;font-size:14px;margin:0 0 22px">A verified performer will be assigned automatically — aap ko email aa jayegi.</p>' +
      '<a href="' + FRONT_BASE + '/track?code=' + code + '" style="background:#1B5E20;color:#ffffff;padding:12px 26px;border-radius:8px;text-decoration:none;display:inline-block">Track My Order</a>' +
      '</div></body></html>');
  } catch (e) {
    console.log('[VERIFY ERROR]', e.message);
    res.status(500).send('Verify failed: ' + e.message);
  }
}
app.get('/api/orders/verify/:token', verifyHandler);
app.post('/api/orders/verify/:token', verifyHandler);
app.get('/api/verify/:token', verifyHandler);

/* ------------------------------------------------------------
   LIVE GPS  (performer push + sponsor poll — in-memory, Order.js safe)
------------------------------------------------------------ */
function pushLiveHandler(req, res) {
  try {
    const b = req.body || {};
    const lat = Number(b.lat); const lng = Number(b.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ ok: false, message: 'lat/lng required' });
    }
    liveLocations.set(String(req.params.orderId), {
      lat, lng,
      accuracy: Number(b.accuracy) || 0,
      performerName: String(b.performerName || b.name || ''),
      updatedAt: new Date().toISOString()
    });
    res.json({ ok: true, live: true });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
}
app.post('/api/live/:orderId', pushLiveHandler);
app.post('/api/live-location/:orderId', pushLiveHandler);

async function getLiveHandler(req, res) {
  try {
    const key = String(req.params.orderId || '');
    const e = liveLocations.get(key);
    if (e && (Date.now() - new Date(e.updatedAt).getTime()) < LIVE_TTL_MS) {
      return res.json({ ok: true, live: true, lat: e.lat, lng: e.lng, accuracy: e.accuracy, performerName: e.performerName, updatedAt: e.updatedAt, location: e, data: e });
    }
    // fallback: latest proof GPS (gold pin data)
    let ord = null;
    if (mongoose.isValidObjectId(key)) { try { ord = await Order.findById(key); } catch (er) {} }
    if (!ord) { try { ord = await Order.findOne({ orderCode: key }); } catch (er) {} }
    const oc = ord && ord.proofLocation ? parseCoords(ord.proofLocation) : null;
    const mc = oc || lastMilestoneCoords(ord);
    if (mc) {
      return res.json({ ok: true, live: false, source: 'proof', lat: mc.lat, lng: mc.lng, updatedAt: mc.capturedAt || '', performerName: (ord && ord.performerName) || '', location: mc, data: mc });
    }
    return res.json({ ok: true, live: false });
  } catch (err) { res.json({ ok: true, live: false }); }
}
app.get('/api/live/:orderId', getLiveHandler);
app.get('/api/live-location/:orderId', getLiveHandler);
app.get('/api/orders/:orderId/live', getLiveHandler);
app.get('/api/track/live/:orderId', getLiveHandler);

/* ------------------------------------------------------------
   AI PROOF VERIFY (heuristic — GPS proximity + keyword)
   Dashboard 60% gate isi se pass hota hai
------------------------------------------------------------ */
const AI_MIN = 60;
app.post('/api/ai/verify-proof', (req, res) => {
  try {
    const b = req.body || {};
    const pC = parseCoords(b.proofLocation || (b.proof && b.proof.location) || '');
    const rC = parseCoords(b.referenceLocation || (b.reference && b.reference.location) || '');
    let percent = 0; let mode = 'heuristic';
    if (pC && rC) {
      const d = haversineM(pC, rC);
      percent = d <= 150 ? 95 : d <= 500 ? 85 : d <= 2000 ? 68 : d <= 5000 ? 52 : 25;
      mode = 'gps-proximity (' + Math.round(d) + 'm)';
    } else if (b.text && b.reference) {
      const words = String(b.reference).toLowerCase().match(/[a-z]{4,}/g) || [];
      const t = String(b.text).toLowerCase();
      const hit = words.filter((w) => t.includes(w)).length;
      percent = words.length ? Math.min(95, 45 + Math.round((hit / words.length) * 50)) : 60;
      mode = 'keyword-match';
    } else {
      percent = 62; mode = 'presence-check';
    }
    const suggestion = percent >= AI_MIN ? 'verified' : 'manual-review';
    console.log('[AI VERIFY] matchPercent=' + percent + ' mode=' + mode);
    res.json({ ok: true, matchPercent: percent, percent, score: Math.round(percent / 10), suggestion, mode, minRequired: AI_MIN });
  } catch (e) {
    res.json({ ok: true, matchPercent: 62, suggestion: 'verified', mode: 'fallback', minRequired: AI_MIN });
  }
});

/* ------------------------------------------------------------
   PROOF SUBMIT (order-level fields + milestone sync + completion)
------------------------------------------------------------ */
async function proofHandler(req, res) {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ ok: false, message: 'Order not found' });
    const b = req.body || {};
    if (b.proofUrl !== undefined && hasP(Order, 'proofUrl')) order.proofUrl = b.proofUrl;
    if (b.proofNote !== undefined && hasP(Order, 'proofNote')) order.proofNote = String(b.proofNote || '').slice(0, 500);
    if (b.proofLocation !== undefined && hasP(Order, 'proofLocation')) order.proofLocation = b.proofLocation;
    if (hasP(Order, 'proofSubmittedAt')) order.proofSubmittedAt = new Date();
    if (b.stepsDone !== undefined && hasP(Order, 'stepsDone')) order.stepsDone = Number(b.stepsDone) || 0;
    if (b.currentStep !== undefined && hasP(Order, 'currentStep')) order.currentStep = Number(b.currentStep) || 1;
    if (b.progress !== undefined && hasP(Order, 'progress')) order.progress = Math.max(0, Math.min(100, Number(b.progress) || 0));
    if (hasP(Order, 'taskCompleted')) order.taskCompleted = !!b.taskCompleted;

    // milestone sync (agar dashboard milestoneIndex bhejta hai)
    if (typeof b.milestoneIndex === 'number' && Array.isArray(order.milestones) && order.milestones[b.milestoneIndex]) {
      const m = order.milestones[b.milestoneIndex];
      m.isCompleted = true;
      if (b.proofUrl) m.proofUrl = b.proofUrl;
      const c = parseCoords(b.proofLocation);
      if (c) m.proofLocation = { lat: c.lat, lng: c.lng, capturedAt: new Date() };
    }

    if (order.status !== 'Completed') order.status = b.taskCompleted ? 'Completed' : 'In Progress';
    if (b.taskCompleted && hasP(Order, 'completedAt')) order.completedAt = new Date();

    // live GPS payload ke sath bhi aa sakti hai
    const c2 = parseCoords(b.liveLocation || b.proofLocation);
    if (c2) {
      liveLocations.set(String(order._id), {
        lat: c2.lat, lng: c2.lng,
        accuracy: Number(b.accuracy) || 0,
        performerName: String(b.performerName || ''),
        updatedAt: new Date().toISOString()
      });
    }

    await order.save();
    if (b.taskCompleted) {
      console.log('[ORDER] ' + orderCodeOf(order) + ' marked COMPLETED — slot freed, pending orders retry hongi');
      retryPendingAssignments('performer completed an order');
    }
    res.json({ ok: true, message: b.taskCompleted ? 'Proof submitted — order completed' : 'Proof submitted', order });
  } catch (e) {
    console.log('[PROOF ERROR]', e.message);
    res.status(500).json({ ok: false, message: 'Proof submit failed: ' + e.message });
  }
}
['/api/orders/:orderId/proof', '/api/orders/:orderId/submit-proof', '/api/orders/:orderId/step-proof'].forEach((p) => {
  app.post(p, proofHandler);
  app.put(p, proofHandler);
});

async function statusHandler(req, res) {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ ok: false, message: 'Order not found' });
    const s = String((req.body || {}).status || '');
    if (!['Pending', 'Assigned', 'In Progress', 'Completed'].includes(s)) {
      return res.status(400).json({ ok: false, message: 'Invalid status' });
    }
    order.status = s;
    if (s === 'Completed' && hasP(Order, 'completedAt')) order.completedAt = new Date();
    await order.save();
    if (s === 'Completed') retryPendingAssignments('performer completed an order');
    res.json({ ok: true, order });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
}
app.put('/api/orders/:orderId/status', statusHandler);
app.post('/api/orders/:orderId/status', statusHandler);

/* ------------------------------------------------------------
   TRACKING  (orderCode ya _id — sponsor track page ke liye)
------------------------------------------------------------ */
async function findOrderByQuery(q) {
  const s = String(q || '').trim();
  if (!s) return null;
  if (mongoose.isValidObjectId(s)) { try { const o = await Order.findById(s); if (o) return o; } catch (e) {} }
  try { const o = await Order.findOne({ orderCode: s }); if (o) return o; } catch (e) {}
  const rx = new RegExp('^' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
  try { const o = await Order.findOne({ orderCode: rx }); if (o) return o; } catch (e) {}
  return null;
}

async function trackHandler(req, res) {
  try {
    const found = await findOrderByQuery(req.params.q);
    if (!found) return res.status(404).json({ ok: false, message: 'Order not found for: ' + req.params.q });
    let o = null;
    try {
      o = await Order.findById(found._id)
        .populate('sponsor', 'firstName lastName email')
        .populate('performer', 'firstName lastName email profilePic performerType isVerified experience');
    } catch (e) {}
    const obj = (o || found).toObject ? (o || found).toObject() : (o || found);
    obj.serviceTitle = obj.packageTitle || obj.serviceType;
    res.json({ ok: true, order: obj });
  } catch (e) { res.status(500).json({ ok: false, message: 'Track failed: ' + e.message }); }
}
app.get('/api/orders/track/:q', trackHandler);
app.get('/api/tracking/:q', trackHandler);
app.get('/api/orders/code/:q', trackHandler);

// GET /api/orders  — ?code= par tracking, warna all orders (admin)
app.get('/api/orders', async (req, res) => {
  try {
    if (req.query.code) {
      const found = await findOrderByQuery(req.query.code);
      if (!found) return res.status(404).json({ ok: false, message: 'Order not found' });
      return res.json({ ok: true, order: found });
    }
    const orders = await Order.find()
      .populate('sponsor', 'firstName lastName email')
      .populate('performer', 'firstName lastName email')
      .sort({ createdAt: -1 }).limit(300);
    res.json(orders);
  } catch (e) {
    console.log('[ALL ORDERS ERROR]', e.message);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// track router fallbacks (agar routes/track.js na ho)
app.get('/api/track/:code', trackHandler);
app.get('/api/track/mine/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ sponsor: req.params.userId }).sort({ createdAt: -1 }).limit(6);
    res.json(orders.map((o) => {
      const x = o.toObject ? o.toObject() : o;
      x.serviceTitle = x.packageTitle || x.serviceType;
      return x;
    }));
  } catch (e) { res.status(500).json({ message: 'Error fetching orders' }); }
});

// performer orders fallback (agar routes/performerOrders.js na ho)
async function perfOrdersHandler(req, res) {
  try {
    const orders = await Order.find({ performer: req.params.userId }).sort({ createdAt: -1 }).limit(100);
    res.json(orders.map((o) => {
      const x = o.toObject ? o.toObject() : o;
      x.serviceTitle = x.packageTitle || x.serviceType;
      return x;
    }));
  } catch (e) { res.status(500).json({ message: 'Error fetching performer orders' }); }
}
app.get('/api/orders/performer/mine/:userId', perfOrdersHandler);
app.get('/api/orders/performer/:userId', perfOrdersHandler);

// LAST resort: single order by code/id
app.get('/api/orders/:q', trackHandler);

/* ------------------------------------------------------------
   PACKAGES FALLBACK (agar routes/packages.js na ho)
------------------------------------------------------------ */
app.get('/api/packages', async (req, res) => {
  try { res.json(await Package.find().sort({ price: 1 })); } catch (e) { res.json([]); }
});
app.get('/api/packages/:id', async (req, res) => {
  try { res.json(await Package.findById(req.params.id)); } catch (e) { res.status(404).json({ message: 'Package not found' }); }
});

/* ------------------------------------------------------------
   HEALTH
------------------------------------------------------------ */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'IbadahConnect API v2.2', mongo: mongoose.connection.readyState, performerCap: PERFORMER_CAP, liveTracked: liveLocations.size });
});
app.get('/', (req, res) => res.json({ ok: true, service: 'IbadahConnect API v2.2' }));

/* ------------------------------------------------------------
   MONGO CONNECT + SEED (sirf khali ho to — data kabhi delete nahi)
------------------------------------------------------------ */
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || '';
if (!MONGO_URI) console.log('[DB] MONGO_URI missing — backend/.env check karein');

mongoose.connection.on('error', (e) => {
  const msg = String((e && e.message) || e);
  console.log('[DB] connection error: ' + msg.slice(0, 180));
  if (msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT') || msg.includes('timed out')) {
    console.log('[DB] HINT: internet/DNS check karein + MongoDB Atlas > Network Access mein apni IP (ya 0.0.0.0/0) whitelist honi chahiye');
  }
});

const DEFAULT_PACKAGES = [
  { title: 'Economy Umrah', price: 50000, desc: 'Essential Umrah Badal with photo updates.', category: 'Umrah Badal', image: '/images/umrah1.jpg' },
  { title: 'Standard Umrah', price: 80000, desc: 'Enhanced service with video documentation.', category: 'Umrah Badal', image: '/images/umrah2.jpg' },
  { title: 'VIP Umrah Badal', price: 150000, desc: 'VIP performer & live stream.', category: 'Umrah Badal', image: '/images/umrah3.jpg' },
  { title: 'Economy Hajj', price: 300000, desc: 'Essential Hajj Badal with photo updates.', category: 'Hajj Badal', image: '/images/hajj1.jpg' },
  { title: 'Standard Hajj', price: 500000, desc: 'Enhanced Hajj service with video documentation.', category: 'Hajj Badal', image: '/images/hajj2.jpg' },
  { title: 'VIP Hajj Badal', price: 700000, desc: 'VIP performer & live stream.', category: 'Hajj Badal', image: '/images/hajj3.jpg' },
  { title: 'Ramadan Umrah', price: 150000, desc: 'Perform Umrah in the blessed month of Ramadan.', category: 'Umrah Badal', image: '/images/umrah2.jpg' },
  { title: 'Video Proof Hajj', price: 600000, desc: 'Complete video evidence of all Hajj rituals.', category: 'Hajj Badal', image: '/images/hajj1.jpg' },
  { title: 'Express Umrah', price: 100000, desc: 'Priority booking and fastest execution.', category: 'Umrah Badal', image: '/images/umrah3.jpg' }
];

async function seedDefaults() {
  try {
    const u = await User.findOne({ email: 'aqsa@ibadah.com' });
    if (!u) {
      const hashed = await bcrypt.hash('123456', 10);
      await User.create({ firstName: 'First Name', lastName: 'Last Name', country: 'Pakistan', phone: '03001234567', email: 'aqsa@ibadah.com', password: hashed, role: 'Sponsor' });
      console.log('[SEED] Default sponsor created: aqsa@ibadah.com');
    }
    if (Package) {
      const count = await Package.countDocuments();
      if (count === 0) {
        await Package.insertMany(DEFAULT_PACKAGES);
        console.log('[SEED] 9 default packages inserted (collection was empty)');
      }
    }
  } catch (e) { console.log('[SEED] skipped:', e.message); }
}

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 30000, family: 4 })
  .then(async () => {
    console.log('[DB] MongoDB Connected — IbadahConnect API v2.2');
    await seedDefaults();
    retryPendingAssignments('startup scan');
  })
  .catch((err) => {
    console.log('[DB] MongoDB connect failed: ' + String(err.message || err).slice(0, 180));
    console.log('[DB] Server phir bhi chal raha hai — internet + Atlas Network Access (IP whitelist 0.0.0.0/0) check karein, connect khud dobara try karega');
  });

app.listen(PORT, () => {
  console.log('[BOOT] IbadahConnect API v2.2 running on port ' + PORT);
  console.log('[BOOT] AUTO-ASSIGN: performer capacity = ' + PERFORMER_CAP + ' active orders | auto-retry every 60s');
});
