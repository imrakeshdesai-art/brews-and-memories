const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { user, pass } = req.body;

    if (!user || !pass) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    // ✅ Validate admin
    if (
      user === process.env.ADMIN_USER &&
      pass === process.env.ADMIN_PASS
    ) {
      // 🔥 CREATE TOKEN
      const token = jwt.sign(
        { role: 'admin', username: user },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      // ✅ RETURN TOKEN
      return res.json({
        success: true,
        token: token
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });

  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;