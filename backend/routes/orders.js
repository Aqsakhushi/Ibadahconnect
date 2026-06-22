const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Create new order
router.post('/create', async (req, res) => {
    try {
        const { sponsor, serviceType, recipientName, recipientRelation, price } = req.body;
        const newOrder = new Order({ sponsor, serviceType, recipientName, recipientRelation, price });
        await newOrder.save();
        res.status(201).json({ message: "Order booked successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error booking order" });
    }
});

// Fetch sponsor orders
router.get('/my-orders/:sponsorId', async (req, res) => {
    try {
        const orders = await Order.find({ sponsor: req.params.sponsorId }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
});

// GET ALL ORDERS (Sirf Admin ke liye - Sponsor ki bookings dekhne ke liye)
router.get('/all', async (req, res) => {
    try {
        const orders = await Order.find().populate('sponsor', 'firstName lastName email').sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching all orders" });
    }
});

// Update milestone
router.put('/update-milestone/:orderId', async (req, res) => {
    try {
        const { milestoneIndex, proofUrl } = req.body;
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: "Order not found!" });

        if (order.milestones[milestoneIndex]) {
            order.milestones[milestoneIndex].isCompleted = true;
            if (proofUrl) order.milestones[milestoneIndex].proofUrl = proofUrl;
        }

        const allCompleted = order.milestones.every(m => m.isCompleted);
        if (allCompleted) order.status = 'Completed';
        else order.status = 'In Progress';

        await order.save();
        res.status(200).json({ message: "Milestone updated successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error updating milestone" });
    }
});

module.exports = router;