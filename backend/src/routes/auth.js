const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/login
// Body: { user, pass }
router.post('/login', async (req, res) => {
  try {
    const { user, pass } = req.body;

    if (!user || !pass) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    const admin = await User.findOne({ email: String(user).toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(pass);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { role: admin.role, username: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    return res.json({ success: true, token, role: admin.role });

  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
