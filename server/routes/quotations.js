const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', auth, async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: { rfq: true, vendor: true }
    });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const newQuotation = await prisma.quotation.create({
      data: req.body,
      include: { rfq: true, vendor: true }
    });
    res.status(201).json(newQuotation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const updatedQuotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: req.body,
      include: { rfq: true, vendor: true }
    });
    res.json(updatedQuotation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
