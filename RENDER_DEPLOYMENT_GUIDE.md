# Render Deployment Quick Fix Guide

## ✅ CORS Fixed
Your Render URL has been added to allowed origins: `https://crop-intelligence-app-az6b.onrender.com`

The code now includes:
- ✅ Your Render URL in hardcoded allowed origins
- ✅ Global OPTIONS preflight handler
- ✅ Enhanced CORS debugging in logs
- ✅ Memory optimizations for 512MB limit

## 🚀 Render Deployment Steps

### 1. Environment Variables (Set in Render Dashboard)

Go to your Render service → **Environment** tab and add:

```bash
# Required
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET_KEY=your_secret_key_here
GEMINI_API_KEY=your_gemini_api_key

# CORS (optional - already hardcoded in code now)
ALLOWED_ORIGINS=https://crop-intelligence-app.vercel.app

# Demo Mode (optional - set to true for testing without ML)
DEMO_MODE=false

# Memory optimization (optional)
COLAB_MODEL_COMPRESS_LEVEL=5
```

### 2. Build & Start Commands

**Build Command:**
```bash
pip install -r backend/requirements.txt
```

**Start Command (CRITICAL - Use Single Worker!):**
```bash
cd backend && gunicorn -w 1 --timeout 120 -b 0.0.0.0:$PORT app_integrated:app
```

⚠️ **Important:** Must use `-w 1` (single worker) to stay under 512MB RAM limit!

### 3. Service Configuration

- **Environment:** Python 3
- **Region:** Choose closest to your users
- **Instance Type:** Free (512 MB RAM)
- **Health Check Path:** `/ping`
- **Auto-Deploy:** Yes (from GitHub main branch)

## 🔍 Verify Deployment

### Check 1: Health Endpoint
```bash
curl https://crop-intelligence-app-az6b.onrender.com/ping
```

Expected: `{"status":"ok","timestamp":"..."}`

### Check 2: CORS Headers
```bash
curl -I -X OPTIONS https://crop-intelligence-app-az6b.onrender.com/api/auth/login \
  -H "Origin: https://crop-intelligence-app.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

Expected headers:
```
Access-Control-Allow-Origin: https://crop-intelligence-app.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Credentials: true
```

### Check 3: Render Logs

In Render dashboard → **Logs**, look for:

✅ **Startup logs:**
```
[Startup] Models configured for lazy loading. Memory usage:
[Memory] After imports, before model loading: ~100-150 MB
[CORS] Configured allowed origins: ['https://crop-intelligence-app-az6b.onrender.com', 'https://crop-intelligence-app.vercel.app', ...]
```

✅ **CORS logs (when frontend makes request):**
```
[CORS] Preflight request from: https://crop-intelligence-app.vercel.app
[CORS] Allowed request from: https://crop-intelligence-app.vercel.app
```

❌ **If you see:**
```
[CORS] ⚠️ BLOCKED request from: https://crop-intelligence-app.vercel.app
```
→ Check `ALLOWED_ORIGINS` environment variable is set correctly

## 🧠 Memory Management

### Expected Memory Usage:

| Stage | RAM Usage | Status |
|-------|-----------|--------|
| Startup (no models loaded) | 100-150 MB | ✅ Safe |
| Idle (between requests) | 100-150 MB | ✅ Safe |
| During crop prediction | 300-400 MB | ✅ Should fit in 512MB |
| After prediction cleanup | 150-200 MB | ✅ Safe |

### Monitor for OOM:

**If you see in logs:**
```
Ran out of memory (used over 512MB) while running your code.
```

**Quick fixes:**

1. **Enable Demo Mode (fastest):**
   - Set `DEMO_MODE=true` in Render environment
   - Redeploy
   - API will return sample data without loading ML models
   - Use this while debugging

2. **If OOM persists even with optimizations:**
   - I can reduce model complexity (fewer trees: 200 → 100)
   - Or upgrade to Render $7/month plan (512MB → 2GB RAM)

## 🔄 Current Status

**What's been optimized:**

✅ **CORS:** Fixed for Render + Vercel
✅ **Memory:** Lazy loading, mmap mode, single-threaded predict
✅ **Startup:** No models loaded at startup
✅ **Cleanup:** Explicit model cleanup after each prediction
✅ **Logging:** Comprehensive memory & CORS debugging

**Expected behavior:**

- First prediction: ~5-10 seconds (model loading)
- Subsequent predictions: ~3-7 seconds (model loads fresh each time)
- Memory stays under 512MB with single worker
- CORS works from Vercel frontend

## 🆘 Troubleshooting

### Issue: CORS Still Blocked

**Check:**
1. Render has redeployed with latest code (check deployment timestamp)
2. Browser cache cleared (hard refresh: Ctrl+Shift+R)
3. Logs show CORS allowed messages
4. No typos in Vercel frontend API URL

**Fix:**
- Wait 2-3 minutes for Render auto-deploy
- Check Render logs for CORS configuration

### Issue: 502 Bad Gateway

**Cause:** App didn't start or crashed

**Check:**
1. Render logs for Python errors
2. All environment variables set
3. Build command completed successfully
4. Start command using correct path (`cd backend && gunicorn...`)

### Issue: Authentication Failing

**Cause:** JWT_SECRET_KEY mismatch or missing

**Fix:**
1. Set `JWT_SECRET_KEY` in Render environment
2. Must be same value across deployments
3. Redeploy after setting

### Issue: MongoDB Connection Error

**Symptoms:** 500 errors, logs show "Could not connect to MongoDB"

**Fix:**
1. Verify `MONGODB_URI` is set correctly
2. Check MongoDB Atlas allows connections from all IPs (0.0.0.0/0)
3. Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### Issue: Out of Memory

**Immediate fix:**
```bash
# In Render environment, add:
DEMO_MODE=true
```

**Permanent fix (if demo mode not acceptable):**
- Let me know and I'll reduce model size (reduce N_ESTIMATORS)
- Or upgrade Render plan to get more RAM

## 📊 Next Steps After Deploy

1. **Wait for Render to auto-deploy** (2-3 minutes)
2. **Check logs** for startup messages
3. **Test from frontend:** Try logging in from Vercel app
4. **Monitor memory:** Watch for OOM messages
5. **Report back:** Share any errors you see

## 🎯 Expected Results

✅ **CORS:** Should work immediately after redeploy
✅ **Memory:** Should stay under 512MB with single worker
✅ **Performance:** 3-7 second predictions (acceptable for free tier)
✅ **Reliability:** No crashes, stable operation

---

**Status:** ✅ Code pushed to GitHub
**Action:** Render should auto-deploy in 2-3 minutes
**Monitoring:** Check Render logs for CORS and memory messages
**Next:** Test login from your Vercel frontend
