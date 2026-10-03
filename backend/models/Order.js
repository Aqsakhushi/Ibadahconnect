const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    // ─── References ───
    sponsor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    performer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // ─── Service Info ───
    serviceType: {
      type: String,
      enum: ['Umrah Badal', 'Hajj Badal', 'Donation'],
      default: 'Umrah Badal',
    },
    packageTitle: { type: String, required: true },

    // ─── Recipient / Beneficiary ───
    recipientName: { type: String, default: '' },
    relation: { type: String, default: '' },
    beneficiaryGender: { type: String, default: '' },
    reason: { type: String, default: '' },
    notes: { type: String, default: '' },
    requestorPhone: { type: String, default: '' },

    // ─── Requestor Address ───
    requestorAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: '' },
    },

    // ─── Pricing ───
    hadiyah: { type: Number, default: 0 },
    price: { type: Number, required: true },

    // ─── Status ───
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Progress', 'Completed'],
      default: 'Pending',
    },

    // ─── Auto Assignment (Feature #3) ───
    autoAssigned: { type: Boolean, default: false },
    assignedAt: { type: Date, default: null },

    // ─── Milestones (Performer Portal shape: step / isCompleted / proof) ───
    milestones: [
      {
        step: { type: String, default: '' },
        isCompleted: { type: Boolean, default: false },
        checkedAt: { type: String, default: '' },
        proofUrl: { type: String, default: '' },
        proofLocation: {
          lat: { type: Number, default: null },
          lng: { type: Number, default: null },
          capturedAt: { type: String, default: null },
        },
        proofOcr: { type: mongoose.Schema.Types.Mixed, default: null },
      },
    ],

    // ─── Payment ───
    paymentMethod: { type: String, enum: ['JazzCash', 'Bank Transfer'], default: 'JazzCash' },
    paymentStatus: { type: String, enum: ['Unpaid', 'Paid', 'Under Review'], default: 'Unpaid' },
    paymentRef: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    receiptUrl: { type: String, default: '' },

    // ─── Order Tracking Code ───
    orderCode: { type: String, unique: true, sparse: true },

    // ─── Proof / Completion ───
    proofUrl: { type: String, default: '' },
    proofLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      capturedAt: { type: String, default: null },
    },
    currentLocation: { type: mongoose.Schema.Types.Mixed, default: null },
    proofOcr: { type: mongoose.Schema.Types.Mixed, default: null },
    proofSubmittedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // ─── Auto Certificate (Feature #4) ───
    // Order complete hote hi khud-ba-khud PDF certificate generate hota hai
    certificateUrl: { type: String, default: '' },
    certificateGeneratedAt: { type: Date, default: null },
  },
  // timestamps: createdAt / updatedAt khud-ba-khud (timing show karne k liye)
  { timestamps: true }
);

// Order Code: IC-YYYY-XXXXXX (unique) — async hook (next ka use FORBIDDEN hai)
OrderSchema.pre('save', async function () {
  if (!this.orderCode && this.isNew) {
    try {
      const year = new Date().getFullYear();
      const Model = mongoose.model('Order');
      let code, clash = true;
      while (clash) {
        code = `IC-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
        clash = await Model.findOne({ orderCode: code }).lean();
      }
      this.orderCode = code;
    } catch (e) {
      // orderCode na ban paye to bhi order save ho
    }
  }
});

module.exports = mongoose.model('Order', OrderSchema);