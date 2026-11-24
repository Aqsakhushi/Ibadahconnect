/**
 * ============================================================
 *  IbadahConnect — backend/routes/orders.js   (v7 — CLEAN CONSOLE)
 * ------------------------------------------------------------
 *  CHANGES IN v7 (sirf logging/quiet fixes — koi route, koi
 *  flow, koi business rule change NAHI. v6 ka saara logic
 *  as-it-is hai):
 *   1. AUTO-ASSIGN SPAM FIX — "All performers busy" line ab
 *      har episode par sirf EK dafa aati hai (capacity change
 *      hone par — assign/release/complete — dobara allow).
 *      Sweep ab ek aggregate line deta hai: kitne verified
 *      orders wait kar rahe hain + unke codes. Har dashboard
 *      refresh pe repeat NAHI hota.
 *   2. EMAIL NOISE FIX — "No recipients defined" khatam
 *      (empty/invalid recipient pe send se PEHLE guard).
 *      Network errors (ENETUNREACH / timeout / DNS / TLS) ab
 *      10 min me sirf EK short line — full stack spam nahi.
 *   3. ROUTE ERROR LOGS — console.error(..., err) se poore
 *      stack dumps aate the (MongoNetworkTimeoutError wali
 *      8-line blocks); ab sirf err.message (1 line per error).
 *   4. [CHECKOUT] Payload JSON dump removed (created-order line
 *      kaafi hai) aur "[AUTH] Guest request" noise log removed.
 *  v6 FEATURES INTACT: checkout payload resolution (packageId +
 *  qty -> Package lookup), Task-E verification flow (email ->
 *  /verify/:token -> auto-assign -> confirmation #2), scoring
 *  (verified +50, same city +20), max 1 active task per
 *  performer, max 1 completed/day, 48h AUTO-RELEASE sweep, GPS
 *  auto-verify (15km Haram radius), OCR proof storage, rating,
 *  aur saari LEGACY routes — sab unchanged.
 * ============================================================
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const Order = require('../models/Order');
const { JWT_SECRET } = require('../config/env');
const { generateForCompletedOrder } = require('../services/certificates');

const router = express.Router();

/* ============================================================
   MODEL RESOLUTION (defensive — can never crash at require time)
   ============================================================ */
function getModel(file, name) {
  try {
    const m = require(file);
    if (m && m.prototype instanceof mongoose.Model) return m;
    if (m && m[name] && m[name].prototype instanceof mongoose.Model) return m[name];
  } catch (e) { /* fall through to registry lookup */ }
  try { return mongoose.model(name); } catch (e) { return null; }
}

/* ============================================================
   LOG THROTTLE (console clean rakhne ke liye — v7 NEW)
   - logOnce(key, msg, ttlMs): same key wala message TTL ke
     andar sirf EK dafa print hota hai.
   - resetBusyNotices(): jab capacity change ho (koi order
     assign ho jaye / release ho jaye / complete ho jaye) to
     busy-wale notices reset — taake NAYI busy episode ka
     message phir se ek dafa aa sake.
   ============================================================ */
const _logOnce = new Map(); // key -> last printed timestamp (ms)
function logOnce(key, msg, ttlMs = 10 * 60 * 1000) {
  const now = Date.now();
  const last = _logOnce.get(key) || 0;
  if (now - last < ttlMs) return false;
  _logOnce.set(key, now);
  console.log(msg);
  return true;
}
function resetBusyNotices() {
  for (const k of [..._logOnce.keys()]) {
    if (String(k).startsWith('busy') || k === 'auto-assign-busy') _logOnce.delete(k);
  }
}

// Populate field lists (never expose password hashes)
const PERFORMER_FIELDS = 'firstName lastName email profilePic performerType isVerified experience city cnicStatus';
const SPONSOR_FIELDS = 'firstName lastName email profilePic';

/* ============================================================
   ENV + MAILER
   ============================================================ */
const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD || '';
const SERVER_URL = (process.env.SERVER_URL || 'http://localhost:5000').replace(/\/+$/, '');
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
const EMAIL_FROM = process.env.EMAIL_FROM || `IbadahConnect <${SMTP_USER}>`;

const transporter = SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

// Fire-and-forget email helper — never blocks or breaks an API call
const _emailNotice = { net: 0 }; // network-error throttle (v7)
async function sendMail(options) {
  // v7 GUARD: empty/invalid recipient -> "No recipients defined"
  // error ab kabhi hi nahi aayega (send se pehle hi skip).
  const to = options && options.to ? String(options.to).trim() : '';
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    logOnce('email-no-recipient', '[EMAIL] Skipped — no valid recipient (order flow unaffected)');
    return;
  }
  if (!transporter) {
    logOnce('email-unconfigured', '[EMAIL] SMTP not configured — emails skipped (order flow unaffected)');
    return;
  }
  try {
    const info = await transporter.sendMail(options);
    console.log(`[EMAIL] Sent -> ${to} (${info && info.messageId})`);
  } catch (err) {
    // v7: network/DNS/timeout errors pe full stack ki jagah
    // 10 min me sirf EK short warning line.
    const code = String((err && err.code) || '');
    const msg = String((err && err.message) || err || '');
    const networkish =
      /ENETUNREACH|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EHOSTUNREACH|ENOTFOUND|EAI_AGAIN|ESOCKET/i.test(code) ||
      /timeout|timed out|TLS|greeting/i.test(msg);
    if (networkish) {
      const now = Date.now();
      if (now - _emailNotice.net > 10 * 60 * 1000) {
        _emailNotice.net = now;
        console.warn('[EMAIL] Gmail SMTP abhi reachable nahi (network/DNS) — email skipped, order flow unaffected.');
      }
    } else {
      console.error('[EMAIL ERROR]', msg);
    }
  }
}

