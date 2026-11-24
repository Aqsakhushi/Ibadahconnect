// models/Order.js — MERGED v3 (demo-final + tracking code + email)
// v2 (hook sanitizer) barkarar + NEW v3:
//   - trackingCode field (IC-2026-XXXXXX) auto-generate
//   - naye order pe sponsor ko confirmation email (IC code ke sath)
//   - email fire-and-forget: order save pe koi asar nahi
const mongoose = require('mongoose');
const { sendMail } = require('../mailer'); // NEW v3

const orderSchema = new mongoose.Schema(
  {
    // ---------- SPONSOR (purane routes 'sponsor', naya system 'sponsorId') ----------
    sponsorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sponsor:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sponsorName:  { type: String, default: '' },
    sponsorEmail: { type: String, default: '' },

    // ---------- PERFORMER (purana 'performer', naya 'performerId') ----------
    performer:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    performerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    performerName:  { type: String, default: '' },
    performerEmail: { type: String, default: '' },

    // ---------- BOOKING FIELDS (checkout — tolerant, extra fields bhi save) ----------
    packageId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
    packageTitle:  { type: String, default: '' },
    packageName:   { type: String, default: '' },
    items:         { type: mongoose.Schema.Types.Mixed },
    price:         { type: Number, default: 0 },
    totalPrice:    { type: Number, default: 0 },
    milestones:    { type: mongoose.Schema.Types.Mixed, default: [] },
    paymentProof:  { type: mongoose.Schema.Types.Mixed, default: null },
    paymentStatus: { type: String, default: '' },

    // ---------- REQUEST FIELDS ----------
    ibadahType:     { type: String, default: 'Umrah Badal' },
    personName:     { type: String, default: '' },
    personRelation: { type: String, default: '' },
    city:           { type: String, default: '' },
    notes:          { type: String, default: '' },

    // ---------- STATUS ----------
    status:      { type: String, default: 'Pending' },
    acceptedAt:  { type: Date, default: null },
    completedAt: { type: Date, default: null },
    verifiedAt:  { type: Date, default: null },
    scheduledDate: { type: Date, default: null },
    neededBy:      { type: Date, default: null },

    timeline: { type: mongoose.Schema.Types.Mixed, default: [] },

    // ---------- NEW v3: TRACKING ----------
    trackingCode: { type: String, default: '', index: true },
  },
  { timestamps: true, strict: false } // strict:false => checkout jo bhi extra field bheje, save ho
);

// ---------- PRE-SAVE: tracking code + alias sync ----------
orderSchema.pre('save', function (next) {
  try {
    // NEW v3: "kya ye naya order hai?" — post-save email isi se decide hota hai
    this._wasNew = this.isNew === true;

    // NEW v3: tracking code (sirf jab pehle se na ho)
    if (!this.trackingCode) {
      const rand = Math.floor(100000 + Math.random() * 900000);
      this.trackingCode = `IC-${new Date().getFullYear()}-${rand}`;
    }

    // alias sync (v2 wala, unchanged)
    if (this.sponsorId && !this.sponsor) this.sponsor = this.sponsorId;
    if (this.sponsor && !this.sponsorId) this.sponsorId = this.sponsor;
    if (this.performerId && !this.performer) this.performer = this.performerId;
    if (this.performer && !this.performerId) this.performerId = this.performer;
  } catch (e) { /* best-effort */ }
  if (typeof next === 'function') return next();
});

orderSchema.pre('findOneAndUpdate', function (next) {
  try {
    const u = this.getUpdate() || {};
    const set = u.$set ? u.$set : u;
    if (set.sponsorId && !set.sponsor) set.sponsor = set.sponsorId;
    if (set.sponsor && !set.sponsorId) set.sponsorId = set.sponsor;
    if (set.performerId && !set.performer) set.performer = set.performerId;
    if (set.performer && !set.performerId) set.performerId = set.performer;
  } catch (e) { /* best-effort */ }
  if (typeof next === 'function') return next();
});

