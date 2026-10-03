const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/sendEmail');

// ============================================================
// JWT helpers (agency endpoints ke liye inline auth)
// ============================================================
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Login required — token nahi mila.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'ibadahsecret');
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalid ya expire ho gaya.' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Sirf Admin hi ye action kar sakta hai.' });
    }
    next();
  });
}

// ============================================================
// CNIC UPLOAD SETUP (multer) — Feature #2
// Photos backend/uploads/cnic/ mein save hoti hain
// ============================================================
const cnicDir = path.join(__dirname, '..', 'uploads', 'cnic');
if (!fs.existsSync(cnicDir)) fs.mkdirSync(cnicDir, { recursive: true });

const cnicStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, cnicDir),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    cb(null, `cnic-${req.user.id}-${Date.now()}${ext}`);
  }
});

const cnicUpload = multer({
  storage: cnicStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB per image
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp)$/i.test(file.mimetype)) return cb(null, true);
    cb(new Error('Sirf JPG, PNG ya WEBP images allowed hain.'));
  }
});

// ============================================================
// Signup Route — performerType support (Ibadah Team | Self/Family)
// + naye AuthModal fields (city, referralCode, idNumber, languages, bio)
// + role case-insensitive: 'sponsor'/'Sponsor'/'SPONSOR' sab chalega
// + EMAIL VERIFICATION: token save + verification email auto-send
// ============================================================
router.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, country, phone, email, password, role, performerType, experience,
                city, referralCode, idNumber, languages, bio, hasIdDoc, hasProfilePhoto } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already registered." });

        // ROLE NORMALIZE — DB mein hamesha 'Sponsor' | 'Performer' save hota hai
        const r = String(role || '').toLowerCase();
        const finalRole = r === 'performer' ? 'Performer' : 'Sponsor';

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            firstName, lastName, country, phone, email,
            password: hashedPassword,
            role: finalRole,
            // Sirf Performer ke liye type save karo (Sponsor par default rehta hai)
            performerType: finalRole === 'Performer' ? (performerType || 'Ibadah Team') : 'Ibadah Team',
            experience: experience || '',
            // Naye AuthModal fields (optional — na aayen to default)
            city: city || '',
            referralCode: referralCode || '',
            idNumber: idNumber || '',
            languages: languages || '',
            bio: bio || '',
            hasIdDoc: !!hasIdDoc,
            hasProfilePhoto: !!hasProfilePhoto
        });

        // ================= EMAIL VERIFICATION (nodemailer) =================
        // Token save karo, phir verification email bhejo.
        // Email fire-and-forget hai — signup response slow nahi hota.
        // SMTP fail ho to bhi link terminal pe print ho jata hai (dev fallback).
        const rawToken = crypto.randomBytes(32).toString('hex');
        newUser.emailVerificationToken = rawToken;
        newUser.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await newUser.save();
        sendVerificationEmail(newUser, rawToken);

        res.status(201).json({ message: "Account created! Please check your email to verify your account." });
    } catch (error) {
        console.error("SIGNUP ERROR:", error.message); // ab terminal mein asli error dikhega
        res.status(500).json({ message: "Server error" });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Hardcoded Admin Login (email verification se bypass — admin ka apna hai)
        if (email === "admin@ibadah.com" && password === "admin123") {
            const token = jwt.sign({ id: "admin_id", role: "Admin" }, process.env.JWT_SECRET, { expiresIn: '7d' });
            return res.status(200).json({
                message: "Admin Login successful!",
                token: token,
                user: { id: "admin_id", firstName: "Super", lastName: "Admin", email: email, role: "Admin" }
            });
        }

        // 2. Normal User Login
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid email or password." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password." });

        // ================= EMAIL VERIFICATION GUARD =================
        // Jab tak email verify nahi hui, login block.
        if (user.isEmailVerified === false) {
            return res.status(403).json({
                message: "Please verify your email first. Check your inbox for the verification link.",
                needsVerification: true,
                email: user.email
            });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            token: token,
            user: {
                id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email,
                role: user.role, profilePic: user.profilePic || '', isVerified: user.isVerified,
                isEmailVerified: user.isEmailVerified,
                cnicStatus: user.cnicStatus || 'Unverified',
                performerType: user.performerType || 'Ibadah Team', agencyConnect: user.agencyConnect || 'None',
                agencyName: user.agencyName || '', agencyWebsite: user.agencyWebsite || '',
                city: user.city || '', umrahProof: user.umrahProof || ''
            }
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error.message);
        res.status(500).json({ message: "Server error during login", error: error.message });
    }
});

