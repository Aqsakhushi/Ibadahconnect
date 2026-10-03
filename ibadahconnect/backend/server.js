const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Models Import
const User = require('./models/User');
const Package = require('./models/Package');

// Routes Import
const authRoute = require('./routes/auth');
const ordersRoute = require('./routes/orders');
const packagesRoute = require('./routes/packages');
const paymentRoute = require('./routes/payments'); 
const paymentAdminRoute = require('./routes/payment-admin');
const rulesRoute = require('./routes/rules');
const ocrRoute = require('./routes/ocr');
const uploadRoute = require('./routes/upload');
const performerOrdersRoute = require('./routes/performerOrders');
const trackRoute = require('./routes/track');
const chatRoute = require('./routes/chat'); // NEW: sponsor <-> performer chat

// Legacy payment route (optional — agar purani payment.js hai to chalegi, warna skip)
let legacyPaymentRoute = null;
try { legacyPaymentRoute = require('./routes/payment'); } catch (e) { legacyPaymentRoute = null; }

dotenv.config();
const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '15mb' }));
// API Routes
app.use('/api/auth', authRoute);
app.use('/api/orders/performer', performerOrdersRoute); // MUST stay BEFORE /api/orders
app.use('/api/orders', ordersRoute);
app.use('/api/devfix', require('./routes/devfix'));
app.use('/api/packages', packagesRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/payments-admin', paymentAdminRoute);
if (legacyPaymentRoute) app.use('/api/payment', legacyPaymentRoute); // old route (optional)
app.use('/api/rules', rulesRoute);
app.use('/api/proof', ocrRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/track', trackRoute);
app.use('/api/chat', chatRoute); // NEW

// Serve uploaded files (profile pics + proof photos + bank receipts)
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

// MongoDB Connection + Seeders (SINGLE chain - do not split)
mongoose
  .connect(process.env.MONGO_URI, {
    family: 4,
    serverSelectionTimeoutMS: 30000,
  })
  .then(async () => {
    console.log('MongoDB Connected');

    // 1. Default User
    const existingUser = await User.findOne({ email: 'aqsa@ibadah.com' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await User.create({
        firstName: 'First Name',
        lastName: 'Last Name',
        country: 'Pakistan',
        phone: '03001234567',
        email: 'Someone@ibadah.com',
        password: hashedPassword,
        role: 'Sponsor',
      });
      console.log('Default user created: aqsa@ibadah.com');
       }

    // 2. Default 9 Packages Seeder (Force Sync)
        console.log('Syncing 9 default packages to database...');
    const DEFAULT_PACKAGES = [
      { title: 'Economy Umrah', price: 50000, desc: 'Essential Umrah Badal with photo updates.', category: 'Umrah Badal', image: '/images/umrah1.jpg' },
      { title: 'Standard Umrah', price: 80000, desc: 'Enhanced service with video documentation.', category: 'Umrah Badal', image: '/images/umrah2.jpg' },
      { title: 'VIP Umrah Badal', price: 150000, desc: 'VIP performer & live stream.', category: 'Umrah Badal', image: '/images/umrah3.jpg' },
      { title: 'Economy Hajj', price: 300000, desc: 'Essential Hajj Badal with photo updates.', category: 'Hajj Badal', image: '/images/hajj1.jpg' },
      { title: 'Standard Hajj', price: 500000, desc: 'Enhanced Hajj service with video documentation.', category: 'Hajj Badal', image: '/images/hajj2.jpg' },
      { title: 'VIP Hajj Badal', price: 700000, desc: 'VIP performer & live stream.', category: 'Hajj Badal', image: '/images/hajj3.jpg' },
      { title: 'Ramadan Umrah', price: 150000, desc: 'Perform Umrah in the blessed month of Ramadan.', category: 'Umrah Badal', image: '/images/umrah2.jpg' },
      { title: 'Video Proof Hajj', price: 600000, desc: 'Complete video evidence of all Hajj rituals.', category: 'Hajj Badal', image: '/images/hajj1.jpg' },
      { title: 'Express Umrah', price: 100000, desc: 'Priority booking and fastest execution.', category: 'Umrah Badal', image: '/images/umrah3.jpg' },
    ];
    for (const pkg of DEFAULT_PACKAGES) {
      await Package.findOneAndUpdate(
        { title: pkg.title },
        { $set: { price: pkg.price, desc: pkg.desc, category: pkg.category, image: pkg.image } },
        { upsert: true }
      );
    }
    console.log('9 Default Packages synced successfully!');
  })
  .catch((err) => console.log('MongoDB Error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT} !`);
});