// ---------- NEW v3: ORDER CONFIRMATION EMAIL (sponsor ko IC code ke sath) ----------
async function resolveSponsorEmail(doc) {
  if (doc.sponsorEmail) return doc.sponsorEmail;
  try {
    const User = require('./User'); // lazy require — circular require safe
    const id = doc.sponsor || doc.sponsorId;
    if (!id) return null;
    const u = await User.findById(id).lean();
    return (u && (u.email || u.Email)) || null;
  } catch (e) { return null; }
}

async function sendOrderConfirmation(doc) {
  const to = await resolveSponsorEmail(doc);
  if (!to) { console.log('[ORDER EMAIL] sponsorEmail nahi mila — email skip'); return; }

  const code  = doc.trackingCode;
  const title = doc.packageTitle || doc.packageName || doc.ibadahType || 'Ibadah Order';
  const total = doc.totalPrice || doc.price || 0;
  const name  = doc.personName || 'Aap ke liye';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#0d9488;margin-top:0;">IbadahConnect — Order Confirmed</h2>
      <p>Assalam-o-Alaikum,</p>
      <p>Aap ka ibadah order <b>${title}</b> successfully place ho gaya hai.</p>
      <div style="background:#f0fdfa;border:1px dashed #0d9488;border-radius:8px;padding:16px;text-align:center;margin:16px 0;">
        <div style="color:#6b7280;font-size:12px;">TRACKING CODE</div>
        <div style="font-size:28px;font-weight:bold;color:#0d9488;letter-spacing:2px;">${code}</div>
      </div>
      <table style="width:100%;font-size:14px;">
        <tr><td style="color:#6b7280;padding:4px 0;">For</td><td>${name}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0;">Total</td><td>PKR ${total}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0;">Status</td><td>${doc.status || 'Pending'}</td></tr>
      </table>
      <p style="color:#374151;font-size:14px;">Ye code <b>Track Your Order</b> page me enter karein — proof photos aur live location map wahan automatically load honge.</p>
      <p style="color:#6b7280;font-size:12px;">IbadahConnect — Perform Umrah/Hajj on behalf of others.</p>
    </div>`;

  await sendMail({ to, subject: `IbadahConnect — Order Confirm (Tracking: ${code})`, html });
  console.log('[ORDER EMAIL] confirmation sent ->', to, '| code:', code);
}

// fire-and-forget: email kabhi bhi order save ko fail/block nahi karega
orderSchema.post('save', function (doc) {
  try {
    if (!doc || !doc._wasNew) return; // sirf NAYE order pe email (status change pe nahi)
    sendOrderConfirmation(doc).catch((e) =>
      console.log('[ORDER EMAIL] fail (order saved, sirf email ruka):', e.message)
    );
  } catch (e) { console.log('[ORDER EMAIL] skip:', e.message); }
});

// ---------- HOOK SANITIZER (v2 — unchanged, "next is not a function" ka ilaaj) ----------
function sanitizePreHooks(schema, hookName) {
  try {
    const hooks = schema.s && schema.s.hooks;
    if (!hooks || !hooks._pres || typeof hooks._pres.get !== 'function') return null;
    const list = hooks._pres.get(hookName);
    if (!Array.isArray(list)) return null;
    const kept = [];
    const removedNames = [];
    for (const item of list) {
      const fn = typeof item === 'function' ? item : (item && typeof item.fn === 'function' ? item.fn : null);
      if (fn && fn.length > 1) { removedNames.push(fn.name || 'anonymous'); continue; }
      kept.push(item);
    }
    if (removedNames.length > 0) hooks._pres.set(hookName, kept);
    return removedNames;
  } catch (e) { return null; }
}

process.nextTick(() => {
  const names = ['save', 'validate', 'findOneAndUpdate', 'updateOne', 'deleteOne'];
  let total = 0;
  const details = [];
  for (const n of names) {
    const removed = sanitizePreHooks(orderSchema, n);
    if (removed && removed.length > 0) {
      total += removed.length;
      details.push(n + ': ' + removed.join(', '));
    }
  }
  if (total > 0) {
    console.log('[ORDER] Hook sanitizer: ' + total + ' ghalat pre-hook(s) hataye — ' + details.join(' | ') + ' ("next is not a function" fix).');
  } else {
    console.log('[ORDER] Hook sanitizer: sab pre-hooks theek ✅');
  }
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);