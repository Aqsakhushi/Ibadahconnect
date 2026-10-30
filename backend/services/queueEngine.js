// ============================================================
// IbadahConnect — backend/services/queueEngine.js (NEW FILE)
// ------------------------------------------------------------
// QUEUE BRAIN — Features: #2 Late-Run SLA, #4 Cancellation +
// Queue Shift, #5 Queue Position, #6 Deadline Risk Check.
//
// DESIGN RULES:
//  1. Order.js LOCKED hai — is file ki wajah se Order model ko
//     touch nahi karna. Field names schema se SNIFF hote hain
//     (Order.schema.paths) — chaahe asli naam kuch bhi ho,
//     engine khud detect kar leta hai.
//  2. Har save() try/catch me — purane orders me Cast errors
//     the; ek kharab order poori queue rok nahi sakta.
//  3. Timeline events (OrderTimeline.log) kabhi throw nahi
//     karte — audit trail fail ho to bhi queue chalti rahegi.
//  4. Ye file sirf MATH + DB shifts karti hai. Mail bhejna aur
//     auto-monitor loop File 4 (server.js v2.2) me hai.
//
// NOTE: Ye file standalone-safe hai — sirf require hone par
// field map print karti hai. Koi route abhi use nahi karta
// jab tak File 3/4 wire na karein.
// ============================================================

const Order = require('../models/Order');
const OrderTimeline = require('../models/OrderTimeline');
const { EVENTS } = OrderTimeline;

const DAY_MS = 24 * 60 * 60 * 1000;

// ------------------------------------------------------------
// CONFIG — tuning sirf yahan se
// ------------------------------------------------------------
const CONFIG = {
  DAYS_PER_MILESTONE: 1,   // ETA estimate: har milestone ~1 din
  STUCK_AFTER_HOURS: 24,   // Feature #3: itne ghante progress nahi -> stuck
  SLA_RENOTIFY_HOURS: 72,  // Feature #2: sponsor mail rate-limit (3 din)
  RISK_RENOTIFY_HOURS: 24, // Feature #6: risk flag dedup window
};

// Tolerant status sets — DB me status ka exact wording jo bhi ho
// ('In Progress'/'Active'/'Started'...), lowercase match karega.
const STATUS_SETS = {
  active: ['active', 'in progress', 'inprogress', 'started', 'running', 'ongoing'],
  scheduled: ['scheduled', 'booked', 'assigned'],
  completed: ['completed', 'complete', 'done', 'finished'],
  cancelled: ['cancelled', 'canceled', 'rejected'],
};

// ------------------------------------------------------------
// FIELD DETECTION — Order.js ka naam na badalte hain, na dekhte.
// Pehla jo candidate schema me maujood ho, wahi asli field hai.
// ------------------------------------------------------------
function _firstPath(candidates) {
  for (const c of candidates) {
    if (Order.schema && Order.schema.paths[c]) return c;
  }
  return null;
}

const FIELDS = {
  performer: _firstPath(['performer', 'assignedPerformer', 'performerId', 'assignedTo']),
  status: _firstPath(['status', 'orderStatus', 'state']),
  scheduledDate: _firstPath(['scheduledDate', 'scheduledStart', 'scheduledFor', 'startDate', 'scheduledAt', 'startAt']),
  neededBy: _firstPath(['neededBy', 'neededDate', 'deadline', 'requiredBy', 'dueDate', 'deliverBy']),
};

console.log('[QUEUE ENGINE] Field map -> performer:', FIELDS.performer || 'NOT FOUND',
  '| status:', FIELDS.status || 'NOT FOUND',
  '| scheduledDate:', FIELDS.scheduledDate || 'NOT FOUND',
  '| neededBy:', FIELDS.neededBy || 'NOT FOUND');
if (!FIELDS.performer || !FIELDS.status) {
  console.log('[QUEUE ENGINE] WARNING: critical field missing — queue features degrade hongi. Order.js ke field names check karo.');
}

