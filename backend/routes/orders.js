const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const generateCertificate = require('../utils/generateCertificate');

const router = express.Router();

/* ══════════════════════════════════════════════════════════════
   AUTO CERTIFICATE HELPER (Feature #4)
   ══════════════════════════════════════════════════════════════ */
const ensureCertificate = async (order) => {
  try {
    if (order.certificateUrl) return order.certificateUrl;
    const [sponsor, performer] = await Promise.all([
      order.sponsor ? User.findById(order.sponsor).select('firstName lastName').lean() : null,
      order.performer ? User.findById(order.performer).select('firstName lastName').lean() : null,
    ]);
    const url = await generateCertificate(order, sponsor || {}, performer || {});
    order.certificateUrl = url;
    order.certificateGeneratedAt = new Date();
    await order.save();
    console.log(`[CERTIFICATE] Generated for order ${order.orderCode}: ${url}`);
    return url;
  } catch (e) {
    console.error('CERTIFICATE GENERATION ERROR:', e.message);
    return null;
  }
};

/* Package model */
let Package = null;
try { Package = require('../models/Package'); } catch (e) { Package = null; }
if (!Package) {
  Package = mongoose.models.Package || mongoose.model('Package', new mongoose.Schema({}, { strict: false, collection: 'packages' }));
}

/* Static services */
const STATIC_SERVICES = {
  'hajj-badal': { title: 'Hajj Badal', price: 300000 },
  'wheelchair': { title: 'Wheelchair Donation', price: 25000 },
  'roza-kushai': { title: 'Roza Kushai (Iftar)', price: 5000 },
  'tasbeeh': { title: 'Tasbeeh Distribution', price: 400 },
  'zamzam': { title: 'Ab-e-Zamzam Delivery', price: 8000 },
  'iftar-makkah': { title: 'Iftar in Makkah', price: 40000 },
};

const detectType = (title = '') => {
  const t = String(title).toLowerCase();
  if (t.includes('hajj')) return 'Hajj Badal';
  if (t.includes('umrah')) return 'Umrah Badal';
  return 'Donation';
};

/* ============ DEFAULT MILESTONES ============ */
const MILESTONE_TEMPLATES = {
  'Umrah Badal': [
    'Niyyah & Ihram — intention recorded',
    'Travel to Makkah (journey proof)',
    'Umrah Tawaf performed (video proof)',
    "Sa'i between Safa & Marwah (video proof)",
    'Dua on behalf of sponsor + final report',
  ],
  'Hajj Badal': [
    'Niyyah & Ihram at Miqat',
    'Travel to Mina / Arafat (journey proof)',
    'Tawaf-ul-Ifadah performed (video proof)',
    'Rami-ul-Jamarat (video proof)',
    'Dua on behalf of sponsor + final report',
  ],
  'Donation': [
    'Funds / items received (confirmation)',
    'Purchase from approved vendor (receipt proof)',
    'Distribution at Haram (photo/video proof)',
    'Beneficiary confirmation',
    'Final report to sponsor & admin',
  ],
};

const buildMilestones = (serviceType) =>
  (MILESTONE_TEMPLATES[serviceType] || MILESTONE_TEMPLATES['Umrah Badal']).map((step) => ({
    step,
    isCompleted: false,
    checkedAt: '',
    proofUrl: '',
  }));

/* ══════════════════════════════════════════════════════════════
   AUTO-ASSIGNMENT ENGINE (Feature #3)
   ══════════════════════════════════════════════════════════════ */
const AUTO_ASSIGN_ON_CHECKOUT = true;

