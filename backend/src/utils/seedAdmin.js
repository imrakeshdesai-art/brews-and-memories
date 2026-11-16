const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  // 1. Seed Admin
  const rawAdminEmail = process.env.ADMIN_EMAIL;
  const rawAdminPassword = process.env.ADMIN_PASSWORD;

  if (rawAdminEmail && rawAdminPassword) {
    const adminEmail = rawAdminEmail.toLowerCase().trim();
    const adminPassword = rawAdminPassword.trim();
    await User.deleteMany({ role: 'admin', email: { $ne: adminEmail } });

    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'admin',
      },
      { upsert: true, new: true }
    );
    console.log(`[SEED] Admin user synced with verified bcrypt hash: ${adminEmail}`);
  } else {
    console.warn('⚠️ WARNING: ADMIN_EMAIL or ADMIN_PASSWORD environment variables are not configured. Admin seeding skipped.');
  }

  // 2. Seed Kitchen Staff
  const kitchenEmail = (process.env.KITCHEN_EMAIL || 'kitchen@brews-memories.local').toLowerCase().trim();
  const rawKitchenPassword = process.env.KITCHEN_PASSWORD || 'Kitchen123!';
  const kitchenPassword = rawKitchenPassword.trim();

  await User.deleteMany({ role: 'kitchen', email: { $ne: kitchenEmail } });

  const hashedKitchenPassword = await bcrypt.hash(kitchenPassword, 10);
  await User.findOneAndUpdate(
    { email: kitchenEmail },
    {
      email: kitchenEmail,
      password: hashedKitchenPassword,
      role: 'kitchen',
    },
    { upsert: true, new: true }
  );
  console.log(`[SEED] Kitchen staff user synced with verified bcrypt hash: ${kitchenEmail}`);
}

module.exports = seedAdmin;
