const User = require('../models/User');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'brewsandmemoriescafe@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'Brews&MemoriesCafe!@2025';

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    existing.password = password; // Trigger mongoose pre-save hook to hash and save
    await existing.save();
    console.log(`Synced and updated existing admin user password: ${email}`);
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