const findBestPerformer = async (order) => {
  const candidates = await User.find({
    role: 'Performer',
    isEmailVerified: true,
    isVerified: true,
    _id: { $ne: order.sponsor },
  }).lean();
  if (!candidates.length) return null;

  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

  const eligible = [];
  for (const c of candidates) {
    const active = await Order.findOne({
      performer: c._id,
      status: { $in: ['Assigned', 'In Progress'] },
    }).lean();
    if (active) continue;

    const todaysDone = await Order.findOne({
      performer: c._id,
      status: 'Completed',
      completedAt: { $gte: startOfDay, $lte: endOfDay },
    }).lean();
    if (todaysDone) continue;

    eligible.push(c);
  }
  if (!eligible.length) return null;

  const orderCity = ((order.requestorAddress && order.requestorAddress.city) || '').toLowerCase();
  const scored = eligible.map((c) => {
    let score = 0;
    if (c.cnicStatus === 'Verified') score += 50;
    if (orderCity && (c.city || '').toLowerCase() === orderCity) score += 20;
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].c;
};

const autoAssignOrder = async (order) => {
  const best = await findBestPerformer(order);
  if (!best) return null;
  if (!order.milestones || order.milestones.length === 0) {
    order.milestones = buildMilestones(order.serviceType);
  }
  order.performer = best._id;
  order.status = 'Assigned';
  order.autoAssigned = true;
  order.assignedAt = new Date();
  await order.save();
  console.log(`[AUTO-ASSIGN] Order ${order.orderCode} -> ${best.firstName} ${best.lastName} (${best.city || 'no city'})`);
  return best;
};

/* ============ POST /api/orders — Checkout ============ */
router.post('/', async (req, res) => {
  try {
    const { userId, packageId, qty, items, services, billing = {}, hadiyah = 0, paymentMethod = 'JazzCash' } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(401).json({ message: 'Please login to place your order.' });
    }
    if (!billing.fullName || !billing.phone || !billing.address) {
      return res.status(400).json({ message: 'Billing details are required.' });
    }

    let lines = [];
    if (Array.isArray(items) && items.length) lines = items;
    else if (Array.isArray(services) && services.length) lines = services.map((s) => ({ packageId: s, qty: 1 }));
    else if (packageId) lines = [{ packageId, qty: qty || 1 }];
    if (!lines.length) return res.status(400).json({ message: 'Your cart is empty.' });

    const created = [];
    let firstLine = true;

    for (const line of lines) {
      const quantity = Math.max(1, parseInt(line.qty, 10) || 1);
      const pid = String(line.packageId || line._id || line.id || '');
      let title = null, unitPrice = 0;

      if (pid && mongoose.Types.ObjectId.isValid(pid)) {
        try {
          const pkg = await Package.findById(pid).lean();
          if (pkg) { title = pkg.title || pkg.name; unitPrice = Number(pkg.price) || 0; }
        } catch (e) {}
      }
      if (!title && STATIC_SERVICES[pid]) {
        title = STATIC_SERVICES[pid].title;
        unitPrice = STATIC_SERVICES[pid].price;
      }
      if (!title) continue;

      const order = await Order.create({
        sponsor: userId,
        serviceType: detectType(title),
        packageTitle: title,
        recipientName: billing.fullName || 'N/A',
        relation: 'N/A',
        beneficiaryGender: 'Male',
        reason: 'Booked via online checkout',
        notes: billing.notes || '',
        requestorPhone: billing.phone || '',
        requestorAddress: {
          street: billing.address || '',
          city: billing.city || '',
          country: billing.country || 'Pakistan',
        },
        hadiyah: firstLine ? Number(hadiyah) || 0 : 0,
        price: unitPrice * quantity,
        status: 'Pending',
        paymentMethod: paymentMethod === 'Bank Transfer' ? 'Bank Transfer' : 'JazzCash',
        paymentStatus: 'Unpaid',
      });

      if (AUTO_ASSIGN_ON_CHECKOUT) {
        try { await autoAssignOrder(order); } catch (e) { console.error('AUTO-ASSIGN ERROR:', e.message); }
      }

      created.push(order);
      firstLine = false;
    }

    if (!created.length) return res.status(400).json({ message: 'No valid services found in cart.' });

    const total = created.reduce((s, o) => s + o.price, 0) + (Number(hadiyah) || 0);
    res.status(201).json({
      message: 'Order placed successfully',
      orders: created,
      orderCodes: created.map((o) => o.orderCode),
      total,
      assignments: created.map((o) => ({
        orderCode: o.orderCode,
        status: o.status,
        autoAssigned: !!o.performer,
      })),
    });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to place order' });
  }
});

