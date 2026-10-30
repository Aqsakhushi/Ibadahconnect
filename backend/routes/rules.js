const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Rule = require('../models/Rule');

// Default rules — English version (aggregated by category for better UI parsing)
const DEFAULT_RULES = `CONDUCT & INTEGRITY
1. Sincerity (Niyyah): Perform every Ibadah solely for the pleasure of Allah, and treat the sponsor's trust with complete care.
2. Honesty & Integrity: Submitting any false proof or misleading information will result in immediate account suspension.
3. Confidentiality (Amanah): The sponsor's personal details (name, contact, address) are for task use only — never share them with anyone.

TASK EXECUTION
4. Video Proof: Every milestone must be completed with clear video or photo proof (YouTube / Google Drive link).
5. Timeliness: Start your task as soon as it is assigned. If any difficulty arises, inform the Admin via Live Chat immediately.
6. One Task at a Time: A performer may only have one active task at a time.
7. Ritual Method: Umrah / Hajj Badal must be performed in full accordance with Shariah and the sponsor's provided details (gender, reason, dua requests).

PRIVACY & COMPENSATION
8. Price Privacy: Donation order amounts are hidden from performers — Price Hidden, Rules & Regulations Apply.
9. Feedback: Upon task completion, the sponsor's feedback is recorded on your profile.
10. Compensation: You will receive 85% of each task's value as compensation, released after the task is completed and verified.`;

// ===== GET: Rules (performer portal) =====
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

// ===== PUT: Rules update (Admin only — JWT + role check) =====
router.put('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Login required — only Admin can update the rules.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
    }

    if (decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Admin can update the rules.' });
    }

    const { title, content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Rules content cannot be empty.' });
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

    res.json({ message: 'Rules updated successfully! All performers will now see the new rules. ✅', rule });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;