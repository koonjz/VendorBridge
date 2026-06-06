const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all RFQs
router.get('/', auth, async (req, res) => {
  try {
    const rfqs = await prisma.rfq.findMany({
      include: { assignedVendors: true }
    });
    res.json(rfqs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create RFQ
router.post('/', auth, async (req, res) => {
  try {
    const { assignedVendorIds, ...rfqData } = req.body;
    
    const connectVendors = assignedVendorIds ? assignedVendorIds.map(id => ({ id })) : [];

    const newRfq = await prisma.rfq.create({
      data: {
        ...rfqData,
        createdBy: req.user.id,
        assignedVendors: { connect: connectVendors }
      },
      include: { assignedVendors: true }
    });
    res.status(201).json(newRfq);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update RFQ
router.put('/:id', auth, async (req, res) => {
  try {
    const { assignedVendorIds, ...rfqData } = req.body;
    
    const updateData = { ...rfqData };
    if (assignedVendorIds) {
      updateData.assignedVendors = { set: assignedVendorIds.map(id => ({ id })) };
    }

    const updatedRfq = await prisma.rfq.update({
      where: { id: req.params.id },
      data: updateData,
      include: { assignedVendors: true }
    });
    res.json(updatedRfq);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete RFQ
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.rfq.delete({ where: { id: req.params.id } });
    res.json({ message: 'RFQ deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
