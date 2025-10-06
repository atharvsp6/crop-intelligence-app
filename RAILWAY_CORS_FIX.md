# Railway CORS Fix Guide

## Issue
CORS error: "No 'Access-Control-Allow-Origin' header is present on the requested resource"

## Root Cause
Railway deployment doesn't have the `ALLOWED_ORIGINS` environment variable set, so it's only allowing localhost origins.

## Solution

### Option 1: Set Environment Variable in Railway (Recommended)

1. **Go to your Railway project dashboard**
   - Visit https://railway.app/dashboard
   - Select your `crop-intelligence-app` project

2. **Navigate to Variables tab**
   - Click on your backend service
   - Click "Variables" in the left sidebar

3. **Add/Update ALLOWED_ORIGINS**
   ```
   Variable Name: ALLOWED_ORIGINS
   Value: https://crop-intelligence-app.vercel.app,https://www.crop-intelligence-app.vercel.app
   ```

4. **Add other required variables if missing:**
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET_KEY=your_jwt_secret_key
   DEMO_MODE=false
   ```

5. **Save and redeploy**
   - Railway will automatically redeploy with new variables
   - Wait for deployment to complete

### Option 2: Use Code Fix (Already Applied)

The code has been updated to **automatically include** your Vercel domain even without environment variables:

```python
# These domains are ALWAYS allowed (hardcoded):
"https://crop-intelligence-app.vercel.app"
"https://www.crop-intelligence-app.vercel.app"
```

After pushing the updated code, Railway will allow these origins automatically.

## Verification Steps

### 1. Check Railway Logs
After deployment, check logs for:
```
[CORS] Configured allowed origins: ['https://crop-intelligence-app.vercel.app', ...]
```

### 2. Test CORS from Browser Console
Open your Vercel app and run:
```javascript
fetch('https://crop-intelligence-app-production.up.railway.app/ping')
  .then(r => r.json())
  .then(d => console.log('Success:', d))
  .catch(e => console.error('CORS Error:', e));
```

Should see: `Success: {status: 'ok', timestamp: '...'}`

### 3. Test Login Endpoint
Try logging in from your frontend. Check Railway logs for:
```
[CORS] Allowed request from: https://crop-intelligence-app.vercel.app
```

If you see:
```
[CORS] ⚠️ BLOCKED request from: ...
```

Then the origin isn't in the allowed list - check environment variables!

## Current Environment Variables Status

Based on your deployment, you need these variables in Railway:

| Variable | Required | Example |
|----------|----------|---------|
| `ALLOWED_ORIGINS` | Yes | `https://crop-intelligence-app.vercel.app` |
| `GEMINI_API_KEY` | Yes* | `AIza...` |
| `MONGODB_URI` | Yes | `mongodb+srv://...` |
| `JWT_SECRET_KEY` | Yes | `your-secret-key` |
| `DEMO_MODE` | No | `false` |
| `PORT` | Auto | Set by Railway |

*Not required if `DEMO_MODE=true`

## Quick Fix Commands

If you want to push the code fix right now:

```bash
# Code has been updated with debugging and Railway URL
git add backend/app_integrated.py
git commit -m "Fix CORS for Railway deployment with debugging"
git push

# Railway will auto-deploy the new code
```

## Debugging CORS Issues

### Check Railway Logs in Real-Time

1. Go to Railway dashboard
2. Click your service
3. Click "Deployments" → Latest deployment
4. Click "View Logs"

Look for:
- `[CORS] Configured allowed origins:` - Shows what's allowed
- `[CORS] Allowed request from:` - Shows successful requests
- `[CORS] ⚠️ BLOCKED request from:` - Shows blocked requests

### Common Issues

**Issue:** "Blocked request from: https://crop-intelligence-app.vercel.app"
**Fix:** `ALLOWED_ORIGINS` not set or has typo. Add environment variable.

**Issue:** "Blocked request from: http://localhost:3000" 
**Fix:** Expected in production. Localhost only works in development.

**Issue:** CORS works for `/ping` but not `/api/auth/login`
**Fix:** Likely JWT or authentication issue, not CORS. Check JWT_SECRET_KEY.

## Testing After Fix

1. **Push the updated code** (already done above)
2. **Wait for Railway to deploy** (~2-3 minutes)
3. **Check logs** for CORS configuration
4. **Test login** from your Vercel frontend
5. **Check network tab** in browser DevTools - should see CORS headers

## Expected Headers in Response

When CORS is working correctly, you'll see these headers in the response:

```
Access-Control-Allow-Origin: https://crop-intelligence-app.vercel.app
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin
```

## Still Having Issues?

1. **Check Railway environment variables** - Make sure they're set correctly
2. **Check Railway logs** - Look for CORS debugging messages
3. **Clear browser cache** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. **Check frontend config** - Verify `REACT_APP_API_BASE` points to Railway URL
5. **Test with curl** to isolate frontend issues:

```bash
# Test preflight request
curl -X OPTIONS https://crop-intelligence-app-production.up.railway.app/api/auth/login \
  -H "Origin: https://crop-intelligence-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Should see Access-Control-Allow-Origin in response headers
```

## Rollback Plan

If issues persist, enable demo mode temporarily:

1. Set `DEMO_MODE=true` in Railway
2. This keeps API responsive while debugging
3. Fix CORS issues
4. Set back to `DEMO_MODE=false`

---

**Status:** Code updated with fix ✅  
**Action needed:** Deploy to Railway (automatic) or manually set environment variables  
**ETA:** 2-3 minutes for Railway auto-deploy
