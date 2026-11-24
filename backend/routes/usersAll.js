// ============================================================
// IbadahConnect - usersAll.js  (v2.0 - GUARANTEED USERS ROUTE)
// PURPOSE (why this file exists):
//   The Admin Dashboard fetches GET /api/auth/all-users. When the
//   teammate's auth.js version does not expose that route, the
//   dashboard prints "Users: HTTP 404" while packages/orders still
//   load. This file GUARANTEES the route exists.
//
//   v2.0 = ROUTES ONLY. No seeder inside — the backend already
//   seeds default accounts at boot (see "[USERS] admin account
//   missing -> recreated" in the terminal). This file adds zero
//   side effects except one confirmation log.
//
// ============================================================
// MOUNT IN server.js — EXACTLY ONCE, EXACTLY HERE:
//
//   const app = express();
//   app.use(cors({ ... }));
//   app.use(express.json());            <-- express.json() FIRST
//   app.use('/api/auth', require('./routes/usersAll'));   <-- THIS LINE
//
//   Placement rules (this is where 404s come from):
//     - BEFORE any app.use('*' , ...) or catch-all 404 handler
//     - BEFORE app.listen(...)
//     - NOT inside this file, NOT inside any other routes file
//   If the same mount line already exists somewhere else in
//   server.js, DELETE the old copy and keep only this position.
//
// ============================================================
// HOW TO VERIFY (30 seconds):
//   1) Save server.js -> nodemon restarts -> the terminal MUST print:
//        [usersAll] routes ready -> GET /api/auth/all-users
//      No such line = server.js never required this file.
//   2) Open http://localhost:5000/api/auth/all-users in the browser.
//      A JSON array (even with just 1 user) = working. The dashboard
//      banner disappears within 15 seconds (auto-retry).
// ============================================================
const express = require('express');
const router = express.Router();
const User = require('../models/User');

console.log('[usersAll] routes ready -> GET /api/auth/all-users');

// ---------- THE ROUTE THE ADMIN DASHBOARD CALLS ----------
// Aliases: '/users' and '/users-all' answer too, so any dashboard
// version finds its endpoint under /api/auth.
const listUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('-password').lean();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

router.get(['/all-users', '/users', '/users-all'], listUsers);

module.exports = router;