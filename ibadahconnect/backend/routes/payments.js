const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Order = require('../models/Order');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- helpers ----------
const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

// JazzCash creds — agar .env mein teeno set hain to REAL sandbox gateway chalega,
// warna SIMULATION mode (demo). Demo ke liye .env mein yeh teeno EMPTY/absent chhoro.
const JC = {
  mid: process.env.JAZZCASH_MERCHANT_ID || '',
  pass: process.env.JAZZCASH_PASSWORD || '',
  salt: process.env.JAZZCASH_INTEGRITY_SALT || '',
};
const REAL_MODE = Boolean(JC.mid && JC.pass && JC.salt);

// POST /api/payments/jazzcash/pay
// body: { orderCodes: ['IC-2025-XXXXXX'], amount: 50000, phone: '03001234567', cnic: '123456' }
router.post('/jazzcash/pay', async (req, res) => {
  try {
    const { orderCodes, amount, phone, cnic } = req.body;

    if (!Array.isArray(orderCodes) || orderCodes.length === 0) {
      return res.status(400).json({ success: false, message: 'No order codes received.' });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }
    if (!/^03\d{9}$/.test(String(phone || ''))) {
      return res.status(400).json({ success: false, message: 'Invalid JazzCash mobile number. Format: 03001234567' });
    }
    if (!/^\d{6}$/.test(String(cnic || ''))) {
      return res.status(400).json({ success: false, message: 'Invalid CNIC last 6 digits.' });
    }

    let txnRef;
    let mode = 'simulation';

    if (REAL_MODE) {
      // ---- REAL JazzCash Sandbox protocol (HMAC-SHA256) ----
      mode = 'sandbox';
      txnRef = `T${stamp()}${Math.floor(100 + Math.random() * 900)}`;
      const now = new Date();
      const expiry = new Date(now.getTime() + 60 * 60 * 1000);
      const dt = (d) => {
        const p = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
      };

      const params = {
        pp_Version: '2.0',
        pp_TxnType: 'MWALLET',
        pp_Language: 'EN',
        pp_MerchantID: JC.mid,
        pp_Password: JC.pass,
        pp_TxnRefNo: txnRef,
        pp_Amount: String(Math.round(Number(amount) * 100)), // rupees -> paisa
        pp_TxnDateTime: dt(now),
        pp_TxnExpiryDateTime: dt(expiry),
        pp_BillReference: 'IBADAHCONNECT',
        pp_Description: 'IbadahConnect Order Payment',
        pp_MobileNumber: String(phone),
        pp_CNICLast6Digits: String(cnic),
      };

      const hashString = Object.keys(params).sort().map((k) => params[k]).join('&');
      params.pp_SecureHash = crypto
        .createHmac('sha256', JC.salt)
        .update(hashString)
        .digest('hex')
        .toUpperCase();

      try {
        const gRes = await fetch('https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        const gateway = await gRes.json();
        if (String(gateway.pp_ResponseCode) !== '000') {
          return res.status(402).json({
            success: false,
            message: gateway.pp_ResponseMessage || 'JazzCash payment was declined by the gateway.',
            responseCode: gateway.pp_ResponseCode,
          });
        }
      } catch (gwErr) {
        return res.status(502).json({ success: false, message: 'Could not reach JazzCash gateway. Please try again.' });
      }
    } else {
      // ---- SIMULATION mode (demo) ----
      txnRef = `JC${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
      await new Promise((r) => setTimeout(r, 1200)); // realistic processing delay
    }

    const result = await Order.updateMany(
      { orderCode: { $in: orderCodes } },
      { $set: { paymentStatus: 'Paid', paymentMethod: 'JazzCash', paymentRef: txnRef, paidAt: new Date() } }
    );

    res.json({
      success: true,
      mode,
      txnRef,
      ordersUpdated: result.modifiedCount,
      message: 'Payment successful. Your Ibadah orders are confirmed.',
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/payments/bank/submit
// body: { orderCodes: [...], senderName: 'Aqsa', receiptImage: 'data:image/png;base64,...' }
router.post('/bank/submit', async (req, res) => {
  try {
    const { orderCodes, senderName, receiptImage } = req.body;

    if (!Array.isArray(orderCodes) || orderCodes.length === 0) {
      return res.status(400).json({ success: false, message: 'No order codes received.' });
    }
    if (!senderName || !String(senderName).trim()) {
      return res.status(400).json({ success: false, message: 'Sender name is required.' });
    }
    const match = String(receiptImage || '').match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Please upload a valid receipt image (PNG, JPG or WEBP).' });
    }
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Receipt image is too large. Maximum size is 8MB.' });
    }

    const fileName = `bank-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, fileName), buffer);

    const paymentRef = `BT${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptUrl = `/uploads/${fileName}`;

    await Order.updateMany(
      { orderCode: { $in: orderCodes } },
      {
        $set: {
          paymentStatus: 'Under Review',
          paymentMethod: 'Bank Transfer',
          paymentRef,
          receiptUrl,
        },
      }
    );

    res.json({
      success: true,
      paymentRef,
      receiptUrl,
      message: 'Receipt received. Admin will verify your payment within 24 hours.',
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;