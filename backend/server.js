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

dotenv.config();
const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use('/api/auth', authRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/packages', packagesRoute);

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully ✅');
    
    // 1. Create Default User if not exists
    const existingUser = await User.findOne({ email: 'aqsa@ibadah.com' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await User.create({ 
        firstName: 'Aqsa', 
        lastName: 'Khushi', 
        country: 'Pakistan',
        phone: '03001234567',
        email: 'aqsa@ibadah.com', 
        password: hashedPassword, 
        role: 'Sponsor' 
      });
      console.log('Default user created: aqsa@ibadah.com');
    }

    // 2. Default 12 Packages Seeder (6 Umrah + 6 Hajj)
    const count = await Package.countDocuments();
    if (count === 0) {
      console.log('Adding 12 default packages to database...');
      await Package.insertMany([
        { title: "Economy Umrah", price: 50000, desc: "Essential Umrah Badal.", category: "Umrah Badal", image: "/images/noor.jpg" },
        { title: "Standard Umrah", price: 80000, desc: "Enhanced service.", category: "Umrah Badal", image: "/images/barakah.jpg" },
        { title: "Premium Umrah", price: 120000, desc: "Includes Sadaqah.", category: "Umrah Badal", image: "/images/jaryah.jpg" },
        { title: "Video Proof Umrah", price: 90000, desc: "Complete video evidence.", category: "Umrah Badal", image: "/images/barakah.jpg" },
        { title: "Express Umrah", price: 100000, desc: "Priority booking.", category: "Umrah Badal", image: "/images/noor.jpg" },
        { title: "VIP Umrah Badal", price: 250000, desc: "VIP performer & live stream.", category: "Umrah Badal", image: "/images/jaryah.jpg" },
        { title: "Economy Hajj", price: 300000, desc: "Essential Hajj Badal.", category: "Hajj Badal", image: "/images/hajj.jpg" },
        { title: "Standard Hajj", price: 500000, desc: "Enhanced Hajj service.", category: "Hajj Badal", image: "/images/hajj.jpg" },
        { title: "Premium Hajj", price: 800000, desc: "Includes Sadaqah.", category: "Hajj Badal", image: "/images/hajj.jpg" },
        { title: "Video Proof Hajj", price: 600000, desc: "Complete video evidence.", category: "Hajj Badal", image: "/images/hajj.jpg" },
        { title: "Express Hajj", price: 700000, desc: "Priority booking.", category: "Hajj Badal", image: "/images/hajj.jpg" },
        { title: "VIP Hajj Badal", price: 1000000, desc: "VIP performer & live stream.", category: "Hajj Badal", image: "/images/hajj.jpg" }
      ]);
      console.log('12 Default Packages added successfully!');
    }
  })
  .catch((err) => console.log('MongoDB Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server running on  ${PORT} !`); });