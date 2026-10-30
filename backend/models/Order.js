/**
 * ============================================================
 *  IbadahConnect — backend/models/Order.js   (v2.2 — MONGOOSE 9 FIX)
 * ------------------------------------------------------------
 *  ROOT CAUSE (finally proven by a real DB test):
 *  This project runs Mongoose 9.6.3 + Kareem 3.x.
 *  In Mongoose 9, pre('save') hooks receive ONLY [options] —
 *  there is NO `next` callback anymore. Any hook written in the
 *  old Mongoose 8 style `function (next) { ... next(); }`
 *  crashes every save with:
 *      "TypeError: next is not a function"
 *
 *  THE FIX: write hooks the Mongoose 9 way — no `next` at all.
 *  Sync hooks just run; async hooks return a promise.
 *
 *  All fields match exactly what routes/orders.js (v6) uses.
 * ============================================================
 */

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    // IC-2026-123456 — generated in the pre-save hook below.
    // No default: an empty string would break the unique index.
    orderCode: { type: String },

    // WHO: sponsor = logged-in buyer, performer = assigned User (role: Performer)
    sponsor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: { type: Date, default: null },

    // WHAT was ordered
    serviceType: { type: String, default: 'Umrah' },
    packageTitle: { type: String, default: '' },
    price: { type: Number, required: true, default: 0 },
    hadiyah: { type: Number, default: 0 },
    paymentMethod: { type: String, default: 'JazzCash' },

    // WHERE / how to contact the sponsor
    city: { type: String, default: '' },
    notes: { type: String, default: '' },
    contactEmail: { type: String, default: '', lowercase: true, trim: true },

    // EMAIL VERIFICATION FLOW (checkout -> verify link -> auto-assign)
    isEmailVerified: { type: Boolean, default: false },

    // STATUS
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Progress', 'Completed'],
      default: 'Pending',
    },

    // PROGRESS MILESTONES (proof + GPS + OCR verification)
    milestones: [
      {
        title: { type: String, default: '' },
        step: { type: Number, default: 0 },
        description: { type: String, default: '' },
        status: {
          type: String,
          enum: ['Pending', 'In Progress', 'Completed'],
          default: 'Pending',
        },
        completedAt: { type: Date, default: null },
        proofUrl: { type: String, default: '' },
        proofOcr: { type: String, default: '' },
        proofLocation: {
          lat: { type: Number, default: null },
          lng: { type: Number, default: null },
        },
        autoVerified: { type: Boolean, default: false },
        site: { type: String, default: '' },
      },
    ],

    // LIVE TRACKING (performer GPS pings)
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      at: { type: Date, default: null },
    },
    certificateUrl: { type: String, default: '' },

    // SPONSOR RATING (after order is Completed)
    rating: {
      stars: { type: Number, min: 1, max: 5, default: null },
      feedback: { type: String, default: '' },
      ratedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

/* ============================================================
   PRE-SAVE HOOK — generate the human-friendly order code.
   MONGOOSE 9 STYLE: NO `next` parameter. Kareem 3 calls hooks
   without a next callback — declaring function(next) and
   calling next() is what caused "next is not a function".
   ============================================================ */
orderSchema.pre('save', function () {
  if (!this.orderCode) {
    const year = new Date().getFullYear();
    this.orderCode = `IC-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
  }
});

// Unique order-code index (sparse so old docs without a code stay valid)
orderSchema.index({ orderCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Order', orderSchema);