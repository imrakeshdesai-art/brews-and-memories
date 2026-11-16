const User = require('../models/User');

async function seedAdmin() {
  // 1. Seed Admin
  const rawAdminEmail = process.env.ADMIN_EMAIL;
  const rawAdminPassword = process.env.ADMIN_PASSWORD;

  if (rawAdminEmail && rawAdminPassword) {
    const adminEmail = rawAdminEmail.toLowerCase().trim();
    const adminPassword = rawAdminPassword.trim();
    await User.deleteMany({ role: 'admin', email: { $ne: adminEmail } });

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      existingAdmin.password = adminPassword;
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log(`Synced and updated admin user: ${adminEmail}`);
    } else {
      await User.create({
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log(`Created default admin user: ${adminEmail}`);
    }
  } else {
    console.warn('⚠️ WARNING: ADMIN_EMAIL or ADMIN_PASSWORD environment variables are not configured. Admin seeding skipped.');
  }

  // 2. Seed Kitchen Staff
  const kitchenEmail = (process.env.KITCHEN_EMAIL || 'kitchen@brews-memories.local').toLowerCase().trim();
  const rawKitchenPassword = process.env.KITCHEN_PASSWORD || 'Kitchen123!';
  const kitchenPassword = rawKitchenPassword.trim();

  await User.deleteMany({ role: 'kitchen', email: { $ne: kitchenEmail } });

  const existingKitchen = await User.findOne({ email: kitchenEmail });
  if (existingKitchen) {
    existingKitchen.password = kitchenPassword;
    existingKitchen.role = 'kitchen';
    await existingKitchen.save();
    console.log(`Synced and updated kitchen user: ${kitchenEmail}`);
  } else {
    await User.create({
      email: kitchenEmail,
      password: kitchenPassword,
      role: 'kitchen',
    });
    console.log(`Created default kitchen user: ${kitchenEmail}`);
  }
}

module.exports = seedAdmin;
