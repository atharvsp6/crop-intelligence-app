# Authentication System - Quick Start

This document provides a quick overview of the authentication system and how to get it working.

## Overview

The authentication system supports:
- ✅ **Email/Password Authentication** (Always works, no external dependencies)
- ✅ **Google OAuth** (Optional, requires Google Cloud setup)
- ✅ **JWT Tokens** (Secure, stateless authentication)
- ✅ **Seamless Backend Switching** (Works with Azure, Render, or any backend)

## Quick Start

### 1. Backend Setup

#### Option A: Azure App Service

1. **Set Environment Variables in Azure Portal:**
   ```
   Configuration → Application Settings → New application setting
   ```

   Required:
   - `JWT_SECRET_KEY` = Generate with: `python -c "import secrets; print(secrets.token_hex(32))"`
   - `MONGO_URI` = Your MongoDB Atlas connection string
   - `FRONTEND_URL` = Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
   - `ALLOWED_ORIGINS` = Same as `FRONTEND_URL`

2. **Deploy Backend:**
   - Push to `main` branch (GitHub Actions will auto-deploy)
   - Or use Azure CLI: `az webapp deployment source config-zip`

3. **Verify:**
   ```bash
   curl https://crop-intelligence-api.azurewebsites.net/ping
   ```

#### Option B: Render

1. **Create New Web Service on Render:**
   - Connect your GitHub repository
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn --workers 1 --threads 1 app:app`

   Or use the `render.yaml` blueprint (click "New → Blueprint" in Render)

2. **Set Environment Variables in Render Dashboard:**
   
   Required:
   - `JWT_SECRET_KEY` = Generate with: `python -c "import secrets; print(secrets.token_hex(32))"`
   - `MONGO_URI` = Your MongoDB Atlas connection string
   - `FRONTEND_URL` = Your Vercel frontend URL
   - `ALLOWED_ORIGINS` = Same as `FRONTEND_URL`
   - `GEMINI_API_KEY` = Your Google Gemini API key

3. **Verify:**
   ```bash
   curl https://your-service.onrender.com/ping
   ```

### 2. Frontend Setup (Vercel)

1. **Set Environment Variables in Vercel:**
   ```
   Dashboard → Your Project → Settings → Environment Variables
   ```

   Required:
   - `REACT_APP_API_BASE` = Your backend URL
     - Azure: `https://crop-intelligence-api.azurewebsites.net`
     - Render: `https://your-service.onrender.com`
     - Local: `http://localhost:5000`

   Optional (for Google OAuth):
   - `REACT_APP_GOOGLE_CLIENT_ID` = Your Google OAuth Client ID

2. **Redeploy Frontend:**
   - Vercel will auto-deploy when you push to `main`
   - Or manual: `vercel --prod`

### 3. Test Authentication

1. **Open your frontend** (e.g., `https://your-app.vercel.app`)

2. **Register a new account:**
   - Click "SIGN UP" tab
   - Fill in: Name, Email, Password
   - Click "Create Account"

3. **Login:**
   - Click "SIGN IN" tab
   - Enter your email and password
   - Click "Sign In"

4. **Success!** You should be redirected to the dashboard

## Switching Backends

To switch from Azure to Render (or vice versa):

1. **Update Frontend Environment Variable:**
   - Vercel Dashboard → Settings → Environment Variables
   - Change `REACT_APP_API_BASE` to new backend URL
   - Redeploy

2. **No code changes required!**

## Google OAuth Setup (Optional)

If you want to enable "Sign in with Google":

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create OAuth 2.0 Client ID:**
   - Create new project (or select existing)
   - Go to: APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Name: "YieldWise Frontend"

3. **Add Authorized JavaScript Origins:**
   ```
   https://your-app.vercel.app
   http://localhost:3000
   ```
   
   **Note:** Do NOT add redirect URIs (we use implicit flow)

4. **Copy Client ID** and set in Vercel:
   - `REACT_APP_GOOGLE_CLIENT_ID` = Your Client ID

5. **Redeploy frontend**

6. **Test:** Click "Continue with Google" on login page

## Troubleshooting

### "CORS policy has blocked the request"

**Fix:** Set `FRONTEND_URL` in backend environment variables

```bash
# Azure Portal → Configuration → Application Settings
FRONTEND_URL=https://your-app.vercel.app

# Render Dashboard → Environment
FRONTEND_URL=https://your-app.vercel.app
```

Then restart the backend service.

### "Network Error" when logging in

**Fix:** Check `REACT_APP_API_BASE` in frontend environment variables

```bash
# Vercel Dashboard → Settings → Environment Variables
REACT_APP_API_BASE=https://your-backend.azurewebsites.net
```

Then redeploy frontend.

### "Invalid email or password"

**Fix:** Register a new account first, or check MongoDB connection

```bash
# Backend logs should show:
# "MongoDB connection successful" or error message
```

### Google login doesn't work

**Fix:** Use email/password authentication instead (always works)

Or verify:
1. `REACT_APP_GOOGLE_CLIENT_ID` is set in Vercel
2. Your frontend URL is in Google Cloud Console authorized origins
3. Client ID matches exactly

## Verification Tools

### Automated Configuration Check

```bash
cd backend
python check_auth_config.py
```

This will verify:
- Environment variables are set
- CORS configuration is correct
- JWT token generation works

### Manual Testing

```bash
# Test health endpoint
curl https://your-backend.azurewebsites.net/ping

# Test registration
curl -X POST https://your-backend.azurewebsites.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"test123456","full_name":"Test User"}'

# Test login
curl -X POST https://your-backend.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'
```

## Required Environment Variables Summary

### Backend

| Variable | Required | Where to Get | Example |
|----------|----------|--------------|---------|
| `JWT_SECRET_KEY` | ✅ Yes | Generate random | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `MONGO_URI` | ✅ Yes | MongoDB Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `FRONTEND_URL` | ✅ Yes | Your Vercel URL | `https://your-app.vercel.app` |
| `ALLOWED_ORIGINS` | ✅ Yes | Your Vercel URL | `https://your-app.vercel.app` |
| `GEMINI_API_KEY` | ⚠️ Recommended | Google Makersuite | `AIza...` |

### Frontend

| Variable | Required | Where to Get | Example |
|----------|----------|--------------|---------|
| `REACT_APP_API_BASE` | ✅ Yes | Your backend URL | `https://your-backend.azurewebsites.net` |
| `REACT_APP_GOOGLE_CLIENT_ID` | ⚠️ Optional | Google Cloud Console | `123456.apps.googleusercontent.com` |

## Getting Help

1. **Read the guides:**
   - `BACKEND_SWITCHING_GUIDE.md` - Complete backend switching documentation
   - `DEPLOYMENT_VERIFICATION.md` - Step-by-step testing guide

2. **Check logs:**
   - Azure: Portal → Log Stream
   - Render: Dashboard → Logs
   - Frontend: Browser Console (F12)

3. **Run verification:**
   ```bash
   cd backend
   python check_auth_config.py
   ```

4. **Test with curl:**
   See commands in "Manual Testing" section above

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│  Frontend       │◄────────┤  Backend         │
│  (Vercel)       │  HTTPS  │  (Azure/Render)  │
│                 │         │                  │
└─────────────────┘         └──────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│  Google OAuth   │         │  MongoDB Atlas   │
│  (Optional)     │         │  (User Database) │
│                 │         │                  │
└─────────────────┘         └──────────────────┘
```

**Flow:**
1. User visits frontend (Vercel)
2. User logs in with email/password or Google OAuth
3. Backend validates credentials
4. Backend generates JWT token
5. Frontend stores token in localStorage
6. Frontend sends token with each API request
7. Backend validates token for protected routes

## Security Best Practices

✅ Always use HTTPS in production
✅ Use strong JWT secrets (32+ random characters)
✅ Never commit `.env` files to git
✅ Rotate JWT secrets periodically
✅ Use MongoDB Atlas with authentication
✅ Keep dependencies updated
✅ Monitor backend logs for suspicious activity

## License

MIT - See LICENSE file for details
