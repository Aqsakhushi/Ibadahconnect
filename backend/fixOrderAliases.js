// backend/fixOrderAliases.js — EK DAFa chalao
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const c = mongoose.connection.collection('orders');
  const r1 = await c.updateMany({ sponsorId: { $ne: null }, sponsor: null },   [{ $set: { sponsor: '$sponsorId' } }]);
  const r2 = await c.updateMany({ performerId: { $ne: null }, performer: null }, [{ $set: { performer: '$performerId' } }]);
  console.log('[FIX] sponsor synced:', r1.modifiedCount, '| performer synced:', r2.modifiedCount);
  await mongoose.disconnect();
})();