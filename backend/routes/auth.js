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
// GET SINGLE USER (Info dekhne ke liye)
router.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user" });
    }
});

// UPDATE USER (Info update karne ke liye)
router.put('/user/:id', async (req, res) => {
    try {
        const { firstName, lastName, email, role, country, phone } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { firstName, lastName, email, role, country, phone }, 
            { new: true }
        );
        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Error updating user" });
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
// GET ALL PERFORMERS (Sirf un logon ki list jo Performer select kar ke signup kiye)
router.get('/performers', async (req, res) => {
    try {
        const performers = await User.find({ role: 'Performer' }).select('-password');
        res.status(200).json(performers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching performers" });
    }
});

// VERIFY PERFORMER (Admin jab Approve dabaye toh status update ho jaye)
router.put('/verify-performer/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Performer not found" });
        
        user.isVerified = true; // Database mein verified true kar do
        await user.save();
        res.status(200).json({ message: "Performer verified successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error verifying performer" });
    }
});
// Performer jab task accept kare toh status change karna
// Performer jab task accept kare toh status change karna
router.put('/accept-task/:orderId', async (req, res) => {
    try {
        const { performerId } = req.body; // Frontend se performer ki ID aayegi
        
        // 1. Check karein ke kya is performer ka koi pehle se "In Progress" task to nahi hai?
        const existingTask = await Order.findOne({ performer: performerId, status: 'In Progress' });
        if (existingTask) {
            return res.status(400).json({ message: "You already have an active task. Please complete it first to accept a new one." });
        }

        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });
        
        // 2. Agar task kisi aur ne accept kar liya ho
        if (order.status !== 'Pending') {
            return res.status(400).json({ message: "This task has already been taken by another performer." });
        }

        // 3. Task is performer ko assign kar do
        order.status = 'In Progress';
        order.performer = performerId; // Database mein performer ki ID save ho gayi
        await order.save();
        
        res.status(200).json({ message: "Task accepted successfully! It is now assigned to you." });
    } catch (error) {
        res.status(500).json({ message: "Error accepting task" });
    }
});
module.exports = router;