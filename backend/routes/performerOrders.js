const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');

const router = express.Router();

const titleOf = (o) => o.packageTitle || o.serviceTitle || o.serviceType || 'Ibadah';

/* ============ GET all orders (performer work board) ============ */
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('performer', 'firstName lastName').lean();
    res.json(orders.map((o) => ({ ...o, serviceTitle: titleOf(o) })));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============ GET stats ============ */
router.get('/stats', async (req, res) => {
  try {
    const orders = await Order.find().lean();
    const total = orders.length;
    const completed = orders.filter((o) => o.status === 'Completed').length;
    const pending = orders.filter((o) => (o.status === 'Pending' || o.status === 'In Progress') && !o.proofUrl).length;
    const earnings = orders
      .filter((o) => o.performer && o.status === 'Completed')
      .reduce((s, o) => s + (Number(o.price) || 0), 0);
    res.json({ total, completed, pending, earnings });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============ PUT milestone update (FB-style post) ============ */
router.put('/milestone/:id', async (req, res) => {
  try {
    const { text, image, userId } = req.body;
    const t = String(text || '').trim();
    if (!t && !image) return res.status(400).json({ message: 'Write something or attach a photo.' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.milestones = order.milestones || [];
    order.milestones.push({
      title: t || 'Shared a photo update',
      image: image || '',
      checkedAt: new Date().toISOString(),
    });

    if (order.status === 'Pending') {
      order.status = 'In Progress';
      if (userId && mongoose.Types.ObjectId.isValid(String(userId))) order.performer = userId;
    }
    await order.save();
    res.json({ ...order.toObject(), serviceTitle: titleOf(order) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============ PUT share live location ============ */
router.put('/location/:id', async (req, res) => {
  try {
    const { lat, lng, userId } = req.body;
    const La = Number(lat), Lg = Number(lng);
    if (Number.isNaN(La) || Number.isNaN(Lg)) return res.status(400).json({ message: 'Invalid coordinates.' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.currentLocation = { lat: La, lng: Lg, updatedAt: new Date().toISOString() };
    if (order.status === 'Pending') {
      order.status = 'In Progress';
      if (userId && mongoose.Types.ObjectId.isValid(String(userId))) order.performer = userId;
    }
    await order.save();
    res.json({ ...order.toObject(), serviceTitle: titleOf(order) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============ GET public performer profile (Facebook-style) ============ */
router.get('/profile/:performerId', async (req, res) => {
  try {
    const user = await User.findById(req.params.performerId)
      .select('firstName lastName profilePic performerType agencyStatus agencyName experience createdAt')
      .lean();
    if (!user) return res.status(404).json({ message: 'Performer not found' });

    const orders = await Order.find({ performer: req.params.performerId }).sort({ createdAt: -1 }).lean();

    const stats = {
      total: orders.length,
      completed: orders.filter((o) => o.status === 'Completed').length,
      inProgress: orders.filter((o) => o.status === 'In Progress' || o.status === 'Assigned').length,
    };

    const gallery = orders
      .filter((o) => o.proofUrl)
      .map((o) => ({
        packageTitle: titleOf(o),
        proofUrl: o.proofUrl,
        status: o.status,
        date: o.completedAt || o.proofSubmittedAt || o.updatedAt,
      }));

    const updates = [];
    orders.forEach((o) =>
      (o.milestones || []).forEach((m) =>
        updates.push({ packageTitle: titleOf(o), title: m.title, image: m.image || '', checkedAt: m.checkedAt })
      )
    );
    updates.sort((a, b) => new Date(b.checkedAt || 0) - new Date(a.checkedAt || 0));

    res.json({ user, stats, gallery: gallery.slice(0, 12), updates: updates.slice(0, 15) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============ PUT submit proof ============ */
router.put('/proof/:id', async (req, res) => {
  try {
    const { proofUrl, proofLocation, proofOcr, userId } = req.body;
    if (!proofUrl) return res.status(400).json({ message: 'Proof image is required.' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.proofUrl = proofUrl;
    if (proofLocation) order.proofLocation = proofLocation;
    if (proofOcr) order.proofOcr = proofOcr;
    order.proofSubmittedAt = new Date();

    if (order.status === 'Pending') {
      order.status = 'In Progress';
      if (userId && mongoose.Types.ObjectId.isValid(String(userId))) order.performer = userId;
    }
    await order.save();
    res.json({ ...order.toObject(), serviceTitle: titleOf(order) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ============ PUT approve (admin Round B) ============ */
router.put('/approve/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'Completed', completedAt: new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ ...order.toObject(), serviceTitle: titleOf(order) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;