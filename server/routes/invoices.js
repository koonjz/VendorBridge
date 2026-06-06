const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', auth, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { purchaseOrder: true, vendor: true }
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const newInvoice = await prisma.invoice.create({
      data: req.body,
      include: { purchaseOrder: true, vendor: true }
    });
    res.status(201).json(newInvoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const updatedInvoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: req.body,
      include: { purchaseOrder: true, vendor: true }
    });
    res.json(updatedInvoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
