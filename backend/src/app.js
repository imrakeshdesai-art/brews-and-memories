const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const reservationRoutes = require('./routes/reservations');

const app = express();

// Security: Helmet for HTTP headers
app.use(helmet());

// CORS: Allow dev, prod, and file:// origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'https://brews-and-memories.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {

    // allow requests with no origin
    if (!origin) return callback(null, true);

    // allow vercel preview deployments
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }

    callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

// Rate limiting: Global
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 200,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Rate limiting: Strict limit on auth endpoints (5 per 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'mongo',
    version: 'v-kds-deploy-12',
    serverTime: new Date().toISOString(),
    envCheck: {
      hasGmailUser: !!process.env.GMAIL_USER,
      hasGmailPass: !!process.env.GMAIL_APP_PASS,
      hasGmailProxyUrl: !!(process.env.GMAIL_PROXY_URL || process.env.GMAIL_PROXY_URI),
      hasAdminEmail: !!process.env.ADMIN_EMAIL,
      hasKitchenEmail: !!(process.env.KITCHEN_EMAIL || 'kitchen@brews-memories.local'),
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  console.error(err);
  res.status(err.status || 500).json({
    message: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
});

module.exports = app;
