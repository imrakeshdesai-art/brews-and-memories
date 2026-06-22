const mongoose = require('mongoose');

// Mock mongoose connect
mongoose.connect = async () => {
  console.log('Mocked database connection');
};

try {
  const app = require('../backend/src/app');
  console.log('Successfully loaded app.js!');
  
  const server = require('../backend/src/server');
  console.log('Successfully loaded server.js!');
} catch (err) {
  console.error('BOOT ERROR:', err);
}