// ============================================================
// EMAIL VERIFICATION ROUTES
// ============================================================

// POST /verify-email — token se email verify karta hai (VerifyEmailPage isko call karta hai)
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "Verification token missing." });

        const user = await User.findOne({ emailVerificationToken: token });
        if (!user) return res.status(400).json({ message: "Invalid or already used verification link." });

        if (!user.emailVerificationExpires || user.emailVerificationExpires < Date.now()) {
            return res.status(400).json({ message: "Verification link expired. Please request a new one." });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = '';
        user.emailVerificationExpires = null;
        await user.save();

        res.status(200).json({ message: "Email verified successfully! You can now log in." });
    } catch (error) {
        console.error("VERIFY EMAIL ERROR:", error.message);
        res.status(500).json({ message: "Server error during verification" });
    }
});

// POST /resend-verification — naya verification email bhejta hai
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        // Security: user exist kare ya na — same message (email enumeration se bachav)
        if (!user) return res.status(200).json({ message: "If that email is registered, a verification link has been sent." });
        if (user.isEmailVerified) return res.status(400).json({ message: "This account is already verified. Please log in." });

        // Throttle: agar token abhi bhi valid hai (24h ke andar) to wahi token dobara bhejo
        let token = user.emailVerificationToken;
        if (!token || !user.emailVerificationExpires || user.emailVerificationExpires < Date.now()) {
            token = crypto.randomBytes(32).toString('hex');
            user.emailVerificationToken = token;
            user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
            await user.save();
        }
        sendVerificationEmail(user, token);

        res.status(200).json({ message: "Verification email sent! Please check your inbox." });
    } catch (error) {
        console.error("RESEND VERIFICATION ERROR:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

// GET ALL USERS (Sirf Admin ke liye)
router.get('/all-users', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }).select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
});

// GET SINGLE USER (Info dekhne ke liye)
router.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user" });
    }
});

// ============================================================
// UPDATE USER (Profile edit + password change + performerType)
// Sirf jo fields bheji hain wohi update hoti hain
// ============================================================
router.put('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        const { firstName, lastName, email, role, country, phone, profilePic,
                currentPassword, newPassword, performerType, experience, umrahProof } = req.body;
        // Sirf jo fields aayi hain wohi update karo (baqi untouched rahengi)
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (email !== undefined) user.email = email;
        if (role !== undefined) user.role = role;
        if (country !== undefined) user.country = country;
        if (phone !== undefined) user.phone = phone;
        if (profilePic !== undefined) user.profilePic = profilePic;
        if (experience !== undefined) user.experience = experience;
        if (umrahProof !== undefined) user.umrahProof = umrahProof;
        // Performer type change (performer khud ya Admin — dono allowed)
        if (performerType !== undefined && user.role === 'Performer') {
            if (!['Ibadah Team', 'Self/Family'].includes(performerType)) {
                return res.status(400).json({ message: "performerType 'Ibadah Team' ya 'Self/Family' ho sakta hai." });
            }
            user.performerType = performerType;
        }

        // PASSWORD CHANGE (optional): dono fields aayen to hi chalega
        if (newPassword) {
            if (!currentPassword) return res.status(400).json({ message: "Current password zaroori hai." });
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(400).json({ message: "Current password galat hai." });
            if (String(newPassword).length < 6) return res.status(400).json({ message: "Naya password kam az kam 6 characters ka ho." });
            user.password = await bcrypt.hash(newPassword, 10);
        }

        await user.save();
        const safe = user.toObject();
        delete safe.password; // password kabhi response mein nahi jata
        res.status(200).json({ message: "User updated successfully", user: safe });
    } catch (error) {
        res.status(500).json({ message: "Error updating user", error: error.message });
    }
});

// DELETE USER
router.delete('/user/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user" });
    }
});

// GET ALL PERFORMERS (Admin verification panel — pic, type, agency status sab included)
router.get('/performers', async (req, res) => {
    try {
        const performers = await User.find({ role: 'Performer' }).select('-password').sort({ createdAt: -1 });
        res.status(200).json(performers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching performers" });
    }
});

// VERIFY PERFORMER (Admin pic + details dekh kar Approve dabaye to verified)
router.put('/verify-performer/:id', requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Performer not found" });

        user.isVerified = req.body.isVerified !== undefined ? req.body.isVerified : true;
        await user.save();
        res.status(200).json({ message: user.isVerified ? "Performer verified successfully" : "Performer verification removed" });
    } catch (error) {
        res.status(500).json({ message: "Error verifying performer" });
    }
});

// ============================================================
// AGENCY CONNECT (Self/Family members ke liye)
// Rule: Self/Family performer agar KHUD Umrah karna chahta hai
// to hum use partner agency se connect kar dete hain.
// ============================================================

// POST /agency-request — Performer khud request bhejta hai
router.post('/agency-request', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.role !== 'Performer') return res.status(400).json({ message: "Sirf performers agency connect maang sakte hain." });

        if (user.agencyConnect === 'Connected') {
            return res.status(400).json({ message: `Aap pehle se connected hain: ${user.agencyName}` });
        }

        user.agencyConnect = 'Requested';
        await user.save();
        res.status(200).json({ message: "Agency connect request bhej di gayi! Admin jald contact karega.", agencyConnect: user.agencyConnect });
    } catch (error) {
        res.status(500).json({ message: "Error sending agency request" });
    }
});
// PUT /agency-connect/:id — Admin connect karta hai (agency NAME + WEBSITE ke sath)
router.put('/agency-connect/:id', requireAdmin, async (req, res) => {
    try {
        const { agencyName, agencyWebsite, action } = req.body; // action: 'connect' | 'reject'
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Performer not found" });

        if (action === 'reject') {
            user.agencyConnect = 'None';
            user.agencyName = '';
            user.agencyWebsite = '';
            await user.save();
            return res.status(200).json({ message: "Agency request rejected.", agencyConnect: user.agencyConnect });
        }

        if (!agencyName || !agencyName.trim()) {
            return res.status(400).json({ message: "Agency ka naam zaroori hai." });
        }

        user.agencyConnect = 'Connected';
        user.agencyName = agencyName.trim();
        // Website URL optional — normalize (www.rodtravel.pk → https://www.rodtravel.pk)
        let site = (agencyWebsite || '').trim();
        if (site && !/^https?:\/\//i.test(site)) site = 'https://' + site;
        user.agencyWebsite = site;
        await user.save();
        res.status(200).json({ message: `${user.firstName} connected with "${user.agencyName}"!`, agencyConnect: user.agencyConnect, agencyName: user.agencyName, agencyWebsite: user.agencyWebsite });
    } catch (error) {
        res.status(500).json({ message: "Error connecting agency" });
    }
});

// ============================================================
// CNIC VERIFICATION ROUTES (Feature #2 — Upload + Admin Verify)
// Status flow: Unverified -> Pending -> Verified | Rejected
// ============================================================

// POST /cnic/upload — Performer CNIC number + front/back photos submit karta hai
router.post('/cnic/upload', requireAuth, (req, res) => {
  cnicUpload.fields([
    { name: 'cnicFront', maxCount: 1 },
    { name: 'cnicBack', maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Upload failed. Max 5MB per image, sirf JPG/PNG/WEBP.' });
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (user.role !== 'Performer') return res.status(403).json({ message: 'Sirf Performers CNIC verify karwa sakte hain.' });
      if (user.cnicStatus === 'Verified') return res.status(400).json({ message: 'Aapki CNIC pehle se verified hai.' });

      const front = req.files && req.files.cnicFront ? req.files.cnicFront[0] : null;
      const back = req.files && req.files.cnicBack ? req.files.cnicBack[0] : null;
      if (!front || !back) return res.status(400).json({ message: 'CNIC ki front aur back — dono photos zaroori hain.' });

      // CNIC number normalize: dashes/spaces hatao, 13 digits check (Pakistani CNIC)
      const digits = String(req.body.cnicNumber || '').replace(/\D/g, '');
      if (digits.length !== 13) return res.status(400).json({ message: 'CNIC number poore 13 digits ka hona chahiye (e.g. 35202-1234567-8).' });

      user.cnicNumber = digits;
      user.cnicFrontImage = front.filename;
      user.cnicBackImage = back.filename;
      user.cnicStatus = 'Pending';
      user.cnicRejectionReason = '';
      await user.save();

      res.status(200).json({ message: 'CNIC submitted! Admin verification ke liye pending hai.', cnicStatus: user.cnicStatus });
    } catch (error) {
      console.error('CNIC UPLOAD ERROR:', error.message);
      res.status(500).json({ message: 'Server error during CNIC upload' });
    }
  });
});

// GET /cnic/status — performer apni CNIC status dekhta hai
router.get('/cnic/status', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('cnicNumber cnicFrontImage cnicBackImage cnicStatus cnicRejectionReason role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching CNIC status' });
  }
});