/* ============================================================
   SMALL HELPERS
   ============================================================ */
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidObjectId(value) {
  try {
    return Boolean(value) && mongoose.Types.ObjectId.isValid(String(value));
  } catch (e) {
    return false;
  }
}

function normalizeType(raw) {
  const s = String(raw || '').toLowerCase();
  if (s.includes('hajj')) return 'Hajj';
  if (s.includes('umrah')) return 'Umrah';
  if (
    s.includes('sadaq') || s.includes('sadqa') || s.includes('donat') ||
    s.includes('charity') || s.includes('zakat') || s.includes('kaffara') ||
    s.includes('fidya') || s.includes('qurbani')
  ) return 'Sadaqah';
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Umrah';
}

function performerName(p) {
  if (!p) return 'A verified performer';
  const full = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
  return full || p.name || p.fullName || 'A verified performer';
}

const HARAM_LOCATIONS = [
  { name: 'Masjid al-Haram (Makkah)', lat: 21.4225, lng: 39.8262 },
  { name: 'Masjid an-Nabawi (Madinah)', lat: 24.4672, lng: 39.6112 },
];
const HARAM_RADIUS_KM = 15;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function DEFAULT_MILESTONES() {
  const base = {
    completedAt: null,
    proofUrl: '',
    proofOcr: '',
    proofLocation: null,
    autoVerified: false,
    site: '',
  };
  return [
    { title: 'Order Confirmed', step: 1, description: 'Your email is verified and the order is accepted.', status: 'Pending', ...base },
    { title: 'Performer Assigned', step: 2, description: 'A verified performer has been assigned to your order.', status: 'Pending', ...base },
    { title: 'Ritual In Progress', step: 3, description: 'The performer is carrying out the ibadah on your behalf.', status: 'Pending', ...base },
    { title: 'Proof & Verification', step: 4, description: 'Photo/GPS proof is captured near the holy site.', status: 'Pending', ...base },
    { title: 'Completed', step: 5, description: 'Ibadah complete — certificate is available.', status: 'Pending', ...base },
  ];
}

/* ============================================================
   OPTIONAL AUTH — never rejects a request.
   If a valid Bearer token exists, the sponsor is attached to
   req.user; otherwise the request continues as a guest.
   (v7: guest log removed — ye har request pe noise karta tha)
   ============================================================ */
function extractToken(req) {
  const h = req.headers && req.headers.authorization;
  if (h && typeof h === 'string' && h.startsWith('Bearer ')) return h.slice(7).trim();
  return null;
}

async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const User = getModel('../models/User', 'User');
      if (User) {
        const user = await User.findById(decoded.id || decoded._id || decoded.userId).select('-password');
        if (user) req.user = user;
      }
    }
  } catch (e) {
    /* guest request — silently continue */
  }
  next();
}

router.use(optionalAuth);

/* ============================================================
   EMAIL TEMPLATES
   ============================================================ */
function emailShell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5dfd0;">
          <tr>
            <td style="background:#0d3b2e;padding:24px 32px;text-align:center;">
              <div style="color:#d4af37;font-size:22px;font-weight:bold;letter-spacing:1px;">IbadahConnect</div>
              <div style="color:#f4f1ea;font-size:13px;margin-top:4px;">Trustworthy Ibadah on Your Behalf</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;color:#0d3b2e;font-size:20px;">${escapeHtml(title)}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#faf8f2;padding:18px 32px;border-top:1px solid #e5dfd0;">
              <div style="color:#8a8577;font-size:12px;line-height:1.6;">
                You are receiving this email because an order was placed on IbadahConnect.<br />
                &copy; ${new Date().getFullYear()} IbadahConnect &middot; All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function verificationEmailHtml(order, token) {
  const link = `${SERVER_URL}/api/orders/verify/${token}`;
  return `
    <p style="margin:0 0 12px;color:#3a3a3a;font-size:14px;line-height:1.7;">Assalam-o-Alaikum,</p>
    <p style="margin:0 0 16px;color:#3a3a3a;font-size:14px;line-height:1.7;">
      Thank you for your order <b style="color:#0d3b2e;">${escapeHtml(order.orderCode)}</b>.
      Please confirm your email address so we can assign a verified performer to your ibadah.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td style="background:#d4af37;border-radius:8px;">
          <a href="${link}" style="display:inline-block;padding:12px 28px;color:#0d3b2e;font-weight:bold;font-size:15px;text-decoration:none;">Verify Your Order</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:#6b675c;font-size:12px;line-height:1.6;">If the button does not work, copy this link into your browser:</p>
    <p style="margin:0 0 16px;word-break:break-all;">
      <a href="${link}" style="color:#b8912a;font-size:12px;">${link}</a>
    </p>
    <p style="margin:0;color:#6b675c;font-size:12px;line-height:1.6;">
      This link expires in 48 hours. If you did not place this order, you can safely ignore this email.
    </p>`;
}

function confirmationEmailHtml(order, performer) {
  const pName = escapeHtml(performerName(performer));
  const pCity = escapeHtml((performer && performer.city) || '');
  const rows = `
    <tr>
      <td style="padding:8px 0;color:#6b675c;font-size:13px;">Order Code</td>
      <td style="padding:8px 0;color:#0d3b2e;font-size:13px;font-weight:bold;text-align:right;">${escapeHtml(order.orderCode)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;color:#6b675c;font-size:13px;">Package(s)</td>
      <td style="padding:8px 0;color:#0d3b2e;font-size:13px;text-align:right;">${escapeHtml(order.packageTitle)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;color:#6b675c;font-size:13px;">Total</td>
      <td style="padding:8px 0;color:#0d3b2e;font-size:13px;text-align:right;">PKR ${Number(order.price || 0).toLocaleString('en-US')}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;color:#6b675c;font-size:13px;">Performer</td>
      <td style="padding:8px 0;color:#0d3b2e;font-size:13px;text-align:right;">${pName}${pCity ? ' &middot; ' + pCity : ''}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;color:#6b675c;font-size:13px;">Status</td>
      <td style="padding:8px 0;color:#0d3b2e;font-size:13px;text-align:right;">${escapeHtml(order.status)}</td>
    </tr>`;
  return `
    <p style="margin:0 0 12px;color:#3a3a3a;font-size:14px;line-height:1.7;">Assalam-o-Alaikum,</p>
    <p style="margin:0 0 16px;color:#3a3a3a;font-size:14px;line-height:1.7;">
      Great news — your email has been verified and a performer has been assigned to your order.
      You can track live progress from your dashboard at any time.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f2;border:1px solid #e5dfd0;border-radius:8px;margin:0 0 20px;">${rows}</table>
    <p style="margin:0;color:#6b675c;font-size:12px;line-height:1.6;">JazakAllah khair for trusting IbadahConnect.</p>`;
}

/* ============================================================
   HTML LANDING PAGES (verification link results)
   ============================================================ */
function pageShell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin:0; font-family:Arial,Helvetica,sans-serif; background:#f4f1ea; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .card { background:#fff; max-width:480px; width:92%; border-radius:12px; border:1px solid #e5dfd0; overflow:hidden; text-align:center; }
    .head { background:#0d3b2e; padding:28px; }
    .brand { color:#d4af37; font-size:22px; font-weight:bold; letter-spacing:1px; }
    .body { padding:32px; }
    h1 { margin:0 0 12px; color:#0d3b2e; font-size:20px; }
    p { margin:0 0 14px; color:#4a473e; font-size:14px; line-height:1.7; }
    a.btn { display:inline-block; margin-top:6px; background:#d4af37; color:#0d3b2e; font-weight:bold; padding:12px 28px; border-radius:8px; text-decoration:none; font-size:14px; }
    .foot { background:#faf8f2; border-top:1px solid #e5dfd0; padding:14px; color:#8a8577; font-size:12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="head"><div class="brand">IbadahConnect</div></div>
    <div class="body">${bodyHtml}</div>
    <div class="foot">&copy; ${new Date().getFullYear()} IbadahConnect</div>
  </div>
</body>
</html>`;
}

/* ============================================================
   AUTO-ASSIGN ENGINE
   Performers live in the User collection (role: 'Performer').
   v7: busy hone par yahan koi log NAHI hota — call sites
   (sweep / verify route) logOnce se EK dafa message dete hain.
   ============================================================ */
async function loadPerformers(excludeIds = []) {
  const baseQuery = { _id: { $nin: excludeIds } };
  try {
    const Performer = getModel('../models/Performer', 'Performer');
    if (Performer) return await Performer.find(baseQuery).lean();
  } catch (e) { /* fall through to User-based performers */ }
  try {
    const User = getModel('../models/User', 'User');
    if (User) return await User.find({ ...baseQuery, role: 'Performer' }).lean();
  } catch (e) { /* no performers available */ }
  return [];
}

async function notifyAssignment(order, performerDoc) {
  try {
    if (!order.contactEmail) return;
    await sendMail({
      from: EMAIL_FROM,
      to: order.contactEmail,
      subject: `Order ${order.orderCode} Confirmed — Performer Assigned`,
      html: confirmationEmailHtml(order, performerDoc),
    });
  } catch (err) {
    console.error('[NOTIFY ASSIGNMENT ERROR]', err.message);
  }
}

// Shared: attach performer to an order + confirmation email #2
async function applyAssignment(order, performerDoc) {
  order.performer = performerDoc._id;
  order.assignedAt = new Date();
  order.status = 'Assigned';
  if (Array.isArray(order.milestones)) {
    if (order.milestones[0]) {
      order.milestones[0].status = 'Completed';
      order.milestones[0].completedAt = new Date();
    }
    if (order.milestones[1]) order.milestones[1].status = 'In Progress';
  }
  await order.save();
  // v7: capacity change hui — busy notices reset karo
  resetBusyNotices();
  await notifyAssignment(order, performerDoc);
}

async function assignPerformer(order, excludeIds = [], opts = {}) {
  try {
    if (mongoose.connection.readyState !== 1) return null;

    const performers = await loadPerformers(excludeIds);
    if (!performers.length) {
      logOnce('no-performers', '[AUTO-ASSIGN] No performers registered yet');
      return null;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let best = null;
    let bestScore = -1;

    for (const p of performers) {
      // Limit: max 1 active task per performer
      const activeCount = await Order.countDocuments({
        performer: p._id,
        status: { $in: ['Assigned', 'In Progress'] },
      });
      if (activeCount >= 1) continue;

      // Limit: max 1 completed task per performer per day
      const doneToday = await Order.countDocuments({
        performer: p._id,
        status: 'Completed',
        updatedAt: { $gte: startOfDay },
      });
      if (doneToday >= 1) continue;

      // Scoring: verified identity +50, same city +20
      let score = 0;
      if (p.cnicStatus === 'Verified' || p.isVerified === true) score += 50;
      if (order.city && p.city && String(p.city).toLowerCase() === String(order.city).toLowerCase()) score += 20;

      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }

    if (!best) {
      // v7: yahan koi log NAHI — call site logOnce karta hai
      return null;
    }

    await applyAssignment(order, best);
    console.log(`[AUTO-ASSIGN] Order ${order.orderCode} -> performer ${performerName(best)} (score ${bestScore})`);
    return best;
  } catch (err) {
    console.error('[AUTO-ASSIGN ERROR]', err.message);
    return null;
  }
}

// Sweep: assign verified pending orders (called lazily from /mine and /all)
// v7: sweep ke pehle check me hi return — jab kuch pending hi nahi
// to bilkul silence. Sab busy hone par EK aggregate line (episode
// me sirf ek dafa), phir repeat nahi jab tak capacity change na ho.
async function autoAssignPendingOrders() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const pending = await Order.find({
      status: 'Pending',
      isEmailVerified: true,
      $or: [{ performer: null }, { performer: { $exists: false } }],
    }).limit(10);
    if (!pending.length) return;

    const performers = await loadPerformers();
    let assigned = 0;
    const blockedCodes = [];

    for (const order of pending) {
      const p = await assignPerformer(order, [], { notifyBusy: false });
      if (p) assigned++;
      else blockedCodes.push(order.orderCode);
    }

    if (assigned > 0) {
      resetBusyNotices(); // capacity badli — naya episode
      console.log(`[AUTO-ASSIGN] Sweep: ${assigned} order(s) assigned.`);
    }
    if (blockedCodes.length) {
      logOnce(
        'auto-assign-busy',
        `[AUTO-ASSIGN] Reschedule needed — all ${performers.length} performers are busy; ` +
          `${blockedCodes.length} verified order(s) waiting: ${blockedCodes.join(', ')} (auto-retry continues)`,
        15 * 60 * 1000
      );
    }
  } catch (err) {
    console.error('[AUTO-ASSIGN SWEEP ERROR]', err.message);
  }
}

// Sweep: release tasks whose performer never accepted within 48h
async function releaseStaleTasks() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const stale = await Order.find({
      status: { $in: ['Assigned', 'In Progress'] },
      assignedAt: { $ne: null, $lte: cutoff },
    }).limit(10);

    let released = 0;
    for (const order of stale) {
      const oldPerformer = order.performer;
      order.performer = null;
      order.assignedAt = null;
      order.status = 'Pending';
      await order.save();
      // Log AFTER a successful save (no more repeat spam)
      released++;
      console.log(`[AUTO-RELEASE] Order ${order.orderCode} released — performer did not accept within 48h`);
      if (oldPerformer) await assignPerformer(order, [oldPerformer]);
    }
    if (released > 0) resetBusyNotices(); // capacity badli — naya episode
  } catch (err) {
    console.error('[AUTO-RELEASE ERROR]', err.message);
  }
}

// Accepts a Mongo ObjectId OR an order code like IC-2026-755184
async function resolveOrderQuery(query) {
  const q = String(query || '').trim();
  if (!q) return null;
  const byId = isValidObjectId(q);
  try {
    return byId
      ? await Order.findById(q).populate('performer', PERFORMER_FIELDS)
      : await Order.findOne({ orderCode: q.toUpperCase() }).populate('performer', PERFORMER_FIELDS);
  } catch (e) {
    // populate can fail on unexpected ref models — retry without it
    try {
      return byId ? await Order.findById(q) : await Order.findOne({ orderCode: q.toUpperCase() });
    } catch (e2) {
      return null;
    }
  }
}

// Shared verification-email sender (fire & forget, never throws)
function sendVerificationEmail(order) {
  const token = jwt.sign(
    { orderId: order._id.toString(), purpose: 'order-verify' },
    JWT_SECRET,
    { expiresIn: '2d' }
  );
  console.log(`[VERIFY EMAIL] Sending verification link to ${order.contactEmail} for ${order.orderCode}`);
  sendMail({
    from: EMAIL_FROM,
    to: order.contactEmail,
    subject: `Verify your IbadahConnect order ${order.orderCode}`,
    html: verificationEmailHtml(order, token),
  }).catch(() => {});
}

/* ============================================================
   ROUTES
   ============================================================ */

/* ------------------------------------------------------------
   POST / — CHECKOUT (create order + send verification email)
   Real frontend payload:
   { userId, billing:{...}, items:[{ packageId, qty }],
     hadiyah, paymentMethod }
   ------------------------------------------------------------ */
router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    const billing = b.billing && typeof b.billing === 'object' ? b.billing : {};

    /* ---------- 1) Resolve the sponsor (owner) of this order ---------- */
    let sponsor = req.user || null;
    if (sponsor) {
      console.log('[CHECKOUT] Sponsor resolved from token:', sponsor._id.toString());
    } else if (b.userId && isValidObjectId(b.userId)) {
      const User = getModel('../models/User', 'User');
      if (User) sponsor = await User.findById(b.userId);
      if (sponsor) console.log('[CHECKOUT] Sponsor resolved from body.userId:', b.userId);
    }
    if (!sponsor) {
      const fallbackEmail = b.contactEmail || b.email || billing.contactEmail || billing.email || '';
      if (fallbackEmail) {
        const User = getModel('../models/User', 'User');
        if (User) sponsor = await User.findOne({ email: String(fallbackEmail).toLowerCase().trim() });
        if (sponsor) console.log('[CHECKOUT] Sponsor resolved from email:', fallbackEmail);
      }
    }
    if (!sponsor) {
      return res.status(401).json({ message: 'Please log in before placing an order.' });
    }

    /* ---------- 2) Resolve the contact email for verification ---------- */
    const contactEmail = String(
      b.contactEmail || b.email || billing.contactEmail || billing.email || sponsor.email || ''
    )
      .toLowerCase()
      .trim();

    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res
        .status(400)
        .json({ message: 'A valid contact email is required to send your verification link.' });
    }

    /* ---------- 3) Collect raw cart items (every known shape) ---------- */
    let rawItems =
      b.items || b.cart || b.cartItems || b.orderItems || b.products || b.packages || b.services || [];
    if (!Array.isArray(rawItems) && rawItems && typeof rawItems === 'object') {
      rawItems = Object.values(rawItems);
    }
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res
        .status(400)
        .json({ message: 'Your cart is empty. Please add a package before checking out.' });
    }

    /* ---------- 4) Resolve each item's title & price ----------
       The frontend sends only { packageId, qty } — titles and
       prices live in the packages collection, so look them up. */
    const Package = getModel('../models/Package', 'Package');
    if (!Package) {
      return res
        .status(500)
        .json({ message: 'Package catalog is unavailable. Please try again shortly.' });
    }

    const lineTitles = [];
    const typeSet = new Set();
    let totalPrice = 0;

    for (const entry of rawItems) {
      const it = entry || {};
      const qty = Math.max(1, parseInt(it.qty || it.quantity || it.count || 1, 10) || 1);
      const pkgId = it.packageId || it.id || it._id || it.package || it.productId || null;

      let title = it.title || it.name || it.packageTitle || null;
      let price =
        it.price != null ? it.price : it.amount != null ? it.amount : it.rate != null ? it.rate : null;
      let type = it.serviceType || it.type || it.category || null;

      if ((title == null || price == null) && pkgId) {
        let pkg = null;
        if (isValidObjectId(pkgId)) pkg = await Package.findById(pkgId).lean();
        if (!pkg) {
          pkg = await Package.findOne({ $or: [{ packageId: pkgId }, { slug: pkgId }] }).lean();
        }
        if (pkg) {
          if (title == null) title = pkg.title || pkg.name || pkg.packageTitle || null;
          if (price == null) price = pkg.price != null ? pkg.price : pkg.cost != null ? pkg.cost : pkg.amount;
          if (!type) type = pkg.type || pkg.category || pkg.serviceType || null;
        }
      }

      if (title == null || String(title).trim() === '' || price == null) {
        console.log('[CHECKOUT] Could not resolve package:', JSON.stringify(it));
        return res.status(400).json({
          message: 'Package details could not be loaded. Please refresh the page and try again.',
        });
      }

      const cleanPrice = Number(String(price).replace(/[^0-9.]/g, ''));
      if (!Number.isFinite(cleanPrice) || cleanPrice < 0) {
        return res.status(400).json({
          message: 'A package in your cart has an invalid price. Please refresh and try again.',
        });
      }

      lineTitles.push(`${String(title).trim()} x${qty}`);
      totalPrice += cleanPrice * qty;
      typeSet.add(normalizeType(type));
    }

    const hadiyah = Number(b.hadiyah) || 0;
    totalPrice += hadiyah;
    const packageTitle = lineTitles.join(', ');
    const serviceType = [...typeSet].join(' + ') || 'Umrah';

    if (!packageTitle || !Number.isFinite(totalPrice) || totalPrice <= 0) {
      return res.status(400).json({ message: 'Package title and price are required.' });
    }

    /* ---------- 5) Persist the order ---------- */
    // The Order model has no separate address/phone fields yet,
    // so the billing details are preserved inside `notes`.
    let notesText = String(billing.notes || b.notes || '').trim();
    const contactParts = [];
    if (billing.fullName) contactParts.push(`Contact: ${billing.fullName}`);
    if (billing.phone) contactParts.push(`Phone: ${billing.phone}`);
    if (billing.address) contactParts.push(`Address: ${billing.address}`);
    if (billing.country) contactParts.push(`Country: ${billing.country}`);
    if (contactParts.length) {
      notesText = [notesText, contactParts.join(' | ')].filter(Boolean).join(' — ');
    }

    const order = await Order.create({
      sponsor: sponsor._id,
      serviceType,
      packageTitle,
      price: Math.round(totalPrice * 100) / 100,
      hadiyah,
      city: String(billing.city || b.city || '').trim(),
      notes: notesText,
      paymentMethod: b.paymentMethod || 'JazzCash',
      contactEmail,
      isEmailVerified: false,
      milestones: DEFAULT_MILESTONES(),
    });

    console.log(
      `[CHECKOUT] Order ${order.orderCode} created — sponsor ${sponsor._id}, total PKR ${order.price}, ${rawItems.length} item(s)`
    );

    /* ---------- 6) Send verification email (fire & forget) ---------- */
    sendVerificationEmail(order);

    /* ---------- 7) Respond ---------- */
    return res.status(201).json({
      message: 'Order placed! A verification link has been sent to your email.',
      order,
      verificationRequired: true,
    });
  } catch (err) {
    console.error('[CREATE ORDER ERROR]', err.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

/* ------------------------------------------------------------
   POST /create — LEGACY checkout endpoint (kept for any older
   page that still posts here). Same verification flow applies.
   ------------------------------------------------------------ */
router.post('/create', async (req, res) => {
  try {
    const b = req.body || {};

    let sponsor = req.user || null;
    if (!sponsor && b.sponsor && isValidObjectId(b.sponsor)) {
      const User = getModel('../models/User', 'User');
      if (User) sponsor = await User.findById(b.sponsor);
    }
    if (!sponsor && b.userId && isValidObjectId(b.userId)) {
      const User = getModel('../models/User', 'User');
      if (User) sponsor = await User.findById(b.userId);
    }
    if (!sponsor) {
      return res.status(401).json({ message: 'Please log in before placing an order.' });
    }

    const contactEmail = String(b.contactEmail || b.email || sponsor.email || '')
      .toLowerCase()
      .trim();
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res
        .status(400)
        .json({ message: 'A valid contact email is required to send your verification link.' });
    }

    const hadiyah = Number(b.hadiyah) || 0;
    const price = Number(String(b.price != null ? b.price : 0).replace(/[^0-9.]/g, '')) || 0;
    const packageTitle = String(b.packageTitle || b.title || 'Ibadah Order').trim();
    const reqAddr = b.requestorAddress && typeof b.requestorAddress === 'object' ? b.requestorAddress : {};

    // Preserve legacy recipient/contact details inside notes
    let notesText = String(b.notes || '').trim();
    const legacyParts = [];
    if (b.requestorPhone) legacyParts.push(`Phone: ${b.requestorPhone}`);
    if (reqAddr.street) legacyParts.push(`Address: ${reqAddr.street}`);
    if (reqAddr.city) legacyParts.push(`City: ${reqAddr.city}`);
    if (reqAddr.country) legacyParts.push(`Country: ${reqAddr.country}`);
    if (legacyParts.length) {
      notesText = [notesText, legacyParts.join(' | ')].filter(Boolean).join(' — ');
    }

    const order = await Order.create({
      sponsor: sponsor._id,
      serviceType: b.serviceType || 'Umrah',
      packageTitle,
      price: Math.round((price + hadiyah) * 100) / 100,
      hadiyah,
      city: String(reqAddr.city || b.city || '').trim(),
      notes: notesText,
      paymentMethod: b.paymentMethod || 'JazzCash',
      contactEmail,
      isEmailVerified: false,
      milestones: DEFAULT_MILESTONES(),
    });

    console.log(`[LEGACY CHECKOUT] Order ${order.orderCode} created via /create — sponsor ${sponsor._id}`);
    sendVerificationEmail(order);

    return res.status(201).json({
      message: 'Order booked successfully!',
      order,
      verificationRequired: true,
    });
  } catch (err) {
    console.error('[LEGACY CREATE ERROR]', err.message);
    return res.status(500).json({ message: 'Error booking order', error: err.message });
  }
});

/* ------------------------------------------------------------
   GET /verify/:token — email verification landing page
   Flow: mark verified -> auto-assign -> confirmation email #2
   ------------------------------------------------------------ */
router.get('/verify/:token', async (req, res) => {
  try {
    let decoded;
    try {
      decoded = jwt.verify(req.params.token, JWT_SECRET);
    } catch (e) {
      return res.status(400).send(
        pageShell(
          'Invalid Link',
          `<h1>Link Expired or Invalid</h1><p>This verification link is invalid or has expired. Please place a new order.</p><a class="btn" href="${CLIENT_URL}">Back to Home</a>`
        )
      );
    }

    if (!decoded || decoded.purpose !== 'order-verify' || !decoded.orderId) {
      return res.status(400).send(
        pageShell(
          'Invalid Link',
          `<h1>Invalid Verification Link</h1><p>Please use the exact link from your verification email.</p><a class="btn" href="${CLIENT_URL}">Back to Home</a>`
        )
      );
    }

    const order = await Order.findById(decoded.orderId);
    if (!order) {
      return res.status(404).send(
        pageShell(
          'Not Found',
          `<h1>Order Not Found</h1><p>We could not find the order attached to this link.</p><a class="btn" href="${CLIENT_URL}">Back to Home</a>`
        )
      );
    }

    if (order.isEmailVerified) {
      return res.status(200).send(
        pageShell(
          'Already Verified',
          `<h1>Already Verified</h1><p>Order <b>${escapeHtml(order.orderCode)}</b> was already verified. No further action is needed.</p><a class="btn" href="${CLIENT_URL}">Back to Home</a>`
        )
      );
    }

    order.isEmailVerified = true;
    await order.save();
    console.log(`[VERIFY EMAIL] Order ${order.orderCode} verified by ${order.contactEmail}`);

    // Task E: after verification -> auto-assign performer -> confirmation email #2
    const performer = await assignPerformer(order);
    if (!performer) {
      // v7: ye line ab per order sirf EK dafa aayegi (10 min TTL)
      logOnce(
        `busy-${order.orderCode}`,
        `[AUTO-ASSIGN] All performers currently busy — order ${order.orderCode} stays Pending (auto-retry continues)`
      );
    }

    return res.status(200).send(
      pageShell(
        'Email Verified',
        `<h1>Alhamdulillah — Email Verified!</h1><p>Your order <b>${escapeHtml(order.orderCode)}</b> is confirmed. We are assigning a verified performer and you will receive a confirmation email shortly.</p><a class="btn" href="${CLIENT_URL}">Back to IbadahConnect</a>`
      )
    );
  } catch (err) {
    console.error('[VERIFY ERROR]', err.message);
    return res.status(500).send(
      pageShell(
        'Error',
        `<h1>Something Went Wrong</h1><p>We could not verify your email right now. Please try again.</p><a class="btn" href="${CLIENT_URL}">Back to Home</a>`
      )
    );
  }
});

/* ------------------------------------------------------------
   GET /mine — orders of the logged-in sponsor (token based)
   ------------------------------------------------------------ */
router.get('/mine', async (req, res) => {
  try {
    if (!req.user) return res.json([]);
    const orders = await Order.find({ sponsor: req.user._id })
      .populate('performer', PERFORMER_FIELDS)
      .sort({ createdAt: -1 });
    res.json(orders);
    // Lazy sweep — try to assign any verified pending orders
    autoAssignPendingOrders().catch(() => {});
  } catch (err) {
    console.error('[MY ORDERS ERROR]', err.message);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

/* ------------------------------------------------------------
   GET /all — all orders (Admin + Performer portal) + sweeps
   ------------------------------------------------------------ */
router.get('/all', async (req, res) => {
  try {
    // Fire & forget sweeps — fully guarded, never throw
    releaseStaleTasks()
      .then(() => autoAssignPendingOrders())
      .catch(() => {});

    const orders = await Order.find()
      .populate('sponsor', SPONSOR_FIELDS)
      .populate('performer', PERFORMER_FIELDS)
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error('[ALL ORDERS ERROR]', err.message);
    res.status(500).json({ message: 'Error fetching all orders' });
  }
});

/* ------------------------------------------------------------
   GET /my-orders/:sponsorId — LEGACY sponsor tracking list
   ------------------------------------------------------------ */
router.get('/my-orders/:sponsorId', async (req, res) => {
  try {
    const orders = await Order.find({ sponsor: req.params.sponsorId })
      .populate('performer', PERFORMER_FIELDS)
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error('[LEGACY MY ORDERS ERROR]', err.message);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

/* ------------------------------------------------------------
   GET /detail/:orderId — LEGACY single order detail
   ------------------------------------------------------------ */
router.get('/detail/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('sponsor', SPONSOR_FIELDS)
      .populate('performer', PERFORMER_FIELDS);
    if (!order) return res.status(404).json({ message: 'Order not found!' });
    res.status(200).json(order);
  } catch (err) {
    console.error('[ORDER DETAIL ERROR]', err.message);
    res.status(500).json({ message: 'Error fetching order details' });
  }
});

/* ------------------------------------------------------------
   PUT/POST /rate/:orderId — sponsor rates a completed order
   (both methods accepted so old and new pages keep working)
   ------------------------------------------------------------ */
async function rateHandler(req, res) {
  try {
    const { sponsorId, stars, feedback } = req.body || {};
    const order = await resolveOrderQuery(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found!' });

    // Ownership check only when a sponsorId is provided
    if (sponsorId) {
      const ownerKey = order.sponsor && order.sponsor._id ? String(order.sponsor._id) : String(order.sponsor || '');
      if (ownerKey !== String(sponsorId)) {
        return res.status(403).json({ message: 'Only the sponsor of this order can rate it.' });
      }
    }
    if (order.status !== 'Completed') {
      return res.status(400).json({ message: 'You can rate the performer after the order is Completed.' });
    }
    if (order.rating && order.rating.stars) {
      return res.status(400).json({ message: 'You have already rated this order.' });
    }

    const s = Number(stars);
    if (!s || s < 1 || s > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5 stars.' });
    }

    order.rating = {
      stars: s,
      feedback: String(feedback || '').slice(0, 500),
      ratedAt: new Date(),
    };
    await order.save();
    res.status(200).json({ message: 'Thank you for your feedback!', rating: order.rating });
  } catch (err) {
    console.error('[RATE ERROR]', err.message);
    res.status(500).json({ message: 'Error saving rating' });
  }
}
router.post('/rate/:orderId', rateHandler);
router.put('/rate/:orderId', rateHandler);

/* ------------------------------------------------------------
   GET /performer-stats/:performerId — stats for tracking cards
   ------------------------------------------------------------ */
router.get('/performer-stats/:performerId', async (req, res) => {
  try {
    const pid = req.params.performerId;
    if (!isValidObjectId(pid)) {
      return res.status(400).json({ message: 'Invalid performer id.' });
    }
    const orders = await Order.find({ performer: pid }).select('status rating').lean();
    const completedTasks = orders.filter((o) => o.status === 'Completed').length;
    const active = orders.filter((o) => o.status === 'Assigned' || o.status === 'In Progress').length;
    const rated = orders.filter((o) => o.rating && o.rating.stars);
    const avgStars = rated.length
      ? Math.round((rated.reduce((sum, o) => sum + o.rating.stars, 0) / rated.length) * 10) / 10
      : 0;
    res.status(200).json({
      avgStars,
      totalRatings: rated.length,
      completedTasks,
      active,
      avgRating: avgStars,
    });
  } catch (err) {
    console.error('[PERFORMER STATS ERROR]', err.message);
    res.status(500).json({ message: 'Error fetching performer stats' });
  }
});

/* ------------------------------------------------------------
   PUT /update-milestone/:orderId — performer marks a milestone
   complete with proof (photo URL + GPS + OCR result)
   ------------------------------------------------------------ */
router.put('/update-milestone/:orderId', async (req, res) => {
  try {
    const { milestoneIndex, proofUrl, proofLocation, proofOcr } = req.body || {};
    const order = await resolveOrderQuery(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found!' });

    const idx = Number(milestoneIndex);
    let siteName = '';
    if (Array.isArray(order.milestones) && order.milestones[idx]) {
      const ms = order.milestones[idx];

      if (proofUrl) ms.proofUrl = String(proofUrl);

      // GPS proof + automatic verification near holy sites
      const lat = proofLocation ? Number(proofLocation.lat) : NaN;
      const lng = proofLocation ? Number(proofLocation.lng) : NaN;
      const location = {};
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        location.lat = lat;
        location.lng = lng;
        for (const site of HARAM_LOCATIONS) {
          if (haversineKm(lat, lng, site.lat, site.lng) <= HARAM_RADIUS_KM) {
            siteName = site.name;
            break;
          }
        }
        if (siteName) {
          ms.autoVerified = true;
          ms.site = siteName;
        }
      }
      if (typeof proofLocation?.address === 'string' && proofLocation.address.trim()) {
        location.address = proofLocation.address.trim().slice(0, 1000);
      }
      if (proofLocation?.capturedAt) location.capturedAt = proofLocation.capturedAt;
      if (Object.keys(location).length) ms.proofLocation = location;

      // OCR proof verification result stored as JSON string
      if (proofOcr && typeof proofOcr === 'object' && proofOcr.suggestion) {
        const allowed = ['verified', 'weak-match', 'manual-review'];
        ms.proofOcr = JSON.stringify({
          text: String(proofOcr.text || '').slice(0, 1000),
          confidence: Number(proofOcr.confidence) || 0,
          matched: Array.isArray(proofOcr.matched) ? proofOcr.matched.slice(0, 10).map(String) : [],
          score: Number(proofOcr.score) || 0,
          suggestion: allowed.includes(proofOcr.suggestion) ? proofOcr.suggestion : 'manual-review',
          checkedAt: proofOcr.checkedAt || new Date().toISOString(),
        });
      }

      ms.status = 'Completed';
      ms.completedAt = new Date();
    }

    const milestones = Array.isArray(order.milestones) ? order.milestones : [];
    const allCompleted = milestones.length > 0 && milestones.every((m) => m.status === 'Completed');
    order.status = allCompleted ? 'Completed' : 'In Progress';
    await order.save();

    // v7: performer ka task complete hua -> capacity badli ->
    // busy notices reset (naya episode fresh message ke sath)
    if (allCompleted) {
      resetBusyNotices();
      await generateForCompletedOrder(order);
    }

    res.status(200).json({
      message: allCompleted
        ? 'All milestones completed! Order marked as Completed.'
        : siteName
          ? `Milestone verified at ${siteName}!`
          : 'Milestone updated successfully!',
      orderCompleted: allCompleted,
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter((m) => m.status === 'Completed').length,
      verifiedSite: siteName || null,
    });
  } catch (err) {
    console.error('[UPDATE MILESTONE ERROR]', err.message);
    res.status(500).json({ message: 'Error updating milestone' });
  }
});

/* ------------------------------------------------------------
   PUT /assign/:orderId — LEGACY admin manual assignment
   ------------------------------------------------------------ */
router.put('/assign/:orderId', async (req, res) => {
  try {
    const { performerId } = req.body || {};
    const order = await resolveOrderQuery(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found!' });

    if (order.status === 'In Progress' || order.status === 'Completed') {
      return res.status(400).json({ message: 'This order is already being performed. Cannot reassign.' });
    }
    if (!performerId || !isValidObjectId(performerId)) {
      return res.status(400).json({ message: 'Valid performerId is required.' });
    }

    // Performer can live in a Performer collection or the User collection
    let performer = null;
    const Performer = getModel('../models/Performer', 'Performer');
    if (Performer) performer = await Performer.findById(performerId).lean();
    if (!performer) {
      const User = getModel('../models/User', 'User');
      if (User) performer = await User.findById(performerId).lean();
    }
    if (!performer) return res.status(404).json({ message: 'Performer not found.' });

    await applyAssignment(order, performer);

    const updated = await Order.findById(order._id)
      .populate('performer', PERFORMER_FIELDS)
      .populate('sponsor', SPONSOR_FIELDS);
    res.status(200).json({ message: 'Performer assigned successfully!', order: updated });
  } catch (err) {
    console.error('[ASSIGN ERROR]', err.message);
    res.status(500).json({ message: 'Error assigning performer' });
  }
});

/* ------------------------------------------------------------
   PUT /accept-task/:orderId — performer accepts/starts a task
   ------------------------------------------------------------ */
router.put('/accept-task/:orderId', async (req, res) => {
  try {
    const { performerId } = req.body || {};
    const order = await resolveOrderQuery(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found!' });
    if (!performerId) return res.status(400).json({ message: 'performerId is required.' });

    const currentPerformer = order.performer && order.performer._id
      ? String(order.performer._id)
      : String(order.performer || '');
    if (currentPerformer && currentPerformer !== String(performerId)) {
      return res.status(400).json({ message: 'This task is assigned to another performer.' });
    }

    if (!currentPerformer) {
      const busy = await Order.findOne({ performer: performerId, status: 'In Progress' });
      if (busy) {
        return res.status(400).json({ message: 'You already have an active task. Complete it first.' });
      }
    }

    if (order.status === 'Completed') {
      return res.status(400).json({ message: 'This order is already completed.' });
    }

    order.performer = performerId;
    if (!order.assignedAt) order.assignedAt = new Date();
    order.status = 'In Progress';
    await order.save();

    const updated = await Order.findById(order._id)
      .populate('sponsor', SPONSOR_FIELDS)
      .populate('performer', PERFORMER_FIELDS);
    res.status(200).json({ message: 'Task started successfully!', order: updated });
  } catch (err) {
    console.error('[ACCEPT TASK ERROR]', err.message);
    res.status(500).json({ message: 'Error accepting task' });
  }
});

/* ------------------------------------------------------------
   PUT /:id/location — performer GPS ping + auto verification
   ------------------------------------------------------------ */
router.put('/:id/location', async (req, res) => {
  try {
    const order = await resolveOrderQuery(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const lat = Number(req.body && req.body.lat);
    const lng = Number(req.body && req.body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'lat and lng are required numbers.' });
    }

    order.currentLocation = { lat, lng, at: new Date() };

    // GPS auto-verification near holy sites
    let siteName = '';
    for (const site of HARAM_LOCATIONS) {
      if (haversineKm(lat, lng, site.lat, site.lng) <= HARAM_RADIUS_KM) {
        siteName = site.name;
        break;
      }
    }
    if (siteName && Array.isArray(order.milestones)) {
      let idx = -1;
      if (
        req.body &&
        typeof req.body.milestoneIndex === 'number' &&
        order.milestones[req.body.milestoneIndex]
      ) {
        idx = req.body.milestoneIndex;
      } else {
        idx = order.milestones.findIndex((m) => m && m.status === 'In Progress');
      }
      if (idx >= 0 && order.milestones[idx]) {
        const ms = order.milestones[idx];
        ms.proofLocation = { lat, lng };
        ms.autoVerified = true;
        ms.site = siteName;
        console.log(`[GPS VERIFY] ${order.orderCode} milestone "${ms.title}" auto-verified at ${siteName}`);
      }
    }

    await order.save();
    res.json({
      message: siteName ? `Location verified at ${siteName}.` : 'Location updated.',
      verifiedSite: siteName || null,
      order,
    });
  } catch (err) {
    console.error('[UPDATE LOCATION ERROR]', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

/* ------------------------------------------------------------
   GET /:id/location — live tracking data for an order
   ------------------------------------------------------------ */
router.get('/:id/location', async (req, res) => {
  try {
    const order = await resolveOrderQuery(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json({
      currentLocation: order.currentLocation || null,
      milestones: order.milestones || [],
      status: order.status,
    });
  } catch (err) {
    console.error('[GET LOCATION ERROR]', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

/* ------------------------------------------------------------
   GET /:id — single order by ObjectId OR IC-order-code
   NOTE: this catch-all route must stay LAST
   ------------------------------------------------------------ */
router.get('/:id', async (req, res) => {
  try {
    const order = await resolveOrderQuery(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json(order);
  } catch (err) {
    console.error('[GET ORDER ERROR]', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;