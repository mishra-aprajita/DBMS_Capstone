# Smart Campus Resource Governance System — Vercel Deployment Guide

This guide provides step-by-step instructions for deploying both the Frontend (React + Vite SPA) and Backend (Express Serverless API) on Vercel as two separate connected projects.

---

## Architecture Overview

```
[ Frontend Project: Vercel ]
  • Root Directory: client
  • Framework Preset: Vite
  • Rewrites: /(.*) -> /index.html (SPA Fallback)
  • Environment Variable: VITE_API_BASE_URL=https://smart-campus-api.vercel.app
          │
          │ Cross-Origin HTTPS Requests (with x-user-id header)
          ▼
[ Backend Project: Vercel Serverless ]
  • Root Directory: server
  • Framework Preset: Other
  • Runtime: @vercel/node (Serverless Function)
  • Entry Point: index.js (exports Express app)
  • Environment Variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL, FRONTEND_URL
          │
          │ Secure Connection Pool (with SSL)
          ▼
[ Cloud MySQL Database ] (TiDB Cloud / Aiven / PlanetScale / AWS RDS)
  • Database Name: smart_campus
```

---

## Step 1: Deploy the Backend (Serverless API)

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**.
2. Select your repository: `Smart_Campus`.
3. In **Project Configuration**:
   - **Project Name**: `smart-campus-api` (or your chosen name)
   - **Framework Preset**: `Other`
   - **Root Directory**: Click *Edit* and select **`server`**
4. Under **Environment Variables**, add:
   | Key | Value | Description |
   |---|---|---|
   | `DB_HOST` | `your-db-host.com` | Hostname of your cloud MySQL instance |
   | `DB_PORT` | `3306` (or `4000` for TiDB) | Port of your MySQL instance |
   | `DB_USER` | `your_user` | MySQL database username |
   | `DB_PASSWORD` | `your_password` | MySQL user password |
   | `DB_NAME` | `smart_campus` | Canonical database name |
   | `DB_SSL` | `true` | Enables TLS encryption required by cloud databases |
   | `FRONTEND_URL` | `https://smart-campus-client.vercel.app` | Deployed frontend domain (for CORS) |
   | `NODE_ENV` | `production` | Production mode |
5. Click **Deploy**.
6. Note the deployed backend URL: `https://smart-campus-api.vercel.app`.

### Testing the Backend Deployment
Run a smoke test in your terminal or browser:
```bash
# 1. Health check (should return 200 OK)
curl https://smart-campus-api.vercel.app/api/health

# 2. Login users (public, returns registered users)
curl https://smart-campus-api.vercel.app/api/login-users

# 3. Lookups test (requires x-user-id header)
curl -H "x-user-id: 4" https://smart-campus-api.vercel.app/api/lookups
```

---

## Step 2: Deploy the Frontend (Vite SPA)

1. In the Vercel Dashboard, click **Add New Project**.
2. Select the same repository: `Smart_Campus`.
3. In **Project Configuration**:
   - **Project Name**: `smart-campus-client`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`client`**
   - **Build Command**: `vite build` (default)
   - **Output Directory**: `dist` (default)
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://smart-campus-api.vercel.app` (Your Step 1 Backend URL) |
5. Click **Deploy**.

---

## Step 3: Configure CORS on the Backend

Once your frontend is deployed, copy its production domain (e.g., `https://smart-campus-client.vercel.app`).

1. Open your backend project on Vercel: `smart-campus-api` -> **Settings** -> **Environment Variables**.
2. Edit or add `FRONTEND_URL` with your frontend domain:
   ```env
   FRONTEND_URL=https://smart-campus-client.vercel.app
   ```
3. Go to **Deployments**, click the `...` menu on your latest deployment, and select **Redeploy** so the new environment variable takes effect.

---

## Local Development vs. Vercel Production

| Setting | Local Development | Vercel Production |
|---|---|---|
| Frontend URL | `http://localhost:5173` | `https://smart-campus-client.vercel.app` |
| Backend URL | `http://localhost:4000` | `https://smart-campus-api.vercel.app` |
| `VITE_API_BASE_URL` | Leave empty (uses Vite proxy) | `https://smart-campus-api.vercel.app` |
| Database | Local MySQL / In-memory fallback | Managed Cloud MySQL (SSL enabled) |

---

## Troubleshooting Vercel Serverless Errors

### 1. `GET /api/login-users 404 Not Found`
- **Cause**: Frontend `VITE_API_BASE_URL` was not configured during the frontend build, causing the browser to send API calls to the frontend's static domain.
- **Fix**: Set `VITE_API_BASE_URL=https://your-backend.vercel.app` in frontend project settings and trigger a **Redeploy**.

### 2. `CORS Missing Allow Origin`
- **Cause**: Browser blocked cross-origin requests because `FRONTEND_URL` does not match the frontend domain or headers (`x-user-id`) were not accepted.
- **Fix**: The backend is now configured with permissive Vercel preview matching and explicit `x-user-id` header allowance. Ensure `FRONTEND_URL` is set to your exact frontend domain.

### 3. `504 Gateway Timeout` or `Function Invocation Failed`
- **Cause**: `app.listen()` called inside serverless function or connection pool hung waiting for an unreachable database.
- **Fix**: `server/index.js` now guards `app.listen()` (`process.env.VERCEL !== '1'`) and `server/db.js` includes an in-memory transactional fallback if cloud database connection times out.

### 4. Deep Route Refresh Returns 404 (`/login/student` or `/student/dashboard`)
- **Cause**: Missing SPA fallback rewrite on the static host.
- **Fix**: Included `client/vercel.json` with `"source": "/(.*)", "destination": "/index.html"`.
