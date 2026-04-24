const User = require('../models/User');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@brews-memories.local';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return;
  }

  await User.create({
    email: email.toLowerCase().trim(),
    password,
    role: 'admin',
  });

  console.log(`Created default admin user: ${email}`);
}

module.exports = seedAdmin;
