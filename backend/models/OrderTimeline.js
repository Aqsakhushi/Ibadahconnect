// ============================================================
// IbadahConnect — backend/models/OrderTimeline.js (NEW FILE)
// ------------------------------------------------------------
// FEATURE #1 (Aaj): ORDER TIMELINE — permanent audit trail.
// Har order ki poori zindagi yahan event-by-event record hoti hai:
//   created -> payment -> assigned -> scheduled -> started ->
//   milestones -> completed / cancelled / flagged.
// Sponsor ka "Order Timeline" view isi collection se render hoga
// (GET /api/queue/timeline/:orderId — File 3 me aayega).
//
// DESIGN RULES:
//  1. Order.js LOCKED hai — ye ALAG collection hai, Order model
//     ko touch karne ki zaroorat hi nahi.
//  2. Timeline write kabhi business flow break nahi karega:
//     log() static apne errors khud swallow karta hai.
//  3. Immutable history: documents kabhi update nahi hote —
//     audit trail ka matlab hi hai "jo hua, so hua".
//  4. visibility field decide karta hai kaun sa event kisko
//     dikhega: 'all' | 'sponsor' | 'performer' | 'admin'.
// ============================================================

const mongoose = require('mongoose');

// ------------------------------------------------------------
// EVENT CATALOGUE — complete list of timeline events.
// Features #1-#6 (Aaj wale) + future P1/P2 sab isi enum me.
// ------------------------------------------------------------
const TIMELINE_EVENTS = {
  // -- Feature #1: lifecycle audit trail --
  ORDER_CREATED: 'ORDER_CREATED',
  PAYMENT_SUBMITTED: 'PAYMENT_SUBMITTED',
  PAYMENT_VERIFIED: 'PAYMENT_VERIFIED',
  PERFORMER_ASSIGNED: 'PERFORMER_ASSIGNED',
  ORDER_SCHEDULED: 'ORDER_SCHEDULED',
  ORDER_STARTED: 'ORDER_STARTED',
  MILESTONE_STARTED: 'MILESTONE_STARTED',
  MILESTONE_COMPLETED: 'MILESTONE_COMPLETED',
  PROOF_UPLOADED: 'PROOF_UPLOADED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',

  // -- Feature #2: Late-Run SLA notice --
  SLA_LATE: 'SLA_LATE',
  QUEUE_READJUSTED: 'QUEUE_READJUSTED',

  // -- Feature #3: Stuck-Order Protection --
  STUCK_DETECTED: 'STUCK_DETECTED',
  STUCK_NUDGED: 'STUCK_NUDGED',
  STUCK_ESCALATED: 'STUCK_ESCALATED',

  // -- Feature #4: Cancellation + Queue Shift --
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  QUEUE_SHIFTED: 'QUEUE_SHIFTED',

  // -- Feature #6: Deadline Risk Check --
  DEADLINE_RISK: 'DEADLINE_RISK',
  DEADLINE_RISK_CLEARED: 'DEADLINE_RISK_CLEARED',

  // -- Generic --
  NOTE: 'NOTE',
};

const OrderTimelineSchema = new mongoose.Schema(
  {
    // Parent order — har event kisi na kisi order ka hai
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },

    // Event type — enum se bahar koi cheez save nahi hogi
    event: {
      type: String,
      enum: Object.values(TIMELINE_EVENTS),
      required: true,
    },

    // Human-readable headline (frontend par yahi dikhta hai)
    // e.g. "Milestone 3 completed: Sai", "Order placed"
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },

    // Optional detail line (title ke neeche chhoti explanation)
    description: {
      type: String,
      trim: true,
      maxlength: 600,
      default: '',
    },

    // Kis ne kiya: system (auto), sponsor, performer, admin
    actorRole: {
      type: String,
      enum: ['system', 'sponsor', 'performer', 'admin'],
      default: 'system',
    },

    // Specific user (optional — system events me null)
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Agar event kisi milestone se juda hai to uska step number
    // (Order.milestones[].step — 1-based)
    milestoneStep: {
      type: Number,
      default: null,
    },

    // Flexible extra data: { oldStatus, newStatus, daysLate,
    // queueShiftDays, riskPercent, ... } — schema locked nahi
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Kaun dekh sakta hai
    visibility: {
      type: String,
      enum: ['all', 'sponsor', 'performer', 'admin'],
      default: 'all',
    },
  },
  // Immutable trail: sirf createdAt, updatedAt ki zaroorat nahi
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Sponsor timeline = order ki chronological history
OrderTimelineSchema.index({ order: 1, createdAt: 1 });
// Admin/monitor queries = recent events of one type
OrderTimelineSchema.index({ event: 1, createdAt: -1 });

// ------------------------------------------------------------
// STATIC: log() — ONE-CALL event writer. NEVER throws.
// Timeline ka write fail ho jaye to sirf console note —
// order / auto-release / checkout flow bilkul na ruke.
// ------------------------------------------------------------
OrderTimelineSchema.statics.log = async function (entry) {
  try {
    if (!entry || !entry.orderId || !entry.event) {
      console.log('[TIMELINE] log skipped: orderId/event missing');
      return null;
    }
    const doc = await this.create({
      order: entry.orderId,
      event: entry.event,
      title: entry.title || String(entry.event),
      description: entry.description || '',
      actorRole: entry.actorRole || 'system',
      actor: entry.actorId || null,
      milestoneStep:
        typeof entry.milestoneStep === 'number' ? entry.milestoneStep : null,
      meta: entry.meta || {},
      visibility: entry.visibility || 'all',
    });
    return doc;
  } catch (err) {
    console.log('[TIMELINE] write skipped:', err.message);
    return null;
  }
};

// ------------------------------------------------------------
// STATIC: forOrder() — viewer ke hisaab se filtered timeline.
//   viewerRole 'admin'    -> sab kuch
//   'sponsor'/'performer' -> 'all' + apna wala
//   koi aur / guest       -> sirf 'all'
// Return: lean plain objects, oldest-first (chronological).
// ------------------------------------------------------------
OrderTimelineSchema.statics.forOrder = function (orderId, viewerRole) {
  const query = { order: orderId };
  if (viewerRole === 'sponsor' || viewerRole === 'performer') {
    query.visibility = { $in: ['all', viewerRole] };
  } else if (viewerRole !== 'admin') {
    query.visibility = 'all';
  }
  return this.find(query).sort({ createdAt: 1 }).lean();
};

const OrderTimeline = mongoose.model('OrderTimeline', OrderTimelineSchema);

module.exports = OrderTimeline;
module.exports.EVENTS = TIMELINE_EVENTS;
