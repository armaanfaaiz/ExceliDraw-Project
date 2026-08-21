# ExceliDraw Production Deployment Guide

This guide provides step-by-step instructions to deploy **ExceliDraw** across cloud hosting providers (Render, Vercel, Railway, or VPS Docker).

---

## Architecture Overview

| Component | Tech Stack | Default Port | Production Deployment Target |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 15, TailwindCSS, Rough.js | `3000` | Vercel / Render / Docker |
| **HTTP Backend** | Express, Node.js, Prisma | `3002` | Render / Railway / Docker |
| **WS Backend** | Node.js, `ws`, Prisma | `8080` | Render / Railway / Docker |
| **Database** | PostgreSQL | `5432` | Managed PostgreSQL (Supabase / Neon / Render) |

---

## Option 1: 1-Click Cloud Deployment via Render Blueprint (Recommended)

Render allows deploying all services (PostgreSQL, HTTP API, WebSocket Server, and Next.js Frontend) automatically using the included [`render.yaml`](file:///d:/projects/Exceli-draw/render.yaml) file.

### Steps:
1. Push your code to a GitHub or GitLab repository.
2. Sign in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect `render.yaml` and provision:
   - Managed **PostgreSQL Database** (`excelidraw-db`)
   - **HTTP API Backend** (`excelidraw-http-backend`)
   - **WebSocket Realtime Server** (`excelidraw-ws-backend`)
   - **Next.js Frontend** (`excelidraw-frontend`)
6. Click **Apply**. Render will build and deploy all services with automatically wired environment variables!

---

## Option 2: Hybrid Deployment (Vercel Frontend + Render Backends)

This is a popular production setup that leverages Vercel's fast global CDN for the Next.js frontend, while running the Express and WebSocket backends on Render or Railway.

### Step 1: Deploy Database & Backends on Render / Railway
1. Create a PostgreSQL Database on [Supabase](https://supabase.com), [Neon](https://neon.tech), or Render.
2. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Deploy `http-backend`:
   - **Build Command**: `pnpm install && pnpm --filter @repo/db run build && pnpm --filter http-backend run build`
   - **Start Command**: `node apps/http-backend/dist/index.js`
   - **Environment Variables**:
     - `PORT`: `3002` (or provided by host)
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `JWT_SECRET`: Random secure string
     - `FRONTEND_URL`: `https://your-app.vercel.app`
4. Deploy `ws-backend`:
   - **Build Command**: `pnpm install && pnpm --filter @repo/db run build && pnpm --filter ws-backend run build`
   - **Start Command**: `node apps/ws-backend/dist/index.js`
   - **Environment Variables**:
     - `PORT`: `8080` (or provided by host)
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `JWT_SECRET`: Same JWT secret as HTTP backend

### Step 2: Deploy Frontend on Vercel
1. Import your repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `apps/excelidraw-frontend` (or keep root with Turborepo auto-detection).
3. Add **Environment Variables**:
   - `NEXT_PUBLIC_HTTP_BACKEND`: `https://your-http-backend.onrender.com`
   - `NEXT_PUBLIC_WS_URL`: `wss://your-ws-backend.onrender.com`
4. Click **Deploy**.

---

## Option 3: Containerized Deployment via Docker & Docker Compose (VPS)

Deploy the entire stack to any VPS (DigitalOcean Droplet, Hetzner, AWS EC2, Linode) using Docker Compose.

### Requirements:
- Server running Ubuntu/Debian with Docker and Docker Compose installed.

### Steps:
1. Clone your repository on the server:
   ```bash
   git clone https://github.com/your-username/excelidraw.git
   cd excelidraw
   ```
2. Build and launch all containers in detached mode:
   ```bash
   docker compose up -d --build
   ```
3. Run database migrations inside the backend container:
   ```bash
   docker exec -it excelidraw-http-backend npx prisma migrate deploy
   ```
4. Access your application at `http://YOUR_SERVER_IP:3000`!

---

## Environment Variables Reference

### Frontend (`apps/excelidraw-frontend/.env.local`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_HTTP_BACKEND` | HTTP API Base URL | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_WS_URL` | WebSocket Server URL | `wss://ws.yourdomain.com` |

### Backends (`apps/http-backend/.env` & `apps/ws-backend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Service Port | `3002` or `8080` |
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT signing | `super-secret-key-32-chars` |
| `FRONTEND_URL` | Allowed CORS Origin | `https://yourdomain.com` |
