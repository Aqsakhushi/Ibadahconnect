const express = require('express');
const router = express.Router();
const Package = require('../models/Package');

// GET ALL Packages (Sponsor aur Admin dono ke liye)
router.get('/all', async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching packages" });
  }
});

// ADD Package (Sirf Admin ke liye)
router.post('/add', async (req, res) => {
  try {
    const { title, price, desc, category, image } = req.body;
    const newPackage = new Package({ title, price, desc, category, image });
    await newPackage.save();
    res.status(201).json({ message: "Package added successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error adding package" });
  }
});

// DELETE Package (Sirf Admin ke liye)
router.delete('/delete/:id', async (req, res) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Package deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting package" });
  }
});

module.exports = router;