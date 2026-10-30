const express = require('express');
const User = require('../models/User');

const router = express.Router();

/* ------------------------------------------------------------------
   DEV SETUP ROUTE (sirf demo/testing ke liye)
   GET /api/devfix/performers

   Kya karta hai:
   - Sab Performers ko auto-assign ke liye eligible banata hai:
       isEmailVerified: true
       isVerified: true
   - CNIC sirf tab Verified karta hai jab abhi Unverified ho
   - Purane sab accounts (sponsors etc.) ka email bhi unlock karta hai

   Real flow waisa hi hai: performer signup -> email verify -> admin Verify.
   Yeh route sirf purane test accounts ko ek click mein fix karta hai.
------------------------------------------------------------------- */

router.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Dev fix tool is running. Open /api/devfix/performers in your browser.',
  });
});

router.get('/performers', async (req, res) => {
  try {
    // 1) Sab performers ko fully eligible banao
    const perf = await User.updateMany(
      { role: 'Performer' },
      { $set: { isEmailVerified: true, isVerified: true } }
    );

    // 2) CNIC: sirf Unverified ko Verified banao (Pending/Rejected ko touch nahi karta)
    const cnic = await User.updateMany(
      { role: 'Performer', cnicStatus: 'Unverified' },
      { $set: { cnicStatus: 'Verified' } }
    );

    // 3) Baaki purane accounts ka email verification bhi unlock
    const mails = await User.updateMany(
      { isEmailVerified: { $ne: true } },
      { $set: { isEmailVerified: true } }
    );

    // 4) Final eligible performers ki list wapas bhejo
    const eligible = await User.find({
      role: 'Performer',
      isEmailVerified: true,
      isVerified: true,
    })
      .select('firstName lastName email city cnicStatus')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Dev fix complete! All performers are now eligible for auto-assignment.',
      performersUpdated: perf.modifiedCount,
      cnicSetToVerified: cnic.modifiedCount,
      emailsUnlocked: mails.modifiedCount,
      eligiblePerformers: eligible.map((p) => ({
        name: `${p.firstName} ${p.lastName}`,
        email: p.email,
        city: p.city || '',
        cnicStatus: p.cnicStatus || 'Unverified',
      })),
    });
  } catch (err) {
    console.error('[DEVFIX] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Dev fix failed: ' + err.message });
  }
});

module.exports = router;