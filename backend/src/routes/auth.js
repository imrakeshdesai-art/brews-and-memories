const express = require('express');
const router = express.Router();

// ==================== SIMPLE ADMIN LOGIN ====================
router.post('/login', (req, res) => {
  try {
    const { user, pass } = req.body;

    if (!user || !pass) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    // Debug (safe)
    console.log("Incoming:", user);
    console.log("Expected:", process.env.ADMIN_USER);

    if (
      user === process.env.ADMIN_USER &&
      pass === process.env.ADMIN_PASS
    ) {
      return res.json({
        success: true,
        message: 'Login successful'
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