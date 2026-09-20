const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Rule = require('../models/Rule');

// Default rules — agar Admin ne abhi tak rules upload nahi kiye to yeh nazar aayenge
const DEFAULT_RULES = `Assalamu Alaikum! IbadahConnect Performer Portal mein khush aamdeed. Yeh tamam rules har performer ke liye lazmi hain:

1. Niyyat: Har ibadah sirf Allah ki raza ke liye ada karein aur sponsor ki amanat ka poora khayal rakhein.
2. Video Proof: Har milestone ke sath clear video ya photo proof lazmi upload karein (YouTube / Google Drive link).
3. Waqt ki Pabandi: Task assign hote hi jald az jald start karein; kisi wajah se mushkil ho to Admin ko Live Chat mein itla dein.
4. Ek Waqt Ek Task: Ek performer ke paas ek waqt mein sirf ek active task ho sakta hai.
5. Price Privacy: Donation orders ki raqam performer ko nazar nahi aati — Price Hidden, Rules & Regulations Apply.
6. Ibadah ka Tarika: Umrah / Hajj Badal shariat ke mutabiq aur sponsor ki di hui tafseelat (gender, reason, dua) ke mutabiq ada karein.
7. Amanat: Sponsor ki maloomat (naam, raabta, address) sirf task ke liye use karein — kisi se share na karein.
8. Sachai aur Imanadari: Koi bhi jaali proof ya ghalat maloomat dena account suspension ka bais banega.
9. Feedback: Task mukammal hone par sponsor ka feedback aap ki profile par record hoga.
10. Muawza: Har task ke 85% hisse ke barabar ijrat task complete hone par milegi.`;

// ===== GET: Rules dekhna (performer portal ke liye) =====
router.get('/', async (req, res) => {
  try {
    let rule = await Rule.findOne().sort({ updatedAt: -1 });
    if (!rule) {
      return res.json({
        title: 'Performer Rules & Regulations',
        content: DEFAULT_RULES,
        updatedBy: 'IbadahConnect Team',
        updatedAt: new Date(),
        isDefault: true
      });
    }
    res.json(rule);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== PUT: Rules upload/update (sirf Admin — JWT + role check) =====
router.put('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Login required — sirf Admin rules upload kar sakta hai.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: 'Session expire ho gayi. Dobara login karein.' });
    }

    if (decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Sirf Admin hi rules upload kar sakta hai.' });
    }

    const { title, content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Rules ka text khali nahi ho sakta.' });
    }

    let rule = await Rule.findOne();
    if (rule) {
      rule.title = title || rule.title;
      rule.content = content;
      rule.updatedBy = 'Admin';
      await rule.save();
    } else {
      rule = await Rule.create({ title: title || 'Performer Rules & Regulations', content, updatedBy: 'Admin' });
    }

    res.json({ message: 'Rules upload ho gaye! Ab saare performers ko naye rules nazar aayenge. ✅', rule });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;