const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', auth, async (req, res) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: { rfq: true, quotation: true, vendor: true, approval: true }
    });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const newPo = await prisma.purchaseOrder.create({
      data: req.body,
      include: { rfq: true, quotation: true, vendor: true, approval: true }
    });
    res.status(201).json(newPo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const updatedPo = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: req.body,
      include: { rfq: true, quotation: true, vendor: true, approval: true }
    });
    res.json(updatedPo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
