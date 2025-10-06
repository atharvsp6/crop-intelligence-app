# 🚀 Quick Deployment Reference Card

## Render Deployment (Recommended for Free Tier)

### 1. Build Command
```bash
pip install -r backend/requirements.txt
```

### 2. Start Command (⚠️ IMPORTANT: Single worker!)
```bash
cd backend && gunicorn -w 1 --timeout 120 -b 0.0.0.0:$PORT app_integrated:app
```

### 3. Environment Variables
```bash
# Essential
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=https://crop-intelligence-app.vercel.app

# For ML predictions (production mode)
DEMO_MODE=false
GEMINI_API_KEY=your-gemini-api-key

# For testing/demos (no ML, instant responses)
DEMO_MODE=true
```

### 4. Health Check
```
Path: /ping
```

---

## Railway Deployment

Same as Render above, just paste into Railway dashboard.

---

## Testing After Deployment

### 1. Health Check
```bash
curl https://your-app.onrender.com/ping
```
✅ Should return: `{"status":"ok","timestamp":"..."}`

### 2. Test Crop Prediction
```bash
curl -X POST https://your-app.onrender.com/api/predict-yield \
  -H "Content-Type: application/json" \
  -d '{"crop_type":"rice","state":"Punjab","season":"kharif"}'
```
✅ Should return yield prediction (with or without `demo_mode` flag depending on setting)

### 3. Monitor Memory (in logs)
Look for these messages:
```
[Memory] Before loading CropYieldModel: XXX MB
[Memory] After cleanup: YYY MB
```

---

## Troubleshooting Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| 502 Bad Gateway | Check start command has `-b 0.0.0.0:$PORT` |
| Out of Memory | Change to `-w 1` or set `DEMO_MODE=true` |
| Slow responses | Expected (3-7s). Use `DEMO_MODE=true` for speed |
| CORS errors | Add frontend URL to `ALLOWED_ORIGINS` |
| Models not found | Run `git lfs pull` locally then push |

---

## Mode Comparison

| Feature | Demo Mode | Production Mode |
|---------|-----------|-----------------|
| **Env Var** | `DEMO_MODE=true` | `DEMO_MODE=false` |
| **RAM Usage** | 150-180 MB | 300-400 MB peak |
| **Response Time** | <100ms | 3-7 seconds |
| **ML Predictions** | Sample data | Real ML models |
| **Best For** | Testing, demos | Production |
| **512MB Tier** | ✅✅ Very safe | ✅ Safe with `-w 1` |

---

## Emergency Rollback

If deployment fails:
1. Set `DEMO_MODE=true` immediately (keeps API working)
2. Check logs for errors
3. Verify environment variables
4. Contact support with logs

---

## Memory Limits by Platform

| Platform | Free Tier RAM | Recommended Workers |
|----------|---------------|---------------------|
| Render Free | 512 MB | `-w 1` |
| Railway Free | 512 MB | `-w 1` |
| Render Starter | 1 GB | `-w 2` |
| Railway Pro | 8 GB | `-w 4` |

---

## Documentation Links

📖 **Full Docs:**
- `RAM_OPTIMIZATION_README.md` - Detailed optimization docs
- `DEPLOYMENT_GUIDE_OPTIMIZED.md` - Complete deployment guide
- `RAM_OPTIMIZATION_SUMMARY.md` - Summary of changes

🧪 **Testing:**
```bash
python backend/test_ram_optimization.py
```

---

## Quick Status Check

After deployment, verify:
- [ ] `/ping` returns 200 OK
- [ ] Logs show "Models configured for lazy loading"
- [ ] First prediction takes 5-10s (model loading)
- [ ] Memory cleanup messages appear
- [ ] No OOM crashes after 10+ requests
- [ ] Frontend can connect (no CORS errors)

---

**Remember:** Use `-w 1` for 512MB tier! 🎯
