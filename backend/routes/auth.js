const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

/* ══════════════════════════════════════════════════════════════
   CNIC IMAGE UPLOAD (multer disk storage)
   Saved to backend/uploads/cnic — served by server.js static
   middleware at /uploads/cnic/<filename>
   ══════════════════════════════════════════════════════════════ */
const CNIC_DIR = path.join(__dirname, '..', 'uploads', 'cnic');
if (!fs.existsSync(CNIC_DIR)) fs.mkdirSync(CNIC_DIR, { recursive: true });

const cnicStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CNIC_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    cb(null, `cnic-${Date.now()}-${Math.round(Math.random() * 1000000)}${ext}`);
  },
});

const cnicUpload = multer({
  storage: cnicStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (/\/(jpe?g|png|webp)$/i.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG or WEBP images are allowed.'));
  },
});

/* JSON-error wrapper around multer (avoids HTML error pages) */
const cnicUploadMiddleware = (req, res, next) => {
  cnicUpload.any()(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'File upload failed.' });
    next();
  });
};

/* Pick the first uploaded file (any field name works) */
const pickCnicFile = (req) =>
  req.files && req.files.length
    ? req.files.find((f) => /cnic/i.test(f.fieldname)) || req.files[0]
    : null;

/* Consistent public user shape for the frontend */
const publicUser = (u) => ({
  id: u._id,
  name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
  firstName: u.firstName || '',
  lastName: u.lastName || '',
  email: u.email,
  phone: u.phone || '',
  country: u.country || '',
  role: u.role || 'Sponsor',
  isEmailVerified: !!u.isEmailVerified,
  isVerified: !!u.isVerified,
  cnicStatus: u.cnicStatus || '',
});

/* ══════════════════════════════════════════════════════════════
   ROUTE 1 — REGISTER
   Accepts: firstName, lastName, email, phone, country,
            cnicNumber (optional), cnic image (optional multipart),
            role (Sponsor | Performer), password
   ══════════════════════════════════════════════════════════════ */
router.post('/register', cnicUploadMiddleware, async (req, res) => {
  try {
    const body = req.body || {};

    // Support both new (firstName/lastName) and legacy (name) clients
    let firstName = (body.firstName || '').trim();
    let lastName = (body.lastName || '').trim();
    if (!firstName && body.name) {
      const parts = String(body.name).trim().split(/\s+/);
      firstName = parts.shift() || '';
      lastName = lastName || parts.join(' ');
    }

    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');
    const phone = String(body.phone || '').trim();
    const country = String(body.country || '').trim();
    const cnicNumber = String(body.cnicNumber || '').trim();
    const role = String(body.role || 'Sponsor').trim() === 'Performer' ? 'Performer' : 'Sponsor';

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'First name, last name, email and password are required.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'This email is already registered. Please log in.' });
    }

    // Optional CNIC picture uploaded together with the form
    const cnicFile = pickCnicFile(req);
    const cnicImageUrl = cnicFile ? `/uploads/cnic/${cnicFile.filename}` : '';

    const hasCnic = Boolean(cnicNumber || cnicImageUrl);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      country,
      cnicNumber,
      cnicImage: cnicImageUrl,
      role,
      isEmailVerified: false,
      // Performers go through CNIC verification before auto-assignment
      cnicStatus: role === 'Performer' ? (hasCnic ? 'Pending' : '') : undefined,
      isVerified: role === 'Performer' ? false : undefined,
    });

    await user.save();

    console.log(
      `[REGISTER] New ${role}: ${firstName} ${lastName} <${email}>${cnicImageUrl ? ` | CNIC image: ${cnicImageUrl}` : ''}`
    );

    res.status(201).json({
      message: 'Account created successfully. You can now log in.',
      user: publicUser(user),
    });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

/* ══════════════════════════════════════════════════════════════
   ROUTE 2 — VERIFY CNIC (OCR)
   Upload a CNIC picture -> image saved + digits extracted (if
   tesseract.js is installed) -> CNIC field auto-fills on the
   register page. Without tesseract.js the image still uploads
   and the number can be typed manually (field is optional).
   Install OCR support:  npm install tesseract.js
   ══════════════════════════════════════════════════════════════ */
router.post('/verify-cnic', cnicUploadMiddleware, async (req, res) => {
  try {
    const file = pickCnicFile(req);
    if (!file) return res.status(400).json({ message: 'CNIC image is required.' });

    const imageUrl = `/uploads/cnic/${file.filename}`;
    let cnicNumber = '';

    try {
      const Tesseract = require('tesseract.js'); // optional dependency
      const result = await Tesseract.recognize(file.path, 'eng');
      const ocrText = (result && result.data && result.data.text) || '';
      const cleaned = ocrText.replace(/[^0-9-]/g, '');
      const match = cleaned.match(/\d{5}-\d{7}-\d/) || cleaned.match(/\d{13}/);
      if (match) {
        const digits = match[0].replace(/[^0-9]/g, '');
        if (digits.length === 13) {
          cnicNumber = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
        }
      }
    } catch (e) {
      console.log('[CNIC OCR] tesseract.js not available — manual entry required.');
    }

    res.json({
      message: cnicNumber
        ? 'CNIC number extracted successfully.'
        : 'Image uploaded, but OCR could not read the number — please type it manually.',
      cnicNumber,
      imageUrl,
    });
  } catch (err) {
    console.error('[VERIFY-CNIC ERROR]', err);
    res.status(500).json({ message: 'CNIC verification failed. Please try again.' });
  }
});

/* ══════════════════════════════════════════════════════════════
   ROUTE 3 — LOGIN (simple, no email-verification blocker)
   ══════════════════════════════════════════════════════════════ */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: (email || '').toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password || '', user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'ibadahconnect_jwt_secret',
      { expiresIn: '7d' }
    );

    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

/* ══════════════════════════════════════════════════════════════
   ROUTE 4 — GET CURRENT LOGGED-IN USER (by token)
   ══════════════════════════════════════════════════════════════ */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ibadahconnect_jwt_secret');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

module.exports = router;