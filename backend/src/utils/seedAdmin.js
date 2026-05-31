const User = require('../models/User');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('⚠️ WARNING: ADMIN_EMAIL or ADMIN_PASSWORD environment variables are not configured. Seeding skipped.');
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Clean up any old admin accounts to ensure only the active admin exists
  await User.deleteMany({ role: 'admin', email: { $ne: normalizedEmail } });

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    existing.password = password; // Trigger mongoose pre-save hook to hash and save
    await existing.save();
    console.log(`Synced and updated existing admin user password: ${email}`);
    return;
  }

  await User.create({
    email: normalizedEmail,
    password,
    role: 'admin',
  });

  console.log(`Created default admin user: ${email}`);
}

module.exports = seedAdmin;