// ------------------------------------------------------------
// SMALL HELPERS
// ------------------------------------------------------------
function statusOf(o) {
  if (!FIELDS.status) return '';
  return String(o[FIELDS.status] || '').toLowerCase().trim();
}
function statusIn(o, set) {
  return set.includes(statusOf(o));
}
function performerOf(o) {
  if (!FIELDS.performer) return null;
  const v = o[FIELDS.performer];
  if (!v) return null;
  if (typeof v === 'object' && v._id) return v._id; // populated case
  return v;
}
function dateOf(o, field) {
  if (!field) return null;
  const v = o[field];
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
// ObjectId me timestamp hota hai — createdAt field na ho to bhi
// order ki date mil jati hai.
function idTimestamp(o) {
  return o && o._id && typeof o._id.getTimestamp === 'function'
    ? o._id.getTimestamp()
    : new Date();
}
function addDays(d, n) {
  return new Date(d.getTime() + n * DAY_MS);
}
// Order duration: explicit field ho to wohi, warna milestones x 1 din
function orderDurationDays(o) {
  for (const k of ['durationDays', 'estimatedDays', 'etaDays']) {
    const v = Number(o[k]);
    if (Number.isFinite(v) && v > 0) return v;
  }
  const n = Array.isArray(o.milestones) ? o.milestones.length : 0;
  return Math.max(1, n) * CONFIG.DAYS_PER_MILESTONE;
}
// Milestone par last progress ki date (jo bhi date-field mile)
function milestoneDoneDate(m) {
  if (!m) return null;
  for (const k of ['completedAt', 'completedDate', 'completedOn', 'verifiedAt', 'date']) {
    if (m[k]) {
      const d = new Date(m[k]);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}
function lastProgressAt(o) {
  let latest = null;
  (o.milestones || []).forEach((m) => {
    const d = milestoneDoneDate(m);
    if (d && (!latest || d > latest)) latest = d;
  });
  if (o.updatedAt) {
    const u = new Date(o.updatedAt);
    if (!isNaN(u.getTime()) && (!latest || u > latest)) latest = u;
  }
  return latest || idTimestamp(o);
}
function byQueueOrder(a, b) {
  const da = dateOf(a, FIELDS.scheduledDate) || idTimestamp(a);
  const db = dateOf(b, FIELDS.scheduledDate) || idTimestamp(b);
  return da - db;
}
async function _resolveOrder(x) {
  if (!x) return null;
  if (x._id) return Order.findById(x._id);
  return Order.findById(x);
}
async function _saveDoc(doc, tag) {
  try {
    await doc.save();
    return true;
  } catch (e) {
    console.log(`[QUEUE ENGINE] save failed (${tag}):`, e.message);
    return false;
  }
}

// ------------------------------------------------------------
// ETA PROJECTION — queue ko chal kar ETA nikalta hai.
// Har order: start = max(cursor, apni scheduled date),
// end = start + duration. Cursor aage badhta jata hai.
// ------------------------------------------------------------
function projectQueue(orderedOrders, fromDate) {
  let cursor = fromDate ? new Date(fromDate) : new Date();
  return orderedOrders.map((o) => {
    const dur = orderDurationDays(o);
    const own = dateOf(o, FIELDS.scheduledDate);
    const start = own && own.getTime() > cursor.getTime() ? own : new Date(cursor);
    const end = addDays(start, dur);
    cursor = end;
    return { order: o, start, end, durationDays: dur };
  });
}

// Performer ki poori open queue (pehle Active, phir Scheduled,
// dono date-sorted) with projected start/end rows.
async function _orderedQueueRows(performerId) {
  if (!performerId || !FIELDS.performer) return [];
  const all = await Order.find({ [FIELDS.performer]: performerId }).lean();
  const open = all.filter((o) => statusIn(o, STATUS_SETS.active) || statusIn(o, STATUS_SETS.scheduled));
  const active = open.filter((o) => statusIn(o, STATUS_SETS.active)).sort(byQueueOrder);
  const sched = open.filter((o) => statusIn(o, STATUS_SETS.scheduled)).sort(byQueueOrder);
  return projectQueue([...active, ...sched], new Date());
}

// ------------------------------------------------------------
// FEATURE #5: QUEUE POSITION
// Sponsor ko exact message: "Queue position #2 — 1 task ahead"
// ------------------------------------------------------------
async function getQueuePosition(orderId) {
  const o = await Order.findById(orderId).lean();
  if (!o) return null;

  const st = statusOf(o);
  if (statusIn(o, STATUS_SETS.completed) || statusIn(o, STATUS_SETS.cancelled)) {
    return { position: null, aheadCount: 0, eta: null, message: `Order is ${st || 'closed'} — no queue position.` };
  }
  const pid = performerOf(o);
  if (!pid) {
    return { position: null, aheadCount: 0, eta: null, message: 'Performer not assigned yet.' };
  }
  const rows = await _orderedQueueRows(pid);
  const idx = rows.findIndex((r) => String(r.order._id) === String(o._id));
  if (idx === -1) {
    return { position: null, aheadCount: 0, eta: null, message: 'Order is not in the active queue.' };
  }
  const ahead = idx;
  const eta = rows[idx].end;
  const message = ahead === 0
    ? 'Queue position #1 — your order is being performed now.'
    : `Queue position #${idx + 1} — ${ahead} task${ahead > 1 ? 's' : ''} ahead of you.`;
  return { position: idx + 1, aheadCount: ahead, eta, projectedStart: rows[idx].start, message };
}

// ------------------------------------------------------------
// FEATURE #6: DEADLINE RISK CHECK
// "Needed by" date ke against projected completion compare.
// Payment se PEHLE route isko call karega (File 3).
// Risk flag bhi log hota hai (24h dedup — spam nahi).
// ------------------------------------------------------------
async function assessDeadlineRisk(orderOrId, neededByOverride) {
  const found = await _resolveOrder(orderOrId);
  const o = found ? await Order.findById(found._id).lean() : null;
  if (!o) return { atRisk: false, message: 'Order not found.' };

  const neededBy = neededByOverride ? new Date(neededByOverride) : dateOf(o, FIELDS.neededBy);
  const posInfo = await getQueuePosition(o._id);
  const eta = (posInfo && posInfo.eta) || addDays(new Date(), orderDurationDays(o));

  let atRisk = false;
  let daysShort = 0;
  if (neededBy && eta.getTime() > neededBy.getTime()) {
    atRisk = true;
    daysShort = Math.ceil((eta.getTime() - neededBy.getTime()) / DAY_MS);
  }

  // Persistent flag/clear trail (dedup ke sath — spam nahi)
  if (atRisk) {
    const recent = await wasNotifiedWithin(o._id, EVENTS.DEADLINE_RISK, CONFIG.RISK_RENOTIFY_HOURS);
    if (!recent) {
      await OrderTimeline.log({
        orderId: o._id,
        event: EVENTS.DEADLINE_RISK,
        title: 'Deadline risk flagged',
        description: `Projected completion ${eta.toDateString()} is ${daysShort} day(s) after Needed-by date.`,
        meta: { neededBy, projectedCompletion: eta, daysShort },
        visibility: 'admin',
      });
    }
  } else {
    const lastRisk = await lastEventAt(o._id, EVENTS.DEADLINE_RISK);
    const lastClear = await lastEventAt(o._id, EVENTS.DEADLINE_RISK_CLEARED);
    if (lastRisk && (!lastClear || lastClear < lastRisk)) {
      await OrderTimeline.log({
        orderId: o._id,
        event: EVENTS.DEADLINE_RISK_CLEARED,
        title: 'Deadline risk cleared',
        description: `Projected completion ${eta.toDateString()} is now within the Needed-by date.`,
        meta: { neededBy, projectedCompletion: eta },
        visibility: 'admin',
      });
    }
  }

  const message = !neededBy
    ? 'No Needed-by date on this order — nothing at risk.'
    : atRisk
      ? `Projected completion ${eta.toDateString()} is ${daysShort} day(s) after your Needed-by date (${neededBy.toDateString()}).`
      : `On track — projected completion ${eta.toDateString()} is before your Needed-by date.`;

  return { atRisk, daysShort, neededBy, projectedCompletion: eta, position: posInfo, message };
}

// ------------------------------------------------------------
// CORE: QUEUE RECOMPUTE CHAIN
// direction 'earlier' -> cancellation ke baad dates peechay
// direction 'later'   -> delay ke baad dates aagay
// Sirf >= 1 din ka farq ho to hi move hota hai (chhoti rounding
// edits se bachne ke liye). Har move ka QUEUE_SHIFTED event.
// ------------------------------------------------------------
async function _recomputeChain(performerId, cursorStart, direction, reason) {
  const shifted = [];
  if (!performerId || !FIELDS.scheduledDate) return { shifted, note: 'performer/date field missing' };

  const docs = (await Order.find({ [FIELDS.performer]: performerId }))
    .filter((o) => statusIn(o, STATUS_SETS.scheduled))
    .sort(byQueueOrder);

  let cursor = new Date(cursorStart);
  for (const o of docs) {
    const dur = orderDurationDays(o);
    const own = dateOf(o, FIELDS.scheduledDate);
    if (!own) {
      cursor = addDays(cursor, dur);
      continue;
    }
    const diff = own.getTime() - cursor.getTime();
    const shouldMove = direction === 'earlier' ? diff >= DAY_MS : -diff >= DAY_MS;

    if (shouldMove) {
      const from = own;
      o[FIELDS.scheduledDate] = new Date(cursor);
      const ok = await _saveDoc(o, `shift ${direction} order ${o._id}`);
      if (ok) {
        shifted.push({ orderId: o._id, from, to: new Date(cursor) });
        await OrderTimeline.log({
          orderId: o._id,
          event: EVENTS.QUEUE_SHIFTED,
          title: direction === 'earlier' ? 'Order date moved earlier' : 'Order date pushed later',
          description: `Queue re-adjusted (reason: ${reason}). New date: ${cursor.toDateString()}.`,
          meta: { from, to: new Date(cursor), direction, reason },
        });
      }
      cursor = addDays(cursor, dur);
    } else {
      cursor = addDays(new Date(Math.max(cursor.getTime(), own.getTime())), dur);
    }
  }
  return { shifted };
}

// FEATURE #4: Sponsor ne Scheduled order cancel kiya -> baqi
// scheduled orders ki dates peechay khisak jati hain.
async function shiftQueueAfterCancellation(cancelledOrderOrId) {
  const found = await _resolveOrder(cancelledOrderOrId);
  const o = found ? found.toObject ? found.toObject() : found : null;
  if (!o) return { shifted: [], note: 'order not found' };
  const freedStart = dateOf(o, FIELDS.scheduledDate) || new Date();
  return _recomputeChain(performerOf(o), freedStart, 'earlier', 'cancellation');
}

// FEATURE #2 (half): Active order late hai -> us performer ki
// scheduled queue aagay push hoti hai.
async function pushQueueForDelay(delayedOrderOrId, daysLate) {
  const found = await _resolveOrder(delayedOrderOrId);
  const o = found ? found.toObject ? found.toObject() : found : null;
  if (!o) return { shifted: [], note: 'order not found' };
  const start = dateOf(o, FIELDS.scheduledDate) || idTimestamp(o);
  const expectedEnd = addDays(start, orderDurationDays(o));
  const newEnd = addDays(expectedEnd, Math.max(0, Number(daysLate) || 0));
  return _recomputeChain(performerOf(o), newEnd, 'later', 'delay');
}

// ------------------------------------------------------------
// FEATURE #2 DETECTION: jin Active orders ki ETA nikal gayi
// (canNotify = 72h rate-limit window ke andar mail nahi gaya)
// ------------------------------------------------------------
async function findLateOrders() {
  if (!FIELDS.status) return [];
  const all = await Order.find({}).lean();
  const now = new Date();
  const rows = [];
  for (const o of all) {
    if (!statusIn(o, STATUS_SETS.active)) continue;
    const start = dateOf(o, FIELDS.scheduledDate) || idTimestamp(o);
    const expectedEnd = addDays(start, orderDurationDays(o));
    if (expectedEnd.getTime() >= now.getTime()) continue;
    const daysLate = Math.ceil((now.getTime() - expectedEnd.getTime()) / DAY_MS);
    const canNotify = !(await wasNotifiedWithin(o._id, EVENTS.SLA_LATE, CONFIG.SLA_RENOTIFY_HOURS));
    rows.push({ order: o, expectedEnd, daysLate, canNotify });
  }
  return rows;
}

// ------------------------------------------------------------
// FEATURE #3 DETECTION: 24h se zyada progress-quiet Active orders
// (Monitor inhe nudge + escalate karega; active order kabhi
// auto-reassign NAHI hoga — fiqh: ihram continuity — wo rule
// File 4 me hai, yahan sirf detection hai.)
// ------------------------------------------------------------
async function findStuckOrders() {
  if (!FIELDS.status) return [];
  const all = await Order.find({}).lean();
  const now = new Date();
  const rows = [];
  for (const o of all) {
    if (!statusIn(o, STATUS_SETS.active)) continue;
    const last = lastProgressAt(o);
    const hoursStuck = (now.getTime() - last.getTime()) / (60 * 60 * 1000);
    if (hoursStuck < CONFIG.STUCK_AFTER_HOURS) continue;
    const canEscalate = !(await wasNotifiedWithin(o._id, EVENTS.STUCK_ESCALATED, CONFIG.STUCK_AFTER_HOURS));
    rows.push({ order: o, lastProgressAt: last, hoursStuck: Math.floor(hoursStuck), canEscalate });
  }
  return rows;
}

// ------------------------------------------------------------
// Admin dashboard / mails ke liye summary
// ------------------------------------------------------------
async function queueSummary(performerId) {
  const rows = await _orderedQueueRows(performerId);
  return {
    performerId,
    total: rows.length,
    activeCount: rows.filter((r) => statusIn(r.order, STATUS_SETS.active)).length,
    scheduled: rows
      .filter((r) => statusIn(r.order, STATUS_SETS.scheduled))
      .map((r) => ({
        orderId: r.order._id,
        title: r.order.title || r.order.packageTitle || 'Order',
        start: r.start,
        end: r.end,
      })),
  };
}

// ------------------------------------------------------------
// TIMELINE HELPERS (rate-limiting ke liye)
// ------------------------------------------------------------
async function lastEventAt(orderId, event) {
  const ev = await OrderTimeline.findOne({ order: orderId, event }).sort({ createdAt: -1 }).lean();
  return ev ? ev.createdAt : null;
}
async function wasNotifiedWithin(orderId, event, hours) {
  const at = await lastEventAt(orderId, event);
  if (!at) return false;
  return Date.now() - new Date(at).getTime() < hours * 60 * 60 * 1000;
}

module.exports = {
  CONFIG,
  FIELDS,
  STATUS_SETS,
  getQueuePosition,            // Feature #5
  assessDeadlineRisk,          // Feature #6
  shiftQueueAfterCancellation, // Feature #4
  pushQueueForDelay,           // Feature #2 (queue re-adjust half)
  findLateOrders,              // Feature #2 (detection)
  findStuckOrders,             // Feature #3 (detection)
  queueSummary,
  lastEventAt,
  wasNotifiedWithin,
};