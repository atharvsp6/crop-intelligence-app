# Backend Switching Guide

This guide explains how to seamlessly switch between different backend deployments (Azure, Render, or local) without code changes.

## Overview

The authentication system and CORS configuration have been designed to work seamlessly across different backend environments:

- **Azure App Service** (`*.azurewebsites.net`)
- **Render** (`*.onrender.com`)
- **Vercel** (for serverless functions if needed)
- **Local Development** (`localhost`)

## How It Works

### Automatic CORS Support

The backend automatically allows requests from:

1. **All Vercel deployments**: `*.vercel.app`
2. **All Azure deployments**: `*.azurewebsites.net`
3. **All Render deployments**: `*.onrender.com`
4. **Local development**: `localhost:3000`, `localhost:3001`

No hardcoded domains means you can deploy to any subdomain or instance and it will work immediately.

### Environment-Based Configuration

Both frontend and backend use environment variables to determine endpoints:

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_BASE=https://your-backend-url.azurewebsites.net
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

**Backend** (`backend/.env`):
```env
FRONTEND_URL=https://your-frontend-url.vercel.app
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
JWT_SECRET_KEY=your-jwt-secret-key
MONGO_URI=your-mongodb-connection-string
```

## Switching Backends

### Step 1: Choose Your Backend

You can use any of these options:

| Platform | URL Pattern | Best For |
|----------|-------------|----------|
| **Azure App Service** | `https://<app-name>.azurewebsites.net` | Production, Enterprise |
| **Render** | `https://<service-name>.onrender.com` | Quick deployment, Free tier |
| **Local** | `http://localhost:5000` | Development |

### Step 2: Configure Frontend

Update the frontend environment variable to point to your chosen backend:

**For Production (Vercel)**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Set `REACT_APP_API_BASE` to your backend URL:
   - Azure: `https://crop-intelligence-api.azurewebsites.net`
   - Render: `https://crop-intelligence-api.onrender.com`
3. Redeploy the frontend

**For Local Development**:
Create `frontend/.env.local`:
```env
REACT_APP_API_BASE=http://localhost:5000
# Or use deployed backend for testing:
# REACT_APP_API_BASE=https://crop-intelligence-api.azurewebsites.net
```

### Step 3: Configure Backend

Ensure your backend has these environment variables set:

**Critical Variables**:
```env
# Your frontend URL (for CORS)
FRONTEND_URL=https://your-app.vercel.app

# Additional allowed origins (comma-separated)
ALLOWED_ORIGINS=https://your-app.vercel.app,https://custom-domain.com

# Authentication
JWT_SECRET_KEY=your-super-secret-jwt-key
JWT_EXPIRY_HOURS=24

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

**Platform-Specific Configuration**:

#### Azure App Service
1. Go to Azure Portal → Your App Service → Configuration
2. Add Application Settings (environment variables)
3. Restart the app service

#### Render
1. Go to Render Dashboard → Your Web Service → Environment
2. Add environment variables
3. Save changes (auto-deploys)

#### Local Development
Create `backend/.env`:
```env
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
MONGO_URI=mongodb://localhost:27017/crop_intelligence
JWT_SECRET_KEY=dev-secret-key-change-in-production
```

## Authentication Flow

The system supports two authentication methods:

### 1. Email/Password Authentication (Always Works)

- User registers with email and password
- Backend validates and creates JWT token
- Token stored in localStorage
- No external dependencies

**Endpoints**:
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/verify` - Verify JWT token

### 2. Google OAuth (Requires Configuration)

- User clicks "Sign in with Google"
- Google OAuth flow returns access token
- Backend validates token with Google API
- Creates/updates user and returns JWT token

**Requirements**:
1. Google OAuth Client ID configured in Google Cloud Console
2. Authorized JavaScript origins must include your frontend URL
3. Authorized redirect URIs not needed (using implicit flow)

**Frontend Environment**:
```env
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## Troubleshooting

### CORS Errors

**Symptom**: "Access-Control-Allow-Origin header is present" errors

**Solution**:
1. Check that `FRONTEND_URL` is set correctly in backend
2. Verify the frontend origin matches the deployed URL
3. Check backend logs for CORS debug messages
4. Ensure backend is restarted after environment variable changes

### Authentication Not Working

**Symptom**: Login successful but redirects fail

**Solution**:
1. Verify `REACT_APP_API_BASE` points to the correct backend
2. Check JWT_SECRET_KEY is set in backend
3. Ensure MONGO_URI is valid and accessible
4. Check browser console for specific error messages

### Google OAuth Fails

**Symptom**: Google sign-in button doesn't work or shows errors

**Solution**:
1. Verify `REACT_APP_GOOGLE_CLIENT_ID` is set in frontend
2. Check Google Cloud Console → Credentials
3. Add your frontend URL to "Authorized JavaScript origins":
   - `https://your-app.vercel.app`
   - `http://localhost:3000` (for development)
4. No redirect URIs needed (we use implicit flow)
5. **Fallback**: Use email/password authentication instead

## Testing the Setup

### 1. Test CORS
```bash
# From your browser console on the frontend:
fetch('https://your-backend.azurewebsites.net/ping')
  .then(r => r.json())
  .then(console.log)
```

Should return: `{"status": "ok", "message": "YieldWise API is running!"}`

### 2. Test Authentication
```bash
# Register a new user
curl -X POST https://your-backend.azurewebsites.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123",
    "full_name": "Test User"
  }'

# Login
curl -X POST https://your-backend.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### 3. Test Google OAuth
1. Open frontend in browser
2. Click "Sign in with Google"
3. Complete Google authentication
4. Should redirect back to app with user logged in

## Best Practices

### For Production

1. **Always use HTTPS**: Both frontend and backend must use HTTPS
2. **Secure JWT secret**: Use a strong, random JWT_SECRET_KEY
3. **Environment variables**: Never commit `.env` files to git
4. **MongoDB**: Use MongoDB Atlas with proper authentication
5. **Monitor logs**: Check backend logs for CORS and auth issues

### For Development

1. **Local backend**: Run backend locally when developing
2. **Use deployed backend**: Test against production backend before deployment
3. **Environment switching**: Use `.env.local` to override defaults
4. **Test both auth methods**: Verify both email/password and Google OAuth work

## Quick Reference

### Environment Variables

| Variable | Where | Required | Purpose |
|----------|-------|----------|---------|
| `REACT_APP_API_BASE` | Frontend | Yes | Backend URL |
| `REACT_APP_GOOGLE_CLIENT_ID` | Frontend | For Google OAuth | Google OAuth client ID |
| `FRONTEND_URL` | Backend | Yes | Primary frontend URL |
| `ALLOWED_ORIGINS` | Backend | Yes | Additional allowed origins |
| `JWT_SECRET_KEY` | Backend | Yes | JWT signing secret |
| `MONGO_URI` | Backend | Yes | MongoDB connection string |

### Common URLs

| Environment | Frontend | Backend |
|-------------|----------|---------|
| **Production** | `https://your-app.vercel.app` | `https://your-api.azurewebsites.net` or `https://your-api.onrender.com` |
| **Development** | `http://localhost:3000` | `http://localhost:5000` |

## Support

If you encounter issues:

1. Check backend logs for CORS debug messages
2. Verify all environment variables are set correctly
3. Test with email/password auth first (simpler, no external deps)
4. Check browser console for specific error messages
5. Ensure backend is deployed and accessible
