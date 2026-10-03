const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Order = require('../models/Order');

const router = express.Router();

const JC = {
  merchantId: process.env.JAZZCASH_MERCHANT_ID || '',
  password: process.env.JAZZCASH_PASSWORD || '',
  salt: process.env.JAZZCASH_INTEGRITY_SALT || '',
  postUrl: 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction',
};

const pad2 = (n) => String(n).padStart(2, '0');
const jcDate = (d) =>
  `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;

/* ============ JazzCash pay ============ */
router.post('/jazzcash/pay', async (req, res) => {
  try {
    const { orderCodes = [], amount = 0, phone = '', cnic = '' } = req.body;
    if (!Array.isArray(orderCodes) || orderCodes.length === 0) {
      return res.status(400).json({ success: false, message: 'No orders found to pay.' });
    }
    const cleanPhone = String(phone).replace(/[\s-]/g, '');
    if (!/^03\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Invalid JazzCash mobile number. Format: 03XXXXXXXXX' });
    }
    if (!/^\d{6}$/.test(String(cnic))) {
      return res.status(400).json({ success: false, message: 'CNIC last 6 digits are required.' });
    }

    let txnRef, simulated = true, gatewayResponse = null;

    if (JC.merchantId && JC.password && JC.salt) {
      if (typeof fetch !== 'function') {
        return res.status(500).json({ success: false, message: 'Live JazzCash mode needs Node.js 18+.' });
      }
      const now = new Date();
      const expiry = new Date(now.getTime() + 60 * 60 * 1000);
      txnRef = `T${jcDate(now)}${Math.floor(100 + Math.random() * 900)}`;
      const params = {
        pp_Version: '2.0',
        pp_TxnType: 'MWALLET',
        pp_Language: 'EN',
        pp_MerchantID: JC.merchantId,
        pp_Password: JC.password,
        pp_TxnRefNo: txnRef,
        pp_Amount: String(Math.round(Number(amount) * 100)),
        pp_TxnDateTime: jcDate(now),
        pp_TxnExpiryDateTime: jcDate(expiry),
        pp_BillReference: 'IBADAHCONNECT',
        pp_Description: 'IbadahConnect Order Payment',
        pp_MobileNumber: cleanPhone,
        pp_CNICLast6Digits: String(cnic),
      };
      const hashString = Object.keys(params).sort().map((k) => params[k]).join('&');
      params.pp_SecureHash = crypto.createHmac('sha256', JC.salt).update(hashString).digest('hex').toUpperCase();
      const resp = await fetch(JC.postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      gatewayResponse = await resp.json();
      if (String(gatewayResponse.pp_ResponseCode) !== '000') {
        return res.status(402).json({
          success: false,
          message: gatewayResponse.pp_ResponseMessage || 'Payment declined by JazzCash.',
          gateway: gatewayResponse,
        });
      }
      simulated = false;
    } else {
      txnRef = `JC${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
    }

    await Order.updateMany(
      { orderCode: { $in: orderCodes } },
      { $set: { paymentStatus: 'Paid', paymentMethod: 'JazzCash', paymentRef: txnRef, paidAt: new Date() } }
    );
    res.json({ success: true, txnRef, simulated, gateway: gatewayResponse });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || 'Payment processing failed.' });
  }
});

/* ============ Bank transfer receipt ============ */
router.post('/bank/submit', async (req, res) => {
  try {
    const { orderCodes = [], senderName = '', receiptImage = '' } = req.body;
    if (!Array.isArray(orderCodes) || orderCodes.length === 0) {
      return res.status(400).json({ success: false, message: 'No orders found.' });
    }
    if (!senderName.trim()) {
      return res.status(400).json({ success: false, message: 'Sender account title is required.' });
    }
    const match = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(receiptImage);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Please upload a valid receipt image (PNG/JPG).' });
    }
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Receipt image must be under 8MB.' });
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const filename = `bank-${Date.now()}-${Math.floor(100 + Math.random() * 900)}.${ext}`;
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
    const receiptUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;

    const paymentRef = `BT${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
    await Order.updateMany(
      { orderCode: { $in: orderCodes } },
      { $set: { paymentStatus: 'Under Review', paymentMethod: 'Bank Transfer', paymentRef, receiptUrl } }
    );
    res.json({ success: true, txnRef: paymentRef, receiptUrl });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || 'Bank transfer submission failed.' });
  }
});

/* ============ Admin verify / reject bank payment ============ */
router.put('/verify/:orderCode', async (req, res) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    const set =
      action === 'approve'
        ? { paymentStatus: 'Paid', paidAt: new Date() }
        : { paymentStatus: 'Unpaid', paymentRef: '', receiptUrl: '' };
    const r = await Order.updateMany({ orderCode: String(req.params.orderCode).toUpperCase() }, { $set: set });
    if (!r.matchedCount) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;