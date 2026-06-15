const User = require('../models/User');

async function seedAdmin() {
  // 1. Seed Admin
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const normalizedAdminEmail = adminEmail.toLowerCase().trim();
    await User.deleteMany({ role: 'admin', email: { $ne: normalizedAdminEmail } });

    const existingAdmin = await User.findOne({ email: normalizedAdminEmail });
    if (existingAdmin) {
      existingAdmin.password = adminPassword;
      await existingAdmin.save();
      console.log(`Synced and updated admin user: ${adminEmail}`);
    } else {
      await User.create({
        email: normalizedAdminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log(`Created default admin user: ${adminEmail}`);
    }
  } else {
    console.warn('⚠️ WARNING: ADMIN_EMAIL or ADMIN_PASSWORD environment variables are not configured. Admin seeding skipped.');
  }

  // 2. Seed Kitchen Staff
  const kitchenEmail = process.env.KITCHEN_EMAIL || 'kitchen@brews-memories.local';
  const kitchenPassword = process.env.KITCHEN_PASSWORD || 'Kitchen123!';
  const normalizedKitchenEmail = kitchenEmail.toLowerCase().trim();

  await User.deleteMany({ role: 'kitchen', email: { $ne: normalizedKitchenEmail } });

  const existingKitchen = await User.findOne({ email: normalizedKitchenEmail });
  if (existingKitchen) {
    existingKitchen.password = kitchenPassword;
    await existingKitchen.save();
    console.log(`Synced and updated kitchen user: ${kitchenEmail}`);
  } else {
    await User.create({
      email: normalizedKitchenEmail,
      password: kitchenPassword,
      role: 'kitchen',
    });
    console.log(`Created default kitchen user: ${kitchenEmail}`);
  }
}

module.exports = seedAdmin;
