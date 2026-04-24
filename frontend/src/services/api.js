router.post('/login', (req, res) => {
  try {
    const { user, pass } = req.body;

    if (!user || !pass) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    if (
      user === process.env.ADMIN_USER &&
      pass === process.env.ADMIN_PASS
    ) {
      return res.json({
        success: true,
        token: "mock_admin_token_123"
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