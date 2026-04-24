# Production Deployment Guide

This guide walks you through deploying the Brews & Memories app to production.

## Prerequisites

- Git repository (GitHub, GitLab, or Bitbucket)
- MongoDB Atlas account (free tier available)
- Frontend hosting account (Vercel or Netlify)
- Backend hosting account (Render, Railway, or Fly.io)

## Step 1: Prepare Backend Environment

### Generate Secure Values

1. **Generate JWT_SECRET** (use a terminal):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and use it as `JWT_SECRET`.

2. **Create strong ADMIN_PASSWORD**:
   - At least 12 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Example: `Br3w5&M3m0ries#2024`

3. **Define ALLOWED_ORIGINS**:
   ```
   https://yourdomain.com,https://www.yourdomain.com
   ```

### Set Up MongoDB Atlas

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new project: "Brews & Memories"
4. Create a cluster (M0 free tier is fine)
5. Create a database user:
   - Username: `brews_admin`
   - Password: Use a strong generated password
   - **IMPORTANT:** Copy the password immediately—you won't see it again
6. Add your IP to whitelist:
   - Click "Network Access"
   - Click "Add IP Address"
   - For development: Your local IP
   - For production: Use 0.0.0.0/0 (allow all) or backend IP if available
7. Get connection string:
   - Click "Connect" on cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Use this as `MONGODB_URI`

## Step 2: Deploy Backend

### Option A: Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name:** brews-memories-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or Starter for production)
6. Click "Advanced" and add Environment Variables:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = (from MongoDB Atlas)
   - `JWT_SECRET` = (generated value)
   - `ADMIN_EMAIL` = your email
   - `ADMIN_PASSWORD` = (strong password)
   - `ALLOWED_ORIGINS` = (your frontend URL)
   - `PORT` = `5000`
7. Deploy
8. **Note your backend URL** (e.g., `https://brews-memories-backend.onrender.com`)

### Option B: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables in the "Variables" tab:
   - Same variables as Render
6. Railway auto-detects Node.js and deploys
7. **Note your backend URL**

### Option C: Deploy to Fly.io

1. Go to [fly.io](https://fly.io)
2. Install flyctl CLI
3. Run:
   ```bash
   cd backend
   flyctl launch
   ```
4. Follow prompts
5. Set secrets:
   ```bash
   flyctl secrets set \
     NODE_ENV=production \
     MONGODB_URI=<your-uri> \
     JWT_SECRET=<your-secret> \
     ADMIN_EMAIL=<your-email> \
     ADMIN_PASSWORD=<password> \
     ALLOWED_ORIGINS=<frontend-url>
   ```
6. Deploy:
   ```bash
   flyctl deploy
   ```

## Step 3: Deploy Frontend

### Option A: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Import Project" and select your repository
4. Configure:
   - **Framework:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variable:
   - `VITE_API_BASE_URL` = (your backend URL from step 2)
   - Example: `https://brews-memories-backend.onrender.com`
6. Click "Deploy"
7. **Your frontend is now live** at `https://[project].vercel.app`

### Option B: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git" and select your repository
4. Configure:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click "Advanced" → "New variable"
   - `VITE_API_BASE_URL` = (your backend URL)
6. Deploy
7. **Your frontend is now live** at `https://[site-name].netlify.app`

## Step 4: Verify Production Setup

1. **Test backend health:**
   ```
   https://your-backend-url/api/health
   ```
   Should return: `{"status":"ok"}`

2. **Test frontend access:**
   - Visit `https://your-frontend-url`
   - Browse to `/menu` and add items to cart
   - Go to `/admin` and try logging in with your `ADMIN_EMAIL` and `ADMIN_PASSWORD`

3. **Test order creation:**
   - Create an order from the frontend
   - Log in to admin panel
   - Verify the order appears in the admin orders list

## Step 5: Configure Custom Domain (Optional)

### Frontend Domain
- **Vercel:** Add domain in Project Settings → Domains
- **Netlify:** Add domain in Site settings → Domain management

### Backend Domain
- **Render:** Add domain in Environment → Custom Domain
- **Railway:** Add domain in Settings → Custom Domain
- **Fly.io:** Set DNS records per Fly.io documentation

After adding custom domains:
1. Update `VITE_API_BASE_URL` in frontend with new backend domain
2. Update `ALLOWED_ORIGINS` in backend with new frontend domain
3. Redeploy both frontend and backend

## Troubleshooting

### Backend won't start
- Check `NODE_ENV=production` is set
- Verify all required env vars are present
- Check `JWT_SECRET` is at least 32 characters
- Check MongoDB connection string is correct

### Frontend can't connect to backend
- Verify `VITE_API_BASE_URL` is set to backend URL
- Check backend `ALLOWED_ORIGINS` includes your frontend domain
- Test backend health endpoint directly

### Login fails in production
- Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` were set correctly
- Check MongoDB is properly connected
- Review backend logs for JWT errors

### Rate limiting blocking requests
- Default: 5 login attempts per 15 minutes
- Increase `RATE_LIMIT_MAX_REQUESTS` if needed
- Wait 15 minutes for attempts to reset

## Monitoring & Logs

- **Render logs:** View in dashboard or run `render logs`
- **Railway logs:** View in dashboard
- **Fly.io logs:** Run `flyctl logs`
- **Frontend errors:** Check browser console (F12)
- **Backend errors:** Check deployment logs

## Security Reminders

✅ Use strong, unique `JWT_SECRET`  
✅ Use strong `ADMIN_PASSWORD`  
✅ Set `ALLOWED_ORIGINS` to specific domains, not `*`  
✅ Enable HTTPS (automatic on all platforms)  
✅ Never commit `.env` files to Git  
✅ Rotate secrets regularly  
✅ Monitor logs for suspicious activity  
✅ Keep dependencies updated: `npm audit fix`  

## Post-Deployment

1. **Set up monitoring** (optional):
   - Render: Built-in metrics
   - Railway: Metrics dashboard
   - Fly.io: Prometheus integration

2. **Set up email notifications** (optional):
   - Get alerts for deployment failures
   - Monitor uptime

3. **Document your setup:**
   - Save backend URL, frontend URL, database credentials (securely)
   - Create runbook for common issues

4. **Plan maintenance:**
   - Weekly: Review logs
   - Monthly: Update dependencies
   - Quarterly: Security audit

For questions, refer to platform documentation or README.md.
