const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================================
// FILE UPLOAD SYSTEM (Profile Pic + Proof Photos)
// Files backend/uploads/ folder mein save hoti hain aur
// /uploads/<filename> URL se serve hoti hain (static).
// ============================================================

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---- JWT check (har logged-in role allow) ----
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Login required — token nahi mila.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ibadahsecret');
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalid ya expire ho gaya.' });
  }
}

// ---- Multer config (disk storage, unique filename, image-only) ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, `${file.fieldname}-${req.user.id}-${Date.now()}${safeExt}`);
  }
});

const uploader = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB cap
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Sirf image files allowed hain (JPG/PNG/WebP).'));
  }
});

// ---- POST /api/upload/profile-pic (profile photo, max 8MB) ----
router.post('/profile-pic', requireAuth, uploader.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File nahi mili — dobara try karein.' });
  res.json({
    success: true,
    url: `/uploads/${req.file.filename}`,
    message: 'Profile picture upload ho gayi!'
  });
});

// ---- POST /api/upload/proof (milestone proof photo, max 8MB) ----
router.post('/proof', requireAuth, uploader.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File nahi mili — dobara try karein.' });
  res.json({
    success: true,
    url: `/uploads/${req.file.filename}`,
    message: 'Proof photo upload ho gayi! Ab AI check chal raha hai...'
  });
});

// ---- Multer/upload errors ko friendly message mein badlo ----
router.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File bohot bari hai — max 8MB.' });
  }
  return res.status(400).json({ message: (err && err.message) || 'Upload fail hua.' });
});

module.exports = router;