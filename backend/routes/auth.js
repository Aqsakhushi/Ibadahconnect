const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Signup Route
router.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, country, phone, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already registered." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ firstName, lastName, country, phone, email, password: hashedPassword, role });
        await newUser.save();
        res.status(201).json({ message: "Account created successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Hardcoded Admin Login
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

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({ 
            token: token, 
            user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } 
        });
    } catch (error) {
        res.status(500).json({ message: "Server error during login", error: error.message });
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

module.exports = router;