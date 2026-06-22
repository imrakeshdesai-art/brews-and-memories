const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('No MONGODB_URI found in env');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  email: { type: String },
  role: { type: String }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const users = await User.find({});
  console.log('Users in DB:');
  users.forEach(u => {
    console.log(`- Email: ${u.email}, Role: ${u.role}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
