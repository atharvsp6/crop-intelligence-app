# Deployment Guide - RAM Optimized Version

## Quick Start

### Option 1: Demo Mode (Fastest, No ML Models)
Perfect for testing, demos, or when you just want the API running.

**Environment Variables:**
```bash
DEMO_MODE=true
ALLOWED_ORIGINS=https://your-frontend.vercel.app
JWT_SECRET_KEY=your-secret-key
MONGODB_URI=your-mongodb-uri
```

**Start Command:**
```bash
gunicorn -w 1 --timeout 120 -b 0.0.0.0:$PORT app_integrated:app
```

**RAM Usage:** ~150-180 MB peak
**Response Time:** <100ms
**Suitable For:** Testing, demos, frontend development

### Option 2: Production Mode (Full ML Models)
Full ML capabilities with optimized memory usage.

**Environment Variables:**
```bash
DEMO_MODE=false  # or don't set it at all
GEMINI_API_KEY=your-gemini-key
ALLOWED_ORIGINS=https://your-frontend.vercel.app
JWT_SECRET_KEY=your-secret-key
MONGODB_URI=your-mongodb-uri
```

**Start Command:**
```bash
gunicorn -w 1 --timeout 120 -b 0.0.0.0:$PORT app_integrated:app
```

**RAM Usage:** ~300-400 MB peak (during predictions), ~150 MB baseline
**Response Time:** 3-7 seconds (includes model loading)
**Suitable For:** Production with 512MB+ RAM

---

## Platform-Specific Instructions

### Render

1. **Create New Web Service**
   - Repository: Link your GitHub repo
   - Branch: `main`
   - Root Directory: Leave blank
   - Runtime: `Python 3`

2. **Build & Start Commands**
   ```bash
   # Build Command
   pip install -r backend/requirements.txt
   
   # Start Command
   cd backend && gunicorn -w 1 --timeout 120 -b 0.0.0.0:$PORT app_integrated:app
   ```

3. **Environment Variables** (in Render Dashboard)
   ```
   DEMO_MODE = false
   GEMINI_API_KEY = your_actual_gemini_key
   MONGODB_URI = your_actual_mongodb_uri
   JWT_SECRET_KEY = your_actual_secret_key
   ALLOWED_ORIGINS = https://your-frontend.vercel.app
   ```

4. **Advanced Settings**
   - Plan: Free (512 MB RAM)
   - Health Check Path: `/ping`
   - Auto-Deploy: Yes

### Railway

1. **Create New Project**
   - Add GitHub repo
   - Select `backend` as root directory

2. **Settings**
   ```bash
   # Build Command (auto-detected from requirements.txt)
   pip install -r requirements.txt
   
   # Start Command
   gunicorn -w 1 --timeout 120 -b 0.0.0.0:$PORT app_integrated:app
   ```

3. **Variables** (in Railway Dashboard)
   ```
   DEMO_MODE=false
   GEMINI_API_KEY=your_key
   MONGODB_URI=your_uri
   JWT_SECRET_KEY=your_secret
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   PORT=8080
   ```

4. **Resources**
   - Memory Limit: 512 MB
   - Healthcheck: `/ping`

### Vercel (Frontend)

Your frontend is already deployed, but update the API URL:

**Frontend Environment Variable:**
```
REACT_APP_API_BASE=https://your-backend.onrender.com
```

**IMPORTANT:** Don't include trailing slash!

---

## Verification Steps

### 1. Test Health Check
```bash
curl https://your-backend.onrender.com/ping
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-07T00:00:00.000000"
}
```

### 2. Test Demo Mode (if enabled)
```bash
curl -X POST https://your-backend.onrender.com/api/predict-yield \
  -H "Content-Type: application/json" \
  -d '{"crop_type":"rice","state":"Punjab"}'
```

Expected response includes: `"demo_mode": true`

### 3. Test Production Mode (if enabled)
Same curl command as above.
Expected response includes: `"predicted_yield": 4.XX` (actual ML prediction, no `demo_mode` flag)

### 4. Monitor Memory Usage
Check deployment logs for lines like:
```
[Memory] Before loading CropYieldModel: 125.32 MB
[Memory] After loading CropYieldModel: 312.87 MB
[Memory] CropYieldModel loaded, used 187.55 MB
[Memory] Cleaned up CropYieldModel
[Memory] After crop prediction and cleanup: 128.91 MB
```

---

## Troubleshooting

### Problem: 502 Bad Gateway or "No open ports detected"

**Cause:** Gunicorn not binding to PORT correctly.

**Solution:** 
- Ensure start command includes `-b 0.0.0.0:$PORT`
- Verify PORT environment variable exists (or defaults to 5001)
- Check logs for "Listening at: http://0.0.0.0:XXXX"

### Problem: Out of Memory (OOM) Crashes

**Symptoms:**
- App restarts frequently
- "Killed" messages in logs
- Error 503 Service Unavailable

**Solutions:**
1. **Switch to Demo Mode temporarily:**
   ```
   DEMO_MODE=true
   ```

2. **Verify single worker:**
   ```bash
   gunicorn -w 1 ...  # NOT -w 2 or higher
   ```

3. **Upgrade plan:** If possible, upgrade to 1GB+ RAM tier

### Problem: Slow Response Times

**Cause:** Model loading happens on every request (expected behavior).

**Solutions:**
1. **Use Demo Mode** for non-critical testing
2. **Upgrade RAM** to enable model caching
3. **Accept trade-off:** Low RAM = slower but functional

### Problem: CORS Errors from Frontend

**Cause:** Frontend origin not in `ALLOWED_ORIGINS`.

**Solution:**
```bash
# Include both with and without www
ALLOWED_ORIGINS=https://crop-intelligence-app.vercel.app,https://www.crop-intelligence-app.vercel.app
```

### Problem: Models Not Found

**Symptoms:**
- Errors about missing `.joblib` or `.h5` files
- "Using statistical fallback" messages

**Solution:**
1. **Ensure Git LFS pulled models:**
   ```bash
   git lfs pull
   ```

2. **Verify files exist:**
   ```bash
   ls -lh backend/colab_rf_model.joblib
   ls -lh model/plant_disease_model.h5
   ```

3. **Re-commit if needed:**
   ```bash
   git add backend/colab_rf_model.joblib backend/colab_rf_model_meta.json
   git add model/plant_disease_model.h5
   git commit -m "Ensure model files tracked"
   git push
   ```

---

## Performance Expectations

### Demo Mode
| Metric | Value |
|--------|-------|
| Startup Time | 5-10 seconds |
| RAM Usage (Idle) | 100-150 MB |
| RAM Usage (Peak) | 150-180 MB |
| Response Time | <100ms |
| Requests/min | 60+ |

### Production Mode (512 MB RAM, Single Worker)
| Metric | Value |
|--------|-------|
| Startup Time | 5-10 seconds |
| RAM Usage (Idle) | 100-150 MB |
| RAM Usage (During Prediction) | 300-400 MB |
| RAM Usage (After Cleanup) | 150-200 MB |
| Response Time | 3-7 seconds |
| Requests/min | 6-12 |

### Production Mode (1GB+ RAM, Multi-Worker)
| Metric | Value |
|--------|-------|
| Workers | 2-3 |
| RAM Usage (Idle) | 200-300 MB |
| RAM Usage (Peak) | 600-800 MB |
| Response Time | 1-3 seconds |
| Requests/min | 20-40 |

---

## Migration from Old Version

If you're upgrading from the previous version without lazy loading:

### 1. Update Code
```bash
git pull origin main
```

### 2. Update Dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. Update Environment Variables
Add this new variable:
```
DEMO_MODE=false
```

### 4. Update Start Command
Change from:
```bash
gunicorn -w 2 --timeout 120 -b 0.0.0.0:$PORT app_integrated:app
```

To:
```bash
gunicorn -w 1 --timeout 120 -b 0.0.0.0:$PORT app_integrated:app
```

### 5. Redeploy
Trigger a new deployment and monitor logs.

### 6. Verify
- Check `/ping` endpoint
- Test a prediction
- Monitor memory logs
- Confirm no OOM crashes

---

## Rollback Plan

If deployment fails:

1. **Immediate Fix:** Enable demo mode
   ```
   DEMO_MODE=true
   ```
   This keeps API responsive while you debug.

2. **Revert Code:** 
   ```bash
   git revert HEAD
   git push
   ```

3. **Contact Support:**
   - Check deployment logs
   - Review memory usage patterns
   - Verify environment variables

---

## Monitoring Checklist

After deployment, verify:

- [ ] `/ping` endpoint responds with 200 OK
- [ ] Logs show "Models configured for lazy loading"
- [ ] Memory logs appear for predictions
- [ ] Cleanup messages appear after predictions
- [ ] No OOM errors in logs
- [ ] Response times acceptable (3-7s for ML predictions)
- [ ] CORS working from frontend
- [ ] Authentication endpoints working
- [ ] Database connection successful

---

## Support & Documentation

- **RAM Optimization Details:** See `RAM_OPTIMIZATION_README.md`
- **Architecture:** See `ARCHITECTURE.md`
- **API Documentation:** See `STREAMLINED_API_GUIDE.md`
- **Testing:** Run `python backend/test_ram_optimization.py`

---

## Contact

For deployment issues, check:
1. Application logs in your deployment platform
2. Browser console for frontend errors
3. Network tab for API request/response details
4. Memory logs for RAM usage patterns
