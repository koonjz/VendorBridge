const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all vendors
router.get('/', auth, async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany();
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get vendor by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: { rfqs: true, quotations: true }
    });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create vendor
router.post('/', auth, async (req, res) => {
  try {
    const newVendor = await prisma.vendor.create({
      data: req.body
    });
    res.status(201).json(newVendor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update vendor
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedVendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updatedVendor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete vendor (Archive technically, but handling HTTP DELETE)
router.delete('/:id', auth, async (req, res) => {
  try {
    // In a real app we might just set status = 'Inactive'
    const updatedVendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { status: 'Inactive' }
    });
    res.json({ message: 'Vendor archived', vendor: updatedVendor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
