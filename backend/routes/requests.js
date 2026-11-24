// routes/requests.js — ROLE-WISE REQUESTS SYSTEM
// Sponsor   → request create + apni requests dekhna
// Performer → naye requests dekhna + accept/complete karna
// Admin     → saari requests + users ki sub-category overview + verify

const express  = require('express');
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');
const User     = require('../models/User');
const Order    = require('../models/Order');
const { JWT_SECRET } = require('../config/env');
const { generateForCompletedOrder } = require('../services/certificates');

const router = express.Router();

// ============ AUTH GUARDS (agar aap ka apna auth middleware hai to usi ko use kar sakte ho) ============
async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Login required — token nahi mila' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ success: false, message: 'Token ka user DB mein nahi mila' });

    req.user = user; // role DB se aata hai — token pe bharosa nahi
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid ya expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Sirf ${roles.join(' / ')} k liye allowed hai` });
    }
    next();
  };
}

const fullName = (u) => `${u.firstName || ''} ${u.lastName || ''}`.trim();

// ============================================================
// 1) SPONSOR — nayi request create
// POST /api/requests
// ============================================================
router.post('/', authRequired, requireRole('Sponsor'), async (req, res) => {
  try {
    const { ibadahType, personName, personRelation, city, price, notes } = req.body;
    if (!personName) {
      return res.status(400).json({ success: false, message: 'personName zaroori hai (jis k liye badal karna hai)' });
    }

    const request = await Order.create({
      sponsorId: req.user._id,
      sponsorName: fullName(req.user),
      sponsorEmail: req.user.email,
      ibadahType: ibadahType || 'Umrah Badal',
      personName,
      personRelation: personRelation || '',
      city: city || '',
      price: price || 0,
      notes: notes || '',
      status: 'Pending',
    });

    res.status(201).json({ success: true, message: 'Request create ho gayi — ab performers k pass aayegi', request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 2) MERE REQUESTS (role k hisaab se query badalti hai)
//    Sponsor   → jis ne request ki     (sponsorId = me)
//    Performer → jo main ne accept ki  (performerId = me)
//    Admin     → saari
// GET /api/requests/mine
// ============================================================
router.get('/mine', authRequired, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Sponsor')   query = { sponsorId: req.user._id };
    else if (req.user.role === 'Performer') query = { performerId: req.user._id };

    const requests = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, role: req.user.role, total: requests.length, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 3) PERFORMER — naye requests jo abhi kisi k pass nahi
// GET /api/requests/available
// ============================================================
router.get('/available', authRequired, requireRole('Performer'), async (req, res) => {
  try {
    // performerId: null — missing field wale purane orders bhi match ho jate hain
    const requests = await Order.find({ status: 'Pending', performerId: null }).sort({ createdAt: -1 });
    res.json({ success: true, total: requests.length, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 4) ADMIN — saari requests (filters: ?status=Pending&sponsorEmail=...&performerEmail=...)
// GET /api/requests/all
// ============================================================
router.get('/all', authRequired, requireRole('Admin'), async (req, res) => {
  try {
    const query = {};
    if (req.query.status)          query.status = req.query.status;
    if (req.query.sponsorEmail)    query.sponsorEmail = req.query.sponsorEmail;
    if (req.query.performerEmail)  query.performerEmail = req.query.performerEmail;

    const requests = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, total: requests.length, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 5) ADMIN — USERS KI SUB-CATEGORY (Sponsor / Performer / Admin)
//    Har category k users + unke requests ka count
// GET /api/requests/overview
// ============================================================
router.get('/overview', authRequired, requireRole('Admin'), async (req, res) => {
  try {
    const userFields = 'firstName lastName email phone city role isVerified cnicStatus createdAt';

    const [sponsors, performers, admins, sponsorCounts, performerCounts, totalRequests] = await Promise.all([
      User.find({ role: 'Sponsor' }).select(userFields).sort({ createdAt: -1 }),
      User.find({ role: 'Performer' }).select(userFields).sort({ createdAt: -1 }),
      User.find({ role: 'Admin' }).select(userFields).sort({ createdAt: -1 }),
      Order.aggregate([{ $group: { _id: '$sponsorEmail', total: { $sum: 1 } } }]),
      Order.aggregate([{ $group: { _id: '$performerEmail', total: { $sum: 1 } } }]),
      Order.countDocuments(),
    ]);

    const sMap = Object.fromEntries(sponsorCounts.map((c) => [c._id, c.total]));
    const pMap = Object.fromEntries(performerCounts.map((c) => [c._id, c.total]));

    res.json({
      success: true,
      totals: {
        sponsors: sponsors.length,
        performers: performers.length,
        admins: admins.length,
        requests: totalRequests,
      },
      categories: {
        Sponsor:   sponsors.map((u) => ({ ...u.toObject(), totalRequests: sMap[u.email] || 0 })),
        Performer: performers.map((u) => ({ ...u.toObject(), totalRequests: pMap[u.email] || 0 })),
        Admin:     admins,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 6) PERFORMER — request accept (atomic: do performers race na karein)
// POST /api/requests/:id/accept
// ============================================================
router.post('/:id/accept', authRequired, requireRole('Performer'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid request id' });
    }

    const request = await Order.findOneAndUpdate(
      { _id: req.params.id, status: 'Pending' }, // sirf tab hoga jab abhi Pending ho
      {
        $set: {
          performerId: req.user._id,
          performerName: fullName(req.user),
          performerEmail: req.user.email,
          status: 'Accepted',
          acceptedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!request) {
      return res.status(400).json({ success: false, message: 'Yeh request available nahi (kisi aur ne accept kar li ya exist nahi karti)' });
    }

    res.json({ success: true, message: 'Request accept ho gayi — ab yeh aap k pass assigned hai', request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 7) PERFORMER — ibadah complete
// POST /api/requests/:id/complete
// ============================================================
router.post('/:id/complete', authRequired, requireRole('Performer'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid request id' });
    }

    const request = await Order.findOneAndUpdate(
      { _id: req.params.id, performerId: req.user._id, status: 'Accepted' },
      { $set: { status: 'Completed', completedAt: new Date() } },
      { new: true }
    );

    if (!request) {
      return res.status(400).json({ success: false, message: 'Yeh request aap k pass Accepted state mein nahi hai' });
    }

    await generateForCompletedOrder(request);
    res.json({ success: true, message: 'Ibadah complete — ab admin verification k liye admin k pass gayi', request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 8) ADMIN — final verification
// POST /api/requests/:id/verify
// ============================================================
router.post('/:id/verify', authRequired, requireRole('Admin'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid request id' });
    }

    const request = await Order.findOneAndUpdate(
      { _id: req.params.id, status: 'Completed' },
      { $set: { status: 'Verified', verifiedAt: new Date() } },
      { new: true }
    );

    if (!request) {
      return res.status(400).json({ success: false, message: 'Sirf Completed requests verify ho sakti hain' });
    }

    res.json({ success: true, message: 'Request verify ho gayi', request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;