const mongoose = require('mongoose');

async function connectDB(uri) {
  const targetUri = uri || process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!targetUri) {
    throw new Error('MONGODB_URI (or MONGO_URI) is required in environment variables');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(targetUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('Connected to MongoDB');
}

module.exports = connectDB;
