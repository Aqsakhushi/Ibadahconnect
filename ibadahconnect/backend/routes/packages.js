const express = require('express');
const router = express.Router();
const Package = require('../models/Package');

// ==========================================
// GET ALL PACKAGES
// Sponsor aur Admin dono ke liye
// ==========================================
router.get('/all', async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });

    res.status(200).json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({
      message: 'Error fetching packages'
    });
  }
});

// ==========================================
// GET SINGLE PACKAGE BY ID
// Checkout page ke liye
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const packageItem = await Package.findById(req.params.id);

    if (!packageItem) {
      return res.status(404).json({
        message: 'Package not found'
      });
    }

    res.status(200).json(packageItem);
  } catch (error) {
    console.error('Error fetching package by ID:', error);

    res.status(500).json({
      message: 'Error fetching package'
    });
  }
});

// ==========================================
// ADD PACKAGE
// Admin ke liye
// ==========================================
router.post('/add', async (req, res) => {
  try {
    const {
      title,
      price,
      desc,
      category,
      image
    } = req.body;

    const newPackage = new Package({
      title,
      price,
      desc,
      category,
      image
    });

    await newPackage.save();

    res.status(201).json({
      message: 'Package added successfully!',
      package: newPackage
    });
  } catch (error) {
    console.error('Error adding package:', error);

    res.status(500).json({
      message: 'Error adding package'
    });
  }
});

// ==========================================
// DELETE PACKAGE
// Admin ke liye
// ==========================================
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedPackage = await Package.findByIdAndDelete(
      req.params.id
    );

    if (!deletedPackage) {
      return res.status(404).json({
        message: 'Package not found'
      });
    }

    res.status(200).json({
      message: 'Package deleted successfully!'
    });
  } catch (error) {
    console.error('Error deleting package:', error);

    res.status(500).json({
      message: 'Error deleting package'
    });
  }
});

// ==========================================
// UPDATE PACKAGE
// Admin ke liye
// ==========================================
router.put('/update/:id', async (req, res) => {
  try {
    const {
      title,
      price,
      desc,
      category,
      image
    } = req.body;

    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      {
        title,
        price,
        desc,
        category,
        image
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedPackage) {
      return res.status(404).json({
        message: 'Package not found'
      });
    }

    res.status(200).json({
      message: 'Package updated successfully',
      package: updatedPackage
    });
  } catch (error) {
    console.error('Error updating package:', error);

    res.status(500).json({
      message: 'Error updating package'
    });
  }
});

module.exports = router;