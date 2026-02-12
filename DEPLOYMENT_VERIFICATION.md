# Deployment Verification Guide

This guide helps you verify that your authentication system is working correctly across different deployment environments.

## Quick Verification Checklist

### Backend Deployment

- [ ] Backend is accessible via HTTPS (or HTTP for local)
- [ ] `/ping` endpoint returns `{"status": "ok"}`
- [ ] Environment variables are set correctly
- [ ] MongoDB connection is working
- [ ] CORS headers are being sent

### Frontend Deployment

- [ ] Frontend loads without errors
- [ ] `REACT_APP_API_BASE` points to correct backend
- [ ] Google OAuth Client ID is set (if using Google login)
- [ ] Login page is accessible

### Authentication Flow

- [ ] Email/password registration works
- [ ] Email/password login works
- [ ] Google login works (if configured)
- [ ] JWT token is stored in localStorage
- [ ] Protected routes redirect to login when not authenticated
- [ ] Protected routes allow access when authenticated

## Step-by-Step Verification

### 1. Verify Backend is Running

**Test the health endpoint:**

```bash
curl https://your-backend-url.azurewebsites.net/ping
```

**Expected response:**
```json
{"status": "ok", "message": "YieldWise API is running!"}
```

**If it fails:**
- Check that the backend URL is correct
- Verify the backend service is running (check Azure Portal or Render Dashboard)
- Check firewall and network settings

### 2. Verify CORS Configuration

**Test CORS from browser console:**

Open your frontend in a browser, then run in console:

```javascript
fetch('https://your-backend-url.azurewebsites.net/ping')
  .then(r => r.json())
  .then(data => console.log('CORS works!', data))
  .catch(err => console.error('CORS error:', err));
```

**Expected result:** Should log "CORS works!" with the ping response

**If CORS fails:**
- Check backend logs for CORS debugging messages
- Verify `FRONTEND_URL` is set in backend environment variables
- Ensure backend supports your frontend domain (should auto-allow *.vercel.app, *.azurewebsites.net, *.onrender.com)

### 3. Test Email/Password Authentication

**Register a new user:**

```bash
curl -X POST https://your-backend-url.azurewebsites.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123456",
    "full_name": "Test User"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "full_name": "Test User"
  }
}
```

**Login with the user:**

```bash
curl -X POST https://your-backend-url.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": { ... }
}
```

**If authentication fails:**
- Check MongoDB connection (verify `MONGO_URI` is set correctly)
- Check backend logs for error messages
- Verify `JWT_SECRET_KEY` is set in backend environment variables

### 4. Test Protected Endpoint

**Verify token authentication:**

```bash
# Use the token from login/register response
TOKEN="your-jwt-token-here"

curl https://your-backend-url.azurewebsites.net/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```

**Expected response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    ...
  }
}
```

### 5. Test Google OAuth (Optional)

**Prerequisites:**
1. Google Cloud Console project created
2. OAuth 2.0 Client ID created
3. Authorized JavaScript origins configured:
   - `https://your-frontend.vercel.app`
   - `http://localhost:3000`
4. `REACT_APP_GOOGLE_CLIENT_ID` set in frontend

**Test in browser:**
1. Open frontend
2. Click "Sign in with Google" button
3. Complete Google authentication
4. Should redirect back to app with user logged in

**Check browser console for errors:**
- Network tab: Check for failed requests
- Console tab: Look for CORS or authentication errors

**If Google OAuth fails:**
- Verify `REACT_APP_GOOGLE_CLIENT_ID` matches your Google Cloud Console
- Check Authorized JavaScript origins in Google Cloud Console
- Fallback: Use email/password authentication instead

### 6. Test Backend Switching

**To verify seamless backend switching:**

1. **Current backend:** Azure (`https://app1.azurewebsites.net`)
2. **Switch to:** Render (`https://app2.onrender.com`)

**Steps:**
1. Update frontend environment variable:
   - Vercel: Dashboard → Settings → Environment Variables
   - Set `REACT_APP_API_BASE=https://app2.onrender.com`
2. Redeploy frontend
3. Test authentication flow again

**Expected result:** Everything should work the same way without code changes

## Environment Variables Reference

### Backend (.env)

```env
# Required
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET_KEY=your-super-secret-key-here
FRONTEND_URL=https://your-frontend.vercel.app

# Optional (for additional domains)
ALLOWED_ORIGINS=https://custom-domain.com,https://another-domain.com

# Optional (Google OAuth backend validation)
# Not required for authentication to work
```

### Frontend

**Vercel Environment Variables:**

```env
REACT_APP_API_BASE=https://your-backend.azurewebsites.net
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**Local Development (.env.local):**

```env
REACT_APP_API_BASE=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## Common Issues and Solutions

### Issue: "CORS policy has blocked the request"

**Cause:** Backend doesn't recognize frontend origin

**Solutions:**
1. Set `FRONTEND_URL` in backend environment variables
2. Backend should auto-allow *.vercel.app, *.azurewebsites.net, *.onrender.com
3. Check backend logs for CORS debug messages
4. Restart backend after changing environment variables

### Issue: "Invalid email or password"

**Cause:** User doesn't exist or wrong password

**Solutions:**
1. Register a new user first
2. Check MongoDB connection
3. Verify backend logs for database errors

### Issue: "Network Error" or "Failed to fetch"

**Cause:** Cannot connect to backend

**Solutions:**
1. Verify backend URL is correct
2. Check backend is running and accessible
3. Test with curl to confirm backend is up
4. Check for network/firewall issues

### Issue: Google login doesn't work

**Cause:** Google OAuth misconfiguration

**Solutions:**
1. Verify Client ID is correct
2. Check Authorized JavaScript origins in Google Cloud Console
3. Make sure your frontend URL is in the authorized list
4. **Fallback:** Use email/password authentication instead

### Issue: "Token expired" or "Invalid token"

**Cause:** JWT token has expired or is invalid

**Solutions:**
1. Login again to get a new token
2. Check `JWT_EXPIRY_HOURS` in backend (default: 24 hours)
3. Clear localStorage and login again

## Monitoring and Debugging

### Backend Logs

**Azure App Service:**
1. Go to Azure Portal → Your App Service
2. Click "Log stream" to see real-time logs
3. Look for CORS debug messages: `[CORS] Allowed request from: ...`

**Render:**
1. Go to Render Dashboard → Your Web Service
2. Click "Logs" tab
3. Filter for CORS and authentication logs

### Frontend Debugging

**Browser Developer Tools:**
1. Console tab: Check for JavaScript errors
2. Network tab: Inspect failed requests
3. Application tab → Local Storage: Check if token is stored

**Common log messages:**
- `[CORS] Allowed request from: https://...` - CORS working
- `[CORS] BLOCKED request from: https://...` - CORS issue
- `Google login error:` - Google OAuth issue

## Success Indicators

✓ Health check endpoint returns 200 OK
✓ CORS headers present in all API responses
✓ User registration returns JWT token
✓ Login returns JWT token
✓ Protected endpoints accept JWT token
✓ Frontend stores token in localStorage
✓ User can access protected routes after login
✓ Backend can be switched without code changes

## Getting Help

If you're still experiencing issues:

1. Check backend logs for specific error messages
2. Verify all environment variables are set correctly
3. Test with curl to isolate frontend vs backend issues
4. Review `BACKEND_SWITCHING_GUIDE.md` for configuration details
5. Use email/password authentication as a reliable fallback

## Automated Configuration Check

Run the configuration checker script:

```bash
cd backend
python check_auth_config.py
```

This will verify:
- All required imports work
- Environment variables are set
- CORS configuration is correct
- JWT token generation works
