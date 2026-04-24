# Production Hardening Checklist

This document summarizes the security hardening applied to make the app production-ready.

## Backend Security Improvements

### 1. CORS Lockdown ✅
**Before:**
```javascript
cors({ origin: true, credentials: true })
```
**After:**
```javascript
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:4173').split(',');
cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```
- Restricts requests to specified origins only
- Whitelist specific domains instead of allowing all origins
- Set `ALLOWED_ORIGINS` environment variable with your production domain

### 2. Rate Limiting ✅
**Added:**
- Global rate limit: 100 requests per 15 minutes
- Auth endpoint limit: 5 login attempts per 15 minutes (stricter)
- Prevents brute-force attacks on login
- Uses `express-rate-limit` package
- Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`

### 3. Payload Size Limit ✅
**Added:**
```javascript
app.use(express.json({ limit: '10kb' }));
```
- Prevents large payload denial-of-service attacks
- Adjust limit based on your largest order payloads

### 4. Enhanced Security Headers ✅
- Helmet.js already in use for HTTP header security
- Now configured with additional strictness
- Protects against XSS, clickjacking, MIME sniffing, etc.

### 5. Environment Variable Validation ✅
**Added startup checks:**
- Required variables: `JWT_SECRET`, `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `JWT_SECRET` must be at least 32 characters
- Fails immediately if production config is incomplete
- Prevents "works in dev, fails in production" scenarios

### 6. Production Error Handling ✅
**Before:**
```javascript
res.status(err.status || 500).json({ message: err.message });
```
**After:**
```javascript
// Only show full errors in development
const message = isDevelopment ? err.message : 'Internal server error';
res.status(err.status || 500).json({
  message,
  ...(isDevelopment && { stack: err.stack }),
});
```
- Prevents information leakage about system internals
- Still logs full errors server-side for debugging

### 7. Improved Logging ✅
**Updated logging strategy:**
- Uses Morgan in 'combined' format (more detailed)
- Better for production monitoring
- Error details logged server-side, not exposed to clients

## Frontend Security Improvements

### 1. Build Optimization ✅
**Vite config updates:**
- Disabled source maps in production (prevents code exposure)
- Enabled minification with Terser
- Code splitting for vendor libraries
- Reduces bundle size and improves performance

### 2. Environment-Based Configuration ✅
- `VITE_API_BASE_URL` environment variable for dynamic API URL
- Different configs for dev/staging/production
- No hardcoded URLs in built code

## Configuration Files

### `.env.example` (Backend) ✅
Updated with all new environment variables:
- `NODE_ENV` - controls error verbosity
- `ALLOWED_ORIGINS` - comma-separated allowed domains
- `RATE_LIMIT_WINDOW_MS` - rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - max requests per window
- Rate limiting configurations

### `.gitignore` Files ✅
Already configured to exclude:
- `node_modules/`
- `.env` files (never commit secrets)
- `dist/` (frontend build artifacts)

## Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] Generate strong `JWT_SECRET` (min 32 chars):
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] Set strong `ADMIN_PASSWORD` (12+ chars, mixed case, numbers, symbols)

- [ ] Configure `ALLOWED_ORIGINS` with your production domain:
  ```
  https://yourdomain.com,https://www.yourdomain.com
  ```

- [ ] Set `NODE_ENV=production`

- [ ] Verify MongoDB Atlas connection:
  - Database user created
  - IP whitelist configured
  - Connection string copied correctly

- [ ] Build frontend locally and verify:
  ```bash
  cd frontend && npm run build
  ```

- [ ] Test backend with production config locally:
  ```bash
  NODE_ENV=production npm start
  ```

- [ ] Review all environment variables before deployment

- [ ] Enable HTTPS/TLS (automatic on all major platforms)

## Testing Production Config Locally

To test production configuration locally:

1. Create a `.env.production` file (for reference only, don't commit):
   ```bash
   cp backend/.env.example backend/.env.production
   ```

2. Fill in real values:
   ```
   NODE_ENV=production
   JWT_SECRET=your-generated-secret-here
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
   # ... other vars
   ```

3. Test startup:
   ```bash
   NODE_ENV=production npm start
   ```

4. Verify:
   - Server starts without env var errors
   - Rate limiting responds with 429 on too many requests
   - CORS headers only allow specified origins

## Deployment Platforms

All major platforms handle:
- ✅ HTTPS/TLS automatically
- ✅ Environment variables securely
- ✅ Auto-scaling and monitoring
- ✅ Logs and debugging tools

Recommended:
- **Frontend:** Vercel or Netlify (auto-deploys on Git push)
- **Backend:** Render, Railway, or Fly.io (good free tiers)
- **Database:** MongoDB Atlas (free M0 cluster)

See `DEPLOYMENT.md` for step-by-step deployment guide.

## Security Best Practices Applied

✅ Defense in depth (multiple layers of security)  
✅ Fail securely (doesn't expose internals on error)  
✅ Principle of least privilege (specific origins, not wildcards)  
✅ Input validation (required env vars, payload size limits)  
✅ Rate limiting (prevents common attacks)  
✅ Secure by default (production mode hides details)  
✅ Zero secrets in code (all via environment)  

## Next Steps

1. **Short term:** Deploy using `DEPLOYMENT.md` guide
2. **Medium term:** Set up monitoring and alerting
3. **Long term:** Regular security audits and dependency updates

For production-critical apps, consider adding:
- Database backups (MongoDB Atlas handles this)
- CDN for frontend (Vercel/Netlify include this)
- Web Application Firewall (WAF)
- API monitoring and alerting
- Automated security scanning (Dependabot, Snyk)
