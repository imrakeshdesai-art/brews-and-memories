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
  const rawKitchenEmail = process.env.KITCHEN_EMAIL;
  const rawKitchenPassword = process.env.KITCHEN_PASSWORD;

  if (rawKitchenEmail && rawKitchenPassword && rawKitchenPassword.trim().length >= 8) {
    const kitchenEmail = rawKitchenEmail.toLowerCase().trim();
    const kitchenPassword = rawKitchenPassword.trim();

    // Purge old dummy email and any non-matching kitchen roles
    await User.deleteMany({ email: 'kitchen@brews-memories.local' });
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
  } else {
    console.warn('⚠️ WARNING: KITCHEN_EMAIL or KITCHEN_PASSWORD environment variables are not configured or too short (min 8 chars). Kitchen staff seeding skipped.');
  }
}

module.exports = seedAdmin;
