const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, vendorId: true, createdAt: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create user
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, password, role, vendorId } = req.body;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: { name, email, password: passwordHash, role, vendorId }
    });
    
    const userObj = { ...newUser };
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update user
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email, role }
    });
    
    const userObj = { ...updatedUser };
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete user
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
