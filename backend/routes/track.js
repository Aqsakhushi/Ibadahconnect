const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');

const router = express.Router();

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

module.exports = router;