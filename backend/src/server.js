const dotenv = require('dotenv');
dotenv.config();

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production' || process.env.USE_MOCK_DB !== 'true') {
  const requiredVars = ['JWT_SECRET', 'MONGODB_URI', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  if (process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }
}

const app = require('./app');
const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (process.env.USE_MOCK_DB !== 'true') {
    await connectDB(process.env.MONGODB_URI);
    await seedAdmin();
  } else {
    console.log('Running in MOCK mode - no database required');
  }
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