/* ============ PUT /api/orders/:id/pay — Demo Payment Confirm + Auto-Assign ============ */
router.put('/:id/pay', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentStatus === 'Paid') return res.status(400).json({ message: 'This order is already paid.' });

    order.paymentStatus = 'Paid';
    order.paidAt = new Date();
    if (!order.paymentRef) order.paymentRef = 'DEMO-' + Date.now();
    await order.save();

    let assigned = null;
    if (!order.performer || order.status === 'Pending') {
      try {
        const best = await autoAssignOrder(order);
        assigned = best ? { id: best._id, name: `${best.firstName} ${best.lastName}`, city: best.city || '' } : null;
      } catch (e) { console.error('AUTO-ASSIGN ERROR:', e.message); }
    }

    const populated = await Order.findById(order._id)
      .populate('performer', 'firstName lastName')
      .lean();
    res.json({
      message: assigned
        ? `Payment confirmed! Auto-assigned to performer: ${assigned.name}`
        : 'Payment confirmed. Order will auto-assign as soon as a verified performer is available.',
      autoAssigned: !!assigned,
      performer: populated.performer,
      order: { ...populated, serviceTitle: populated.packageTitle },
    });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Payment confirmation failed' });
  }
});

/* ============ GET /api/orders/mine — Sponsor ke orders ============ */
router.get('/mine', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) return res.json([]);
    const orders = await Order.find({ sponsor: userId })
      .sort({ createdAt: -1 })
      .populate('performer', 'firstName lastName')
      .lean();
    res.json(orders.map((o) => ({ ...o, serviceTitle: o.packageTitle })));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============ GET /api/orders/all + / — Performer Portal & Admin ============ */
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('performer', 'firstName lastName')
      .populate('sponsor', 'firstName lastName email')
      .lean();
    res.json(orders.map((o) => ({ ...o, serviceTitle: o.packageTitle })));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
router.get('/all', getAllOrders);
router.get('/', getAllOrders);

