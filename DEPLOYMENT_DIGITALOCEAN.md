# ExceliDraw Deployment Guide - DigitalOcean

## Deployment Architecture

Deploy all services on DigitalOcean App Platform:
- **Frontend**: Static Site (Next.js)
- **HTTP Backend**: Web Service (Express)
- **WebSocket Backend**: Web Service (WebSocket Server)
- **Database**: Neon.tech PostgreSQL (external)

## Prerequisites

1. DigitalOcean account: https://cloud.digitalocean.com
2. doctl CLI installed
3. GitHub repository connected to DigitalOcean

## Deployment Steps

### Step 1: Install doctl CLI

```bash
# Windows (PowerShell)
winget install DigitalOcean.doctl

# Or download from: https://docs.digitalocean.com/reference/doctl/how-to/install/
```

### Step 2: Authenticate doctl

```bash
doctl auth init
# Enter your DigitalOcean API token
```

### Step 3: Set Environment Variables

Create a `.env` file with your values:

```bash
# Database (Neon.tech)
DATABASE_URL="postgresql://neondb_owner:npg_GIKsT0BMpX6l@ep-jolly-bar-ann24zub-pooler.c-6.us-east-1.aws.neon.tech/excali-draw?sslmode=require"

# JWT Secret (generate a strong secret)
JWT_SECRET="your-super-secret-jwt-key-here"

# Frontend URL (will be updated after first deploy)
FRONTEND_URL="https://excelidraw-xxx.ondigitalocean.app"
HTTP_BACKEND_URL="https://excelidraw-http-backend-xxx.ondigitalocean.app"
WS_BACKEND_URL="wss://excelidraw-ws-backend-xxx.ondigitalocean.app"
```

### Step 4: Deploy Using App Spec

```bash
# Deploy the entire application
doctl apps create --spec .do/app.yaml
```

Or use the DigitalOcean Dashboard:
1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Choose GitHub as source
4. Select your repository: `armaanfaaiz/ExceliDraw-Project`
5. Use the `.do/app.yaml` spec file
6. Add environment variables
7. Deploy!

### Step 5: Update Environment Variables After Deploy

After first deployment, get your actual URLs and update:

```bash
# Get app info
doctl apps list

# Update environment variables with actual URLs
doctl apps update --app-id YOUR_APP_ID --spec .do/app.yaml
```

## Manual Deployment (Alternative)

### Deploy Individual Services

**HTTP Backend:**
```bash
cd apps/http-backend
doctl apps create --name excelidraw-http
# Follow prompts to link GitHub repo
```

**WebSocket Backend:**
```bash
cd apps/ws-backend
doctl apps create --name excelidraw-ws
# Follow prompts to link GitHub repo
```

**Frontend:**
```bash
cd apps/excelidraw-frontend
doctl apps create --name excelidraw-frontend
# Follow prompts, select "Static Site"
```

## Environment Variables Required

### HTTP Backend:
- `DATABASE_URL` - Neon.tech connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - 3002
- `FRONTEND_URL` - Frontend URL for CORS

### WebSocket Backend:
- `DATABASE_URL` - Neon.tech connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - 8080

### Frontend:
- `NEXT_PUBLIC_HTTP_BACKEND` - HTTP backend URL
- `NEXT_PUBLIC_WS_URL` - WebSocket backend URL

## After Deployment

1. Get your app URL from DigitalOcean dashboard
2. Update frontend environment variables with backend URLs
3. Redeploy frontend
4. Test all features: signup, login, create room, join room, drawing

## Troubleshooting

**Build fails:**
- Check pnpm is installed in Dockerfile
- Verify package.json exists in correct location

**Database connection fails:**
- Verify DATABASE_URL is correct
- Check Neon.tech connection limits
- Ensure SSL mode is enabled

**WebSocket not working:**
- Verify ws:// vs wss:// in production
- Check CORS settings match frontend URL

Done! 🚀
