# Free Deployment Guide — Fortress Fund

Deploy your Fortress Fund website to free platforms without a VPS.

## Quick Overview

| Platform | Best For | Cost | Setup Time |
|----------|----------|------|-----------|
| **Vercel** | Frontend (Next.js) | Free | 5 min |
| **Railway** | Backend + Database | Free tier | 10 min |
| **Render** | Backend + Database | Free tier | 10 min |
| **Supabase** | Database only | Free tier | 5 min |

---

## Option 1: Deploy Frontend to Vercel (Recommended)

Vercel is made by the creators of Next.js and offers the best integration.

### Step 1: Push to GitHub

```bash
cd /vercel/share/v0-project
git add .
git commit -m "Deploy to Vercel"
git push origin fortress-fund-website
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Select **fortress-fund-website** branch
5. Set the root directory: **frontend**
6. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
   ```
7. Click **Deploy**

### Step 3: Configure Custom Domain (Optional)

1. In Vercel project settings → **Domains**
2. Add your fortress-fund.com domain
3. Update DNS records at your registrar
4. Wait for DNS propagation

**Your frontend is now live!** → `https://your-vercel-project.vercel.app`

---

## Option 2: Deploy Backend to Railway

Railway offers 500 free hours/month, perfect for testing.

### Step 1: Prepare Backend for Railway

Create a file at `/backend/railway.json`:

```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm run build"
  },
  "start": "npm run start:prod"
}
```

### Step 2: Deploy

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Select your repository
4. Click **"Add Service"** → **Node.js**
5. Connect your GitHub repo

### Step 3: Add Environment Variables

In Railway Dashboard, click **Variables** and add:

```
DATABASE_URL=postgresql://user:password@db-host:5432/investment_platform
REDIS_URL=redis://redis-host:6379
APP_URL=https://your-railway-project.up.railway.app
FRONTEND_URL=https://your-vercel-project.vercel.app
JWT_SECRET=your-secret-key
ADMIN_DEFAULT_EMAIL=admin@fortress-fund.com
STRIPE_SECRET_KEY=your-stripe-key
```

### Step 4: Add PostgreSQL Database

1. In Railway → **New** → **Database** → **PostgreSQL**
2. Railway auto-fills `DATABASE_URL`
3. Run migrations:
   ```bash
   npm run migration:run
   ```

**Your backend is live!** → `https://your-railway-project.up.railway.app/api`

---

## Option 3: Deploy Backend to Render (Free Tier)

Render offers unlimited free tier with some limitations (spins down after inactivity).

### Step 1: Create render.yaml

Create `/backend/render.yaml`:

```yaml
services:
  - type: web
    name: fortress-fund-api
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: DATABASE_URL
        scope: build
      - key: REDIS_URL
        scope: build
      - key: NODE_ENV
        value: production
```

### Step 2: Deploy

1. Go to [render.com](https://render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Select **backend** directory
5. Fill in environment variables
6. Click **Deploy**

### Step 3: Add PostgreSQL Database

1. In Render → **New** → **PostgreSQL**
2. Copy `DATABASE_URL` to your web service variables
3. Run migrations

**Your backend is live!** → `https://your-render-project.onrender.com/api`

---

## Option 4: Full Stack on Railway (All-in-One)

Railway can host both frontend and backend in one project.

### Step 1: Set Up Railway Project

1. Go to [railway.app](https://railway.app)
2. Create new project → **"Deploy from GitHub"**
3. Select your repository

### Step 2: Add Services

Click **"New Service"** and add:
- **Node.js** → points to `/backend`
- **Next.js** → points to `/frontend`
- **PostgreSQL** → database
- **Redis** → cache

### Step 3: Configure Environment Variables

For each service, add the appropriate env vars from the sections above.

### Step 4: Link Services

In each service settings, reference other services:
- Backend: `DATABASE_URL=postgresql://${{Postgres.PGUSER}}...`
- Frontend: `NEXT_PUBLIC_API_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}/api`

---

## Testing Locally First

Before deploying, test everything works:

```bash
# Terminal 1: Backend
cd /vercel/share/v0-project/backend
npm install
npm run start:dev

# Terminal 2: Frontend  
cd /vercel/share/v0-project/frontend
npm install
npm run dev

# Terminal 3: PostgreSQL (using Docker)
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
```

Visit `http://localhost:3000` and test:
- ✓ Login/Registration
- ✓ Dashboard loads
- ✓ API calls work
- ✓ No console errors

---

## Environment Variables Checklist

### Frontend (.env or Vercel)
```
NEXT_PUBLIC_API_URL=https://your-api-url/api
NEXT_PUBLIC_APP_NAME=InvestmentPlatform
```

### Backend (.env or Railway/Render)
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
APP_URL=https://your-api-url
FRONTEND_URL=https://your-frontend-url
NODE_ENV=production
JWT_SECRET=random-secret-key
ADMIN_DEFAULT_EMAIL=admin@fortress-fund.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Recommended Setup (Best Free Option)

1. **Frontend**: Vercel (Next.js optimized, fast, free)
2. **Backend**: Railway (free tier, easy setup)
3. **Database**: Railway's PostgreSQL (included)

**Cost**: $0/month  
**Setup time**: ~15 minutes

---

## Troubleshooting

### "API not responding"
- Check if backend service is running (Railway/Render dashboard)
- Verify `NEXT_PUBLIC_API_URL` matches your backend URL
- Check backend logs for errors

### "Database connection failed"
- Ensure `DATABASE_URL` is correct
- Run migrations: `npm run migration:run`
- Check database credentials in Railway/Render

### "CORS errors"
- Backend must have `FRONTEND_URL` set correctly
- Verify CORS headers in `src/main.ts`
- Check nginx config if using VPS later

### "Build fails"
- Check build logs in Railway/Render dashboard
- Ensure `npm run build` works locally
- Verify all environment variables are set

---

## Next Steps

Once deployed and working:

1. **Custom Domain**: Point fortress-fund.com to your Vercel frontend
2. **SSL Certificate**: Automatically added by Vercel/Railway/Render
3. **Monitoring**: Set up error tracking (Sentry, LogRocket)
4. **Performance**: Enable caching, CDN, compression
5. **When ready for VPS**: Just follow the DEPLOY.md guide, everything is configured

---

## When You Get a VPS Later

Your code is already fully configured for VPS deployment:
- Nginx reverse proxy config: `nginx/fortress-fund.conf`
- SSL setup script: `nginx/ssl-setup.sh`
- Docker Compose: `docker-compose.yml`
- Full guide: `DEPLOY.md`

Just push the Docker images and you're live!
