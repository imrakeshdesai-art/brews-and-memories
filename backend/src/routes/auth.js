const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// POST /api/auth/login
// Body: { user, pass }
router.post('/login', (req, res) => {
  try {
    const { user, pass } = req.body;

    if (!user || !pass) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;

    if (!adminUser || !adminPass) {
      console.error('ADMIN_USER or ADMIN_PASS not set in .env');
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    if (user === adminUser && pass === adminPass) {
      const token = jwt.sign(
        { role: 'admin', username: user },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      return res.json({ success: true, token });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
