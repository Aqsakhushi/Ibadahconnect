const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// ============================================================
// ADMIN — Payment Verification
// Bank Transfer receipts admin khud dekh kar confirm karta hai.
// PUT /api/payments-admin/:orderId   body: { paymentStatus: 'Paid' | 'Unpaid' }
// ============================================================
router.put('/:orderId', async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!['Paid', 'Unpaid', 'Under Review'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid paymentStatus' });
    }
    const update = { paymentStatus };
    if (paymentStatus === 'Paid') update.paidAt = new Date();
    if (paymentStatus === 'Unpaid') update.paidAt = null;

    const order = await Order.findByIdAndUpdate(req.params.orderId, { $set: update }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;