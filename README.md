# Brews & Memories Café — Full Stack Upgrade

This workspace now contains a full-stack upgrade for Brews & Memories Café.

## Project structure

- `frontend/` — React + Vite frontend application
- `backend/` — Express API with MongoDB persistence
- `backend/.env.example` — sample backend environment configuration

## Local development

### Backend setup
1. Open a terminal in `backend`
2. Copy `.env.example` to `.env`
3. Fill in `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start backend:
   ```bash
   npm run dev
   ```

### Frontend setup
1. Open a terminal in `frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend dev server:
   ```bash
   npm run dev
   ```

### How to use
- Visit `/menu` to browse menu items and add them to cart
- Checkout with mock COD / UPI / Card payments
- Use the admin page to sign in and review incoming orders

## Backend APIs
- `POST /api/orders` — create a new order
- `GET /api/orders` — admin-only fetch all orders
- `PATCH /api/orders/:id` — admin-only update order status
- `POST /api/auth/login` — admin login with JWT

## Deployment

### Frontend Deployment (Vercel/Netlify)

**Build locally first:**
```bash
cd frontend
npm run build
```

**Deploy to Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Deploy to Netlify:**
1. Connect your Git repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_API_BASE_URL=https://your-backend-url.com`

### Backend Deployment (Render/Railway/Fly.io)

**Environment Variables (Required for Production):**
Create a `.env` file or configure in your deployment platform:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/brews-memories
JWT_SECRET=generate-a-secure-random-string-at-least-32-chars
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=secure-password-here
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Deploy to Render:**
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your repository
4. Set start command: `npm start`
5. Add environment variables in Render dashboard
6. Deploy

**Deploy to Railway:**
1. Link your GitHub repository
2. Railway auto-detects Node.js project
3. Add `MONGODB_URI` and other env vars in Variables section
4. Deploy

**Deploy to Fly.io:**
```bash
npm install -g flyctl
flyctl launch
# Follow prompts and add environment variables
flyctl deploy
```

### Database Setup (MongoDB Atlas)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free M0 cluster
3. Create a database user (save credentials)
4. Whitelist your backend IP (or 0.0.0.0/0 for simplicity)
5. Copy connection string and set as `MONGODB_URI` env var

### Post-Deployment Checklist

- ✅ Set `NODE_ENV=production`
- ✅ Generate strong `JWT_SECRET` (min 32 chars)
- ✅ Configure `ALLOWED_ORIGINS` with your frontend domain
- ✅ Use strong `ADMIN_PASSWORD` (never use the default)
- ✅ Enable HTTPS on backend and frontend
- ✅ Set up SSL/TLS certificate (automatic on Vercel/Netlify/Render)
- ✅ Monitor backend logs for errors
- ✅ Test admin login and order workflow in production

## Security Features

- **Helmet.js** — Secures HTTP headers
- **CORS Lockdown** — Restricts requests to allowed origins only
- **Rate Limiting** — Prevents brute-force attacks (5 login attempts per 15 min)
- **JWT Authentication** — Secures admin endpoints
- **Environment Validation** — Enforces required config at startup
- **Payload Size Limits** — Prevents large payload attacks
- **Error Hiding** — Production mode hides detailed error messages

## Notes
- **Admin credentials** are seeded from environment variables on server startup. Always change defaults in production.
- **Cart state** persists in browser `localStorage`.
- **Payment** is simulated only; there is no real payment gateway integration.
- **Authentication** uses JWT and secures admin order routes.
- **Environment variables** must be set before deployment—missing values will cause startup failure in production.
- **Rate limiting** is applied globally and stricter on auth endpoints to prevent brute-force attacks.
- **CORS** is restricted to specified origins; update `ALLOWED_ORIGINS` for your production domain.
- **Logs** in production hide sensitive details; enable `NODE_ENV=development` only for debugging.
