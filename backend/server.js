const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models Import
const User = require('./models/User');
const Package = require('./models/Package');

// Routes Import
const authRoute = require('./routes/auth');
const ordersRoute = require('./routes/orders');
const packagesRoute = require('./routes/packages');
const paymentRoute = require('./routes/payment');

dotenv.config();
const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use('/api/auth', authRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/packages', packagesRoute);
app.use('/api/payment', paymentRoute);

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully ✅');
    
    // 1. Create Default User if not exists
    const existingUser = await User.findOne({ email: 'aqsa@ibadah.com' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await User.create({ 
        firstName: 'First Name', 
        lastName: 'Last Name', 
        country: 'Pakistan', 
        phone: '03001234567', 
        email: 'aqsa@ibadah.com', 
        password: hashedPassword, 
        role: 'Sponsor' 
      });
      console.log('Default user created: aqsa@ibadah.com');
    } else {
      // Agar user pehle se hai lekin naam galat hai toh usko theek kar do
      if (existingUser.firstName !== 'First Name' || existingUser.lastName !== 'Last Name') {
        existingUser.firstName = 'First Name';
        existingUser.lastName = 'Last Name';
        await existingUser.save();
        console.log('Default user updated to: First Name Last Name');
      }
    }

    // 2. Default 9 Packages Seeder (Force Sync)
    console.log('Syncing 9 default packages to database...');
    await Package.deleteMany({}); 
    await Package.insertMany([
      { title: "Economy Umrah", price: 50000, desc: "Essential Umrah Badal with photo updates.", category: "Umrah Badal", image: "/images/umrah1.jpg" },
      { title: "Standard Umrah", price: 80000, desc: "Enhanced service with video documentation.", category: "Umrah Badal", image: "/images/umrah2.jpg" },
      { title: "VIP Umrah Badal", price: 150000, desc: "VIP performer & live stream.", category: "Umrah Badal", image: "/images/umrah3.jpg" },
      { title: "Economy Hajj", price: 300000, desc: "Essential Hajj Badal with photo updates.", category: "Hajj Badal", image: "/images/hajj1.jpg" },
      { title: "Standard Hajj", price: 500000, desc: "Enhanced Hajj service with video documentation.", category: "Hajj Badal", image: "/images/hajj2.jpg" },
      { title: "VIP Hajj Badal", price: 700000, desc: "VIP performer & live stream.", category: "Hajj Badal", image: "/images/hajj3.jpg" },
      { title: "Ramadan Umrah", price: 150000, desc: "Perform Umrah in the blessed month of Ramadan.", category: "Umrah Badal", image: "/images/umrah2.jpg" },
      { title: "Video Proof Hajj", price: 600000, desc: "Complete video evidence of all Hajj rituals.", category: "Hajj Badal", image: "/images/hajj1.jpg" },
      { title: "Express Umrah", price: 100000, desc: "Priority booking and fastest execution.", category: "Umrah Badal", image: "/images/umrah3.jpg" }
    ]);
    console.log('9 Default Packages synced successfully!');
  })
  .catch((err) => console.log('MongoDB Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server running on  ${PORT} !`); });