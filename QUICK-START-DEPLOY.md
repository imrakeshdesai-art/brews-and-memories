# 🚀 Quick Start: Deploy in 20 Minutes

This is the fastest way to get your app live in production.

---

## Prerequisites (5 min)

1. **GitHub Account** — For deploying with Vercel/Railway
2. **MongoDB Atlas Account** — Free tier available at mongodb.com/cloud/atlas
3. **Vercel or Netlify Account** — Free, login with GitHub
4. **Render or Railway Account** — Free, login with GitHub

---

## Step 1: Set Up Database (MongoDB Atlas) - 5 min

### Create MongoDB Cluster
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Create" → Select "M0 Free" tier
3. Choose region closest to you
4. Click "Create Cluster"
5. Wait 5-10 minutes for cluster to deploy

### Create Database User
1. Click "Security" → "Database Access"
2. Click "Add New Database User"
3. Enter username: `brews_admin`
4. Generate strong password: **Copy and save this** (you won't see it again!)
5. Click "Add User"

### Whitelist IP
1. Click "Network Access"
2. Click "Add IP Address"
3. Enter: `0.0.0.0/0` (allows all - change later for security)
4. Click "Confirm"

### Get Connection String
1. Click "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<username>` with `brews_admin`
6. **Save this as `MONGODB_URI`**

---

## Step 2: Deploy Backend (Render) - 5 min

### Push Code to GitHub
```bash
git add .
git commit -m "Production ready"
git push origin main
```

### Deploy on Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Select your repository
5. Configure:
   - **Name:** brews-memories-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### Add Environment Variables
Click "Advanced" and add:
```
NODE_ENV                    production
PORT                        5000
MONGODB_URI                 <paste from MongoDB Atlas>
JWT_SECRET                  <generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
ADMIN_EMAIL                 admin@brews-memories.local
ADMIN_PASSWORD              <pick a strong password>
ALLOWED_ORIGINS             https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_MAX_REQUESTS     100
RATE_LIMIT_WINDOW_MS        900000
```

### Deploy
1. Click "Create Web Service"
2. Wait 2-3 minutes for deployment
3. **Copy your backend URL** (e.g., `https://brews-backend.onrender.com`)

---

## Step 3: Deploy Frontend (Vercel) - 5 min

### Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Import your repository
5. Configure:
   - **Framework:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Add Environment Variable
1. Click "Environment Variables"
2. Add:
   ```
   VITE_API_BASE_URL    https://brews-backend.onrender.com
   ```
   (Replace with your actual Render backend URL)

### Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. **Your frontend URL will be shown** (e.g., `https://brews-app.vercel.app`)

---

## Step 4: Verify Production Setup - 2 min

### Test Backend
```bash
curl https://your-backend-url/api/health
# Expected: {"status":"ok"}
```

### Test Frontend
1. Visit `https://your-frontend-url`
2. App should load and look identical to local version

### Test Authentication
1. Go to Admin page
2. Enter:
   - Email: `admin@brews-memories.local`
   - Password: (whatever you set in `ADMIN_PASSWORD`)
3. Should see "Login successful"

### Test Order Flow
1. Browse Menu
2. Add item to cart
3. Click Checkout
4. Should see order form

---

## Step 5 (Optional): Set Up Custom Domain

### Frontend Custom Domain (Vercel)
1. Go to Vercel Project Settings → Domains
2. Add your domain (e.g., `app.yourdomain.com`)
3. Follow DNS setup instructions
4. Wait 5-10 minutes for propagation

### Backend Custom Domain (Render)
1. Go to Render Service Settings → Custom Domain
2. Add domain (e.g., `api.yourdomain.com`)
3. Update DNS (CNAME) as instructed
4. Wait 5-10 minutes

### Update Frontend Config (Vercel)
1. Go to Vercel Environment Variables
2. Update `VITE_API_BASE_URL` to your custom backend domain
3. Redeployment happens automatically

---

## 🎉 Done!

Your app is now live in production! 🚀

### What You Have
- ✅ Frontend hosted on Vercel (with CDN)
- ✅ Backend running on Render (auto-scaling)
- ✅ Database on MongoDB Atlas (free tier)
- ✅ HTTPS/TLS on all services (automatic)
- ✅ Auto-deploy from GitHub (push to deploy)

### URLs
- **Frontend:** https://your-frontend-url
- **Backend API:** https://your-backend-url/api/
- **Health Check:** https://your-backend-url/api/health

---

## 🆘 Troubleshooting

### "MongoDB connection failed"
- Check `MONGODB_URI` is correct
- Verify IP whitelist includes `0.0.0.0/0`
- Check database user credentials

### "Frontend can't connect to backend"
- Verify `VITE_API_BASE_URL` is set in Vercel
- Check backend `ALLOWED_ORIGINS` includes frontend domain
- Use browser DevTools (F12) to see network errors

### "Admin login fails"
- Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` match what you set
- Check backend logs on Render dashboard

### "Rate limit: too many requests"
- Wait 15 minutes or adjust `RATE_LIMIT_MAX_REQUESTS`
- Default limit: 5 login attempts per 15 minutes

---

## 📖 Next Steps

1. **Monitor Logs**
   - Render: View in dashboard
   - Vercel: View in deployment logs

2. **Set Up Alerts** (Optional)
   - Enable deployment notifications
   - Set up error tracking (Sentry)

3. **Plan Features**
   - Real payment gateway
   - Email notifications
   - Customer portal

---

## 📞 Support

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Docs:** https://docs.mongodb.com
- **Express Docs:** https://expressjs.com

---

**Time to Production: ~20 minutes ⏱️**
