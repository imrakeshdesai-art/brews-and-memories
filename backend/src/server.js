const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (process.env.USE_MOCK_DB !== 'true') {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is required when USE_MOCK_DB is not true');
      process.exit(1);
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error('JWT_SECRET must be at least 32 characters long');
      process.exit(1);
    }
    await connectDB(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } else {
    console.log('🧪 Running in MOCK mode — no database required');
    console.log(`   Admin user: ${process.env.ADMIN_USER || 'brews_admin'}`);
  }

  app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
    console.log(`   Mode: ${process.env.USE_MOCK_DB === 'true' ? 'Mock DB' : 'MongoDB'}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
