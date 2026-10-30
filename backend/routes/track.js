// ============================================================
// IbadahConnect — Track Routes (backend/routes/track.js)
// ============================================================
// Public order tracking + inDrive-style live location feed.
// Self-contained: TrackPing model is defined inline, so no extra
// model file is needed. Order.js is NOT touched.
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');

const router = express.Router();

// ------------------------------------------------------------
// Inline model: TrackPing (live location history per order)
// Documents auto-expire after 30 days to keep the DB clean.
// ------------------------------------------------------------
const TrackPing =
  mongoose.models.TrackPing ||
  mongoose.model(
    'TrackPing',
    new mongoose.Schema(
      {
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
        performer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        lat: Number,
        lng: Number,
        accuracy: Number,
        speed: Number,
        heading: Number,
        label: { type: String, default: '' }, // e.g. "On the way", "Reached mosque"
        createdAt: { type: Date, default: Date.now, expires: '30d' },
      },
      { versionKey: false }
    )
  );

// ------------------------------------------------------------
// Helper: verify JWT (self-contained — no middleware import needed)
// ------------------------------------------------------------
function performerAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Not authorized. Please log in.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id || decoded._id || decoded.userId,
      role: decoded.role,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
}

// ------------------------------------------------------------
// GET /api/track/:code  (PUBLIC — used by Track Order page)
// Finds order by orderCode (IC-YYYY-NNNNNN) or Mongo ObjectId.
// ------------------------------------------------------------
router.get('/:code', async (req, res) => {
  try {
    const raw = String(req.params.code || '').trim();
    let order = await Order.findOne({ orderCode: raw.toUpperCase() })
      .populate('performer', 'firstName lastName profilePic')
      .lean();
    if (!order && mongoose.Types.ObjectId.isValid(raw)) {
      order = await Order.findById(raw).populate('performer', 'firstName lastName profilePic').lean();
    }
    if (!order) {
      return res.status(404).json({ message: 'No order found with this Order ID. Please check and try again.' });
    }
    res.json({
      ...order,
      serviceTitle: order.packageTitle || order.serviceType,
      milestones: order.milestones || [],
    });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Tracking failed' });
  }
});

// ------------------------------------------------------------
// POST /api/track/:id/location  (PERFORMER — live location ping)
// Body: { lat, lng, accuracy?, speed?, heading?, label? }
// Performer dashboard calls this automatically while a task is
// active — same idea as inDrive driver location updates.
// ------------------------------------------------------------
router.post('/:id/location', performerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order id.' });
    }
    const order = await Order.findById(id).select('performer orderCode');
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    // Only the assigned performer of THIS order may post location
    if (String(order.performer) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You are not the performer of this order.' });
    }
    const { lat, lng, accuracy, speed, heading, label } = req.body || {};
    if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'lat and lng are required numbers.' });
    }
    const ping = await TrackPing.create({
      order: order._id,
      performer: order.performer,
      lat,
      lng,
      accuracy: typeof accuracy === 'number' ? accuracy : undefined,
      speed: typeof speed === 'number' ? speed : undefined,
      heading: typeof heading === 'number' ? heading : undefined,
      label: typeof label === 'string' ? label.slice(0, 120) : '',
    });
    res.status(201).json({ message: 'Location updated.', pingId: ping._id, at: ping.createdAt });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Could not save location.' });
  }
});

// ------------------------------------------------------------
// GET /api/track/:code/location  (PUBLIC — sponsor live view)
// Returns the latest ping + last 50 pings (oldest -> newest)
// so the tracking page can draw the full movement path.
// ------------------------------------------------------------
router.get('/:code/location', async (req, res) => {
  try {
    const raw = String(req.params.code || '').trim().toUpperCase();
    let order = await Order.findOne({ orderCode: raw }).select('_id orderCode').lean();
    if (!order && mongoose.Types.ObjectId.isValid(req.params.code)) {
      order = { _id: req.params.code };
    }
    if (!order) {
      return res.status(404).json({ message: 'No order found with this Order ID.' });
    }
    const pings = await TrackPing.find({ order: order._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({
      orderCode: order.orderCode || raw,
      latest: pings[0] || null,
      history: pings.reverse(),
    });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Could not load location.' });
  }
});

module.exports = router;