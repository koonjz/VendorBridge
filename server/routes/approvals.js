const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', auth, async (req, res) => {
  try {
    const approvals = await prisma.approval.findMany({
      include: { rfq: true, quotation: true, vendor: true }
    });
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const newApproval = await prisma.approval.create({
      data: req.body,
      include: { rfq: true, quotation: true, vendor: true }
    });
    res.status(201).json(newApproval);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const updatedApproval = await prisma.approval.update({
      where: { id: req.params.id },
      data: req.body,
      include: { rfq: true, quotation: true, vendor: true }
    });
    res.json(updatedApproval);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