/* ============ PUT /api/orders/accept-task/:id — Performer accept (ROLE GUARD) ============ */
router.put('/accept-task/:id', async (req, res) => {
  try {
    const { performerId } = req.body;
    if (!performerId || !mongoose.Types.ObjectId.isValid(String(performerId))) {
      return res.status(400).json({ message: 'Performer ID required.' });
    }

    const performer = await User.findById(performerId).lean();
    if (!performer) return res.status(404).json({ message: 'Performer account not found.' });
    if (String(performer.role || '').toLowerCase() !== 'performer') {
      return res.status(403).json({ message: 'Only Performer accounts can accept tasks. Sponsor accounts cannot perform ibadah.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'Completed') return res.status(400).json({ message: 'Order already completed.' });
    if (order.performer && String(order.performer) !== String(performerId)) {
      return res.status(409).json({ message: 'This task was just accepted by another performer.' });
    }

    if (String(order.sponsor) === String(performerId)) {
      return res.status(403).json({ message: 'You cannot accept your own request.' });
    }

    const activeTask = await Order.findOne({
      performer: performerId,
      status: { $in: ['Assigned', 'In Progress'] },
      _id: { $ne: order._id },
    }).lean();
    if (activeTask) {
      return res.status(409).json({ message: 'You already have an active task. Complete it first — only 1 task at a time.' });
    }

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const todaysTask = await Order.findOne({
      performer: performerId,
      status: 'Completed',
      completedAt: { $gte: startOfDay, $lte: endOfDay },
      _id: { $ne: order._id },
    }).lean();
    if (todaysTask) {
      return res.status(409).json({ message: 'Daily limit reached — you can accept only 1 task per day. Please come back tomorrow.' });
    }

    if (!order.milestones || order.milestones.length === 0) {
      order.milestones = buildMilestones(order.serviceType);
    }
    order.performer = performerId;
    order.status = 'In Progress';
    await order.save();

    const populated = await Order.findById(order._id)
      .populate('performer', 'firstName lastName')
      .populate('sponsor', 'firstName lastName')
      .lean();
    res.json({ message: 'Task accepted! Milestones unlocked.', order: populated });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to accept task' });
  }
});

/* ============ PUT /api/orders/update-milestone/:id — Proof submit ============ */
router.put('/update-milestone/:id', async (req, res) => {
  try {
    const { milestoneIndex, proofUrl, proofLocation, proofOcr } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const idx = parseInt(milestoneIndex, 10);
    if (Number.isNaN(idx) || !order.milestones || !order.milestones[idx]) {
      return res.status(400).json({ message: 'Invalid milestone.' });
    }

    order.milestones[idx].isCompleted = true;
    order.milestones[idx].checkedAt = new Date().toISOString();
    if (proofUrl) order.milestones[idx].proofUrl = String(proofUrl);
    if (proofLocation) order.milestones[idx].proofLocation = proofLocation;
    if (proofOcr) order.milestones[idx].proofOcr = proofOcr;

    const total = order.milestones.length;
    const done = order.milestones.filter((m) => m.isCompleted).length;

    if (done === total) {
      order.status = 'Completed';
      order.completedAt = new Date();
      order.proofUrl = String(proofUrl || '');
      if (proofLocation) {
        order.currentLocation = {
          lat: proofLocation.lat,
          lng: proofLocation.lng,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    await order.save();

    if (done === total) {
      await ensureCertificate(order);
    }

    res.json({
      message: done === total ? 'Order completed! Certificate generated & sponsor notified.' : 'Milestone updated.',
      orderCompleted: done === total,
      completedMilestones: done,
      totalMilestones: total,
      certificateUrl: order.certificateUrl || null,
    });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to update milestone' });
  }
});

/* ============ PUT /api/orders/:id/status — Admin ============ */
const ALLOWED_STATUS = ['Pending', 'Assigned', 'In Progress', 'Completed'];
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!ALLOWED_STATUS.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const updates = { status };
    if (status === 'Completed') updates.completedAt = new Date();
    const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (status === 'Completed') {
      await ensureCertificate(order);
    }

    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============ PUT /api/orders/:id — Admin generic edit ============ */
router.put('/:id', async (req, res) => {
  try {
    const allowed = ['status', 'performer', 'serviceType', 'packageTitle', 'price', 'hadiyah', 'notes'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   LIVE TRACKING (inDrive-style) — Feature #5
   PUT /api/orders/:id/location
   Performer har 5 sec apni GPS location bhejta hai (frontend
   TrackOrderPage se). ObjectId YA orderCode dono chalte hain.
   Location Order.currentLocation me save hoti hai — wahi field
   jo milestones complete hone par use hoti hai, is liye KOI
   SCHEMA CHANGE NAHI chahiye.
   ══════════════════════════════════════════════════════════════ */
router.put('/:id/location', async (req, res) => {
  try {
    const lat = Number(req.body.latitude);
    const lng = Number(req.body.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'latitude and longitude are required.' });
    }

    let order = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await Order.findById(req.params.id);
    }
    if (!order) {
      order = await Order.findOne({ orderCode: req.params.id });
    }
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.currentLocation = {
      lat,
      lng,
      updatedAt: new Date().toISOString(),
    };
    await order.save();

    res.json({
      message: 'Location updated',
      location: { latitude: lat, longitude: lng, updatedAt: order.currentLocation.updatedAt },
    });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to update location' });
  }
});

/* ══════════════════════════════════════════════════════════════
   GET /api/orders/:id/location
   Sponsor har 5 sec yahan se latest location fetch karta hai.
   Response shape frontend TrackOrderPage ke mutabiq:
   { location: { latitude, longitude, updatedAt } }
   ══════════════════════════════════════════════════════════════ */
router.get('/:id/location', async (req, res) => {
  try {
    let order = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await Order.findById(req.params.id).select('currentLocation').lean();
    }
    if (!order) {
      order = await Order.findOne({ orderCode: req.params.id }).select('currentLocation').lean();
    }
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const cl = order.currentLocation;
    if (!cl || typeof cl.lat !== 'number' || typeof cl.lng !== 'number') {
      return res.json({ location: null, message: 'Performer ki location abhi share nahi hui.' });
    }
    res.json({
      location: {
        latitude: cl.lat,
        longitude: cl.lng,
        updatedAt: cl.updatedAt,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to fetch location' });
  }
});

/* ============ GET /api/orders/:id — single (ObjectId YA orderCode) ============ */
router.get('/:id', async (req, res) => {
  try {
    let order = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await Order.findById(req.params.id).populate('performer', 'firstName lastName').lean();
    }
    if (!order) {
      order = await Order.findOne({ orderCode: req.params.id })
        .populate('performer', 'firstName lastName')
        .populate('sponsor', 'firstName lastName')
        .lean();
    }
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ ...order, serviceTitle: order.packageTitle });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;