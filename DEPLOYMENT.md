# ExceliDraw Deployment Guide

## Deployment Overview

Deploy 3 services:
1. **Frontend** (Next.js) → Vercel
2. **HTTP Backend** (Express) → Railway/Render
3. **WebSocket Backend** → Railway/Render
4. **Database** → Neon.tech (already configured)

## Step 1: Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from excelidraw-frontend directory
cd apps/excelidraw-frontend
vercel --prod
```

**Environment Variables on Vercel:**
```
NEXT_PUBLIC_HTTP_BACKEND=https://your-http-backend-url.com
NEXT_PUBLIC_WS_URL=wss://your-ws-backend-url.com
```

## Step 2: Deploy HTTP Backend to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables:
```
DATABASE_URL=postgresql://neondb_owner:password@ep-xxx.neon.tech/excali-draw?sslmode=require
JWT_SECRET=your_jwt_secret_here
PORT=3002
FRONTEND_URL=https://your-vercel-frontend-url.vercel.app
```
5. Deploy!

## Step 3: Deploy WebSocket Backend to Railway

Same as HTTP backend:
1. New Project → Deploy from GitHub
2. Add environment variables:
```
DATABASE_URL=postgresql://neondb_owner:password@ep-xxx.neon.tech/excali-draw?sslmode=require
JWT_SECRET=your_jwt_secret_here
PORT=8080
```
3. Deploy!

## Step 4: Update Frontend URLs

After backends are deployed, update `.env.production` with actual URLs and redeploy frontend.

## URLs After Deployment

- **Frontend**: https://excelidraw.vercel.app
- **HTTP Backend**: https://excelidraw-http.railway.app
- **WebSocket**: wss://excelidraw-ws.railway.app

Done! 🚀