// GET /cnic/image/:filename — uploaded CNIC photo serve karta hai (sirf logged-in users)
router.get('/cnic/image/:filename', requireAuth, async (req, res) => {
  try {
    const safeName = path.basename(req.params.filename); // path traversal se bachav
    const filePath = path.join(cnicDir, safeName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Image not found' });
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: 'Error serving image' });
  }
});

// GET /cnic/admin/all — Admin ko sab CNIC submissions milte hain (Pending + Verified + Rejected)
router.get('/cnic/admin/all', requireAdmin, async (req, res) => {
  try {
    const subs = await User.find({ role: 'Performer', cnicStatus: { $ne: 'Unverified' } })
      .select('firstName lastName email city performerType cnicNumber cnicFrontImage cnicBackImage cnicStatus cnicRejectionReason updatedAt')
      .sort({ updatedAt: -1 });
    res.status(200).json(subs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching CNIC submissions' });
  }
});

// PUT /cnic/admin/verify/:id — Admin CNIC approve karta hai
router.put('/cnic/admin/verify/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Performer not found' });
    user.cnicStatus = 'Verified';
    user.cnicRejectionReason = '';
    await user.save();
    res.status(200).json({ message: `${user.firstName}'s CNIC verified successfully.` });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying CNIC' });
  }
});

// PUT /cnic/admin/reject/:id — Admin CNIC reject karta hai (reason ke sath)
router.put('/cnic/admin/reject/:id', requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Performer not found' });
    user.cnicStatus = 'Rejected';
    user.cnicRejectionReason = (reason && reason.trim()) ? reason.trim() : 'CNIC clear nahi thi. Baraye meharbani clear photos dobara upload karein.';
    await user.save();
    res.status(200).json({ message: `${user.firstName}'s CNIC rejected.` });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting CNIC' });
  }
});

// NOTE: accept-task route ab /api/orders/accept-task mein hai (orders.js) - duplicate yahan nahi chahiye
module.exports = router;