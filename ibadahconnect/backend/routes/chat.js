const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Order = require('../models/Order');
const User = require('../models/User');

const router = express.Router();

// GET /api/chat/:orderId — all messages of one order (front-end polls this every 4s)
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.json({ messages: [] });
    const messages = await Message.find({ orderId }).sort({ createdAt: 1 }).limit(300).lean();
    res.json({ messages });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/chat/send — send a message { orderId, senderId, senderName, senderRole, text }
router.post('/send', async (req, res) => {
  try {
    const { orderId, senderId, senderName, senderRole, text } = req.body;
    if (!orderId || !senderId || !text || !String(text).trim()) {
      return res.status(400).json({ message: 'orderId, senderId and text are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order' });
    }
    const exists = await Order.findById(orderId).select('_id').lean();
    if (!exists) return res.status(404).json({ message: 'Order not found' });

    const msg = await Message.create({
      orderId,
      senderId: String(senderId),
      senderName: senderName || 'User',
      senderRole: senderRole || 'Sponsor',
      text: String(text).trim().slice(0, 2000),
    });
    res.status(201).json({ message: msg });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/chat/performer/:id?userId= — public performer profile (Facebook style) + chat order link
router.get('/performer/:id', async (req, res) => {
  try {
    const p = await User.findById(req.params.id).select('-password').lean();
    if (!p || p.role !== 'Performer') {
      return res.status(404).json({ message: 'Performer not found' });
    }

    const completed = await Order.countDocuments({ performer: p._id, status: 'Completed' });
    const inProgress = await Order.countDocuments({
      performer: p._id,
      status: { $in: ['Assigned', 'In Progress'] },
    });

    const feed = await Order.find({ performer: p._id, status: 'Completed' })
      .sort({ completedAt: -1, createdAt: -1 })
      .limit(6)
      .select('packageTitle serviceType completedAt createdAt milestones proofUrl price')
      .lean();

    // If the logged-in sponsor has an order with this performer, link chat to that order
    let chatOrderId = null;
    let chatOrderCode = null;
    if (req.query.userId) {
      try {
        const mine = await Order.findOne({ performer: p._id, userId: String(req.query.userId) })
          .sort({ createdAt: -1 })
          .select('_id orderCode')
          .lean();
        if (mine) {
          chatOrderId = mine._id;
          chatOrderCode = mine.orderCode;
        }
      } catch (e) {
        chatOrderId = null;
      }
    }

    res.json({ performer: p, stats: { completed, inProgress }, feed, chatOrderId, chatOrderCode });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;