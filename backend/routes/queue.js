// ============================================================
// IbadahConnect — backend/routes/queue.js (NEW FILE)
// ------------------------------------------------------------
// QUEUE + TIMELINE API — sponsor/performer/admin endpoints.
//
//   GET  /api/queue/timeline/:orderId   -> Feature #1 audit trail
//   GET  /api/queue/position/:orderId   -> Feature #5 queue position
//   POST /api/queue/deadline-check      -> Feature #6 Needed-by risk
//   GET  /api/queue/summary             -> performer queue (performer/admin)
//
// DESIGN RULES:
//  1. Order.js LOCKED — sirf reads + engine calls, koi schema edit nahi.
//  2. Self-contained auth: is route ka apna JWT middleware hai,
//     taake middleware/auth.js ka exact export shape matter na kare.
//  3. Ownership defensive check — sponsor field ka naam jo bhi ho
//     (sponsor/user/createdBy...) candidates se match hoga.
//  4. Mailer defensive — utils/sendEmail jo bhi shape me ho,
//     try-chain se call hoga; fail ho to sirf console note.
// ============================================================

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const Order = require('../models/Order');
const User = require('../models/User');
const Package = require('../models/Package');
const OrderTimeline = require('../models/OrderTimeline');
const queueEngine = require('../services/queueEngine');
const { EVENTS } = OrderTimeline;

const DAY_MS = 24 * 60 * 60 * 1000;

// ------------------------------------------------------------
// SELF-CONTAINED AUTH (JWT) — Bearer token -> req.user
// Payload keys tolerant: id | _id | userId
// ------------------------------------------------------------
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not authorized — token missing' });
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'ibadah_secret');
    } catch (e) {
      return res.status(401).json({ message: 'Not authorized — invalid token' });
    }
    const userId = payload.id || payload._id || payload.userId;
    if (!userId) return res.status(401).json({ message: 'Not authorized — bad token payload' });
    const user = await User.findById(userId).select('firstName lastName email role');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(500).json({ message: 'Auth failed', error: e.message });
  }
}

// ------------------------------------------------------------
// ACCESS HELPERS — field names defensive
// ------------------------------------------------------------
const SPONSOR_FIELDS = ['sponsor', 'sponsorId', 'user', 'userId', 'createdBy', 'customer', 'owner'];

function isOwner(order, userId) {
  for (const f of SPONSOR_FIELDS) {
    if (order[f] != null) {
      const v = order[f]._id || order[f];
      if (String(v) === String(userId)) return true;
    }
  }
  return false;
}

function isAssignedPerformer(order, userId) {
  const f = queueEngine.FIELDS.performer;
  if (!f) return false;
  const v = order[f];
  if (!v) return false;
  return String(v._id || v) === String(userId);
}

// returns 'admin' | 'owner' | 'performer' | null
function accessLevel(order, user) {
  const role = String(user.role || '').toLowerCase();
  if (role === 'admin') return 'admin';
  if (isAssignedPerformer(order, user._id)) return 'performer';
  if (isOwner(order, user._id)) return 'owner';
  return null;
}

// ------------------------------------------------------------
// MAILER — defensive (utils/sendEmail ka shape jo bhi ho)
// ------------------------------------------------------------
let _mailer = null;
try {
  const m = require('../utils/sendEmail');
  _mailer = typeof m === 'function' ? m : (m.sendEmail || m.default || null);
} catch (e) {
  _mailer = null;
}

async function mailAdmin(subject, body) {
  const to = process.env.ADMIN_EMAIL || 'aqsa@ibadah.com';
  if (typeof _mailer !== 'function') {
    console.log('[QUEUE ROUTE] mailer unavailable — admin mail skipped:', subject);
    return;
  }
  const attempts = [
    () => _mailer({ to, subject, html: body }),
    () => _mailer({ email: to, subject, message: body }),
    () => _mailer(to, subject, body),
  ];
  for (const attempt of attempts) {
    try { await attempt(); return; } catch (e) { /* try next shape */ }
  }
  console.log('[QUEUE ROUTE] admin mail failed (all shapes):', subject);
}

// ------------------------------------------------------------
// DRAFT DURATION — order banne se pehle package-level estimate
// ------------------------------------------------------------
function draftDurationDays(pkg) {
  const c = String(pkg.category || pkg.title || '').toLowerCase();
  if (c.includes('hajj')) return 14;
  if (c.includes('umrah')) return 5;
  if (c.includes('donation')) return 1;
  return 7;
}

// ============================================================
// FEATURE #1: ORDER TIMELINE
// GET /api/queue/timeline/:orderId
// ============================================================
router.get('/timeline/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const access = accessLevel(order, req.user);
    if (!access) return res.status(403).json({ message: 'Not allowed to view this order' });

    const viewerRole = access === 'admin' ? 'admin' : access === 'performer' ? 'performer' : 'sponsor';
    const timeline = await OrderTimeline.forOrder(order._id, viewerRole);
    const position = await queueEngine.getQueuePosition(order._id);

    res.json({ orderId: order._id, timeline, position });
  } catch (e) {
    res.status(500).json({ message: 'Timeline failed', error: e.message });
  }
});

// ============================================================
// FEATURE #5: QUEUE POSITION
// GET /api/queue/position/:orderId
// ============================================================
router.get('/position/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!accessLevel(order, req.user)) return res.status(403).json({ message: 'Not allowed to view this order' });

    const position = await queueEngine.getQueuePosition(order._id);
    res.json({ orderId: order._id, position });
  } catch (e) {
    res.status(500).json({ message: 'Queue position failed', error: e.message });
  }
});

// ============================================================
// FEATURE #6: DEADLINE RISK CHECK (payment se PEHLE)
// POST /api/queue/deadline-check
// body: { orderId }  YA  { packageId }  + optional { neededBy }
// ============================================================
router.post('/deadline-check', protect, async (req, res) => {
  try {
    const { orderId, packageId, neededBy } = req.body || {};
    let when = null;
    if (neededBy) {
      when = new Date(neededBy);
      if (isNaN(when.getTime())) {
        return res.status(400).json({ message: 'neededBy must be a valid date (YYYY-MM-DD)' });
      }
    }

    // Mode A: real order (order pehle ban chuka hai)
    if (orderId) {
      const order = await Order.findById(orderId).lean();
      if (!order) return res.status(404).json({ message: 'Order not found' });
      if (!accessLevel(order, req.user)) return res.status(403).json({ message: 'Not allowed' });

      // Admin mail sirf first-flag par (24h dedup — engine bhi yahi
      // window use karta hai, isliye mail bhi rate-limited rahega)
      const firstFlag = !(await queueEngine.wasNotifiedWithin(orderId, EVENTS.DEADLINE_RISK, 24));
      const result = await queueEngine.assessDeadlineRisk(orderId, when);

      if (result.atRisk && firstFlag) {
        await mailAdmin(
          'IbadahConnect: Deadline risk flagged',
          `<p>Order <b>${order._id}</b> is at deadline risk.</p>
           <p>Needed by: <b>${result.neededBy ? result.neededBy.toDateString() : 'n/a'}</b><br/>
           Projected completion: <b>${result.projectedCompletion.toDateString()}</b><br/>
           Short by: <b>${result.daysShort} day(s)</b></p>`
        );
      }
      return res.json({ ...result, mode: 'order' });
    }

    // Mode B: draft (checkout par, order banne se pehle)
    if (packageId) {
      const pkg = await Package.findById(packageId).lean();
      if (!pkg) return res.status(404).json({ message: 'Package not found' });
      if (!when) return res.status(400).json({ message: 'neededBy is required for package draft check' });

      const days = draftDurationDays(pkg);
      const projected = new Date(Date.now() + days * DAY_MS);
      const atRisk = projected.getTime() > when.getTime();
      const daysShort = atRisk ? Math.ceil((projected.getTime() - when.getTime()) / DAY_MS) : 0;

      const message = atRisk
        ? `Heads-up: ${pkg.title} usually takes about ${days} day(s) — projected completion ${projected.toDateString()} is ${daysShort} day(s) after your Needed-by date (${when.toDateString()}).`
        : `On track — ${pkg.title} usually takes about ${days} day(s); projected completion ${projected.toDateString()} is before your Needed-by date.`;

      return res.json({
        atRisk,
        daysShort,
        projectedCompletion: projected,
        neededBy: when,
        message,
        mode: 'draft',
        package: { _id: pkg._id, title: pkg.title },
      });
    }

    return res.status(400).json({ message: 'orderId or packageId required' });
  } catch (e) {
    res.status(500).json({ message: 'Deadline check failed', error: e.message });
  }
});

// ============================================================
// QUEUE SUMMARY — performer apni queue, admin kisi bhi performer ki
// GET /api/queue/summary                      (performer)
// GET /api/queue/summary?performerId=xxxx     (admin)
// ============================================================
router.get('/summary', protect, async (req, res) => {
  try {
    const role = String(req.user.role || '').toLowerCase();
    let pid = null;
    if (role === 'performer') pid = req.user._id;
    else if (role === 'admin') pid = req.query.performerId || null;
    if (!pid) return res.status(403).json({ message: 'Performer or admin only' });

    const summary = await queueEngine.queueSummary(pid);
    res.json(summary);
  } catch (e) {
    res.status(500).json({ message: 'Queue summary failed', error: e.message });
  }
});

module.exports = router;