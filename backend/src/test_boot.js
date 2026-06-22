const mongoose = require('mongoose');

// Mock mongoose connect
mongoose.connect = async () => {
  console.log('Mocked database connection');
  return mongoose;
};

// Mock mongoose.connection events and seedAdmin
mongoose.connection = {
  on: () => {},
  once: () => {},
};

try {
  const app = require('./app');
  console.log('Successfully loaded app.js!');
  
  // We won't require server.js directly because it calls startServer() immediately
  // and listens on the port. But we can require connectDB and seedAdmin to verify them.
  const connectDB = require('./config/db');
  const seedAdmin = require('./utils/seedAdmin');
  console.log('Successfully loaded DB and Admin Utilities!');
  console.log('BOOT TEST PASSED SUCCESSFULLY!');
} catch (err) {
  console.error('BOOT ERROR:', err);
  process.exit(1);
}
