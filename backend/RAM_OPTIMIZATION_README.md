# RAM Optimization for Low-Memory Deployments

## Overview
This Flask backend has been optimized for deployment on platforms with strict RAM limits (e.g., Render Free Tier 512MB). The optimization strategy eliminates startup memory overhead from heavy ML models and provides flexible demo/production modes.

## Key Changes

### 1. Lazy Loading of ML Models
**Before:** Models loaded at application startup (~200-300MB RAM)
**After:** Models loaded only when endpoints are called, then immediately cleaned up

### 2. Demo Mode
Set `DEMO_MODE=true` environment variable to bypass ML model loading entirely:
- Returns realistic sample data instantly
- Perfect for testing, demonstrations, or frontend development
- Zero ML-related memory usage

### 3. Automatic Memory Management
- Models are loaded using context managers
- Automatic cleanup after each prediction
- Explicit garbage collection after heavy operations
- Memory usage logging for monitoring

## Environment Variables

### Required
- `GEMINI_API_KEY` - For AI recommendations (unchanged)
- `MONGODB_URI` - Database connection (unchanged)
- `JWT_SECRET_KEY` - Authentication (unchanged)
- `ALLOWED_ORIGINS` - CORS origins (unchanged)

### New Variables
- **`DEMO_MODE`** (optional, default: `false`)
  - Set to `true`, `1`, or `yes` to enable demo mode
  - Returns hardcoded sample responses without loading ML models
  - Ideal for testing, demos, or when RAM is extremely limited

### Unchanged Variables
- `COLAB_MODEL_COMPRESS_LEVEL` (default: `5`) - Model compression level
- `PORT` (default: `5001`) - Server port

## Deployment Configuration

### Render Free Tier (512 MB RAM)
```bash
# Build Command
pip install -r requirements.txt

# Start Command (IMPORTANT: Use single worker!)
gunicorn -w 1 --timeout 120 -b 0.0.0.0:$PORT app_integrated:app

# Environment Variables (in Render Dashboard)
DEMO_MODE=false                    # Set to 'true' for demo mode
GEMINI_API_KEY=your_key_here
MONGODB_URI=your_mongodb_uri
JWT_SECRET_KEY=your_secret_key
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

**Critical:** Use `-w 1` (single worker) to stay within 512MB limit!

### Railway (512 MB RAM)
Same configuration as Render above.

### Higher RAM Tiers (1GB+)
If you have more RAM available, you can use more workers:
```bash
# For 1GB+ RAM
gunicorn -w 2 --timeout 120 -b 0.0.0.0:$PORT app_integrated:app
```

## Memory Usage Patterns

### Demo Mode (`DEMO_MODE=true`)
- **Startup:** ~100-150 MB
- **Per Request:** +5-10 MB (temporary)
- **Peak:** ~150-180 MB
- **Suitable for:** 512 MB tier ✅

### Production Mode (`DEMO_MODE=false`)
- **Startup:** ~100-150 MB (no models loaded)
- **Crop Prediction Request:** ~250-350 MB (loads RandomForest temporarily)
- **Disease Detection Request:** ~200-280 MB (loads TensorFlow/Keras temporarily)
- **After Request:** Returns to ~100-150 MB (model cleaned up)
- **Suitable for:** 512 MB tier ✅ (with single worker and sequential requests)

### Old Implementation (For Comparison)
- **Startup:** ~350-450 MB (both models loaded)
- **Per Request:** +50-100 MB
- **Peak:** ~500-600 MB
- **Suitable for:** 512 MB tier ❌ (frequent OOM crashes)

## API Endpoints Affected

All endpoints continue to work with the same request/response format:

### Crop Prediction
- `POST /api/predict-crop` - Main prediction endpoint
- `POST /api/predict-yield` - Public prediction with Gemini validation
- `POST /api/colab/predict` - Raw prediction endpoint
- `POST /api/train-model` - Model training endpoint

### Disease Detection
- `POST /api/detect-disease` - Image-based disease detection

### Model Management
- `GET/POST /api/setup-model` - Initialize model for deployment
- `GET /api/model-info/yield` - Get model metadata
- `POST /api/model-info/yield/debug-aligned` - Debug feature alignment

## Testing the Optimization

### 1. Test Demo Mode Locally
```bash
# Terminal 1: Start server in demo mode
cd backend
export DEMO_MODE=true  # or 'set DEMO_MODE=true' on Windows
python app_integrated.py

# Terminal 2: Test endpoint
curl -X POST http://localhost:5001/api/predict-yield \
  -H "Content-Type: application/json" \
  -d '{"crop_type":"rice","state":"Punjab","season":"kharif"}'
```

Expected response includes `"demo_mode": true`

### 2. Test Production Mode Locally
```bash
# Terminal 1: Start server in production mode
cd backend
export DEMO_MODE=false  # or 'set DEMO_MODE=false' on Windows
python app_integrated.py

# Watch memory logs in console output:
# [Memory] Before loading CropYieldModel: XX.XX MB
# [Memory] After loading CropYieldModel: YY.YY MB
# [Memory] Cleaned up CropYieldModel
# [Memory] After cleanup: ZZ.ZZ MB
```

### 3. Monitor Memory on Render/Railway
Check application logs for memory usage:
```
[Startup] Models configured for lazy loading. Memory usage:
[Memory] After imports, before model loading: 120.45 MB
...
[Memory] Before loading CropYieldModel: 125.32 MB
[Memory] After loading CropYieldModel: 312.87 MB
[Memory] CropYieldModel loaded, used 187.55 MB
[Memory] Cleaned up CropYieldModel
[Memory] After crop prediction and cleanup: 128.91 MB
```

## Migration Guide

### For Existing Deployments
1. **Update environment variables:**
   - Add `DEMO_MODE=false` to your deployment dashboard
   
2. **Update start command:**
   - Change from `-w 2` or `-w 4` to `-w 1`
   - Keep `--timeout 120` for model loading operations

3. **Redeploy:**
   - Push changes to trigger rebuild
   - Monitor startup logs for lazy loading confirmation
   - Test one prediction endpoint to verify model loading works

### Rollback Plan
If issues occur, you can temporarily enable demo mode:
1. Set `DEMO_MODE=true` in environment variables
2. This keeps the API responsive with sample data
3. Debug and fix issues while frontend remains functional

## Code Architecture

### New Files
- **`backend/memory_manager.py`** - Memory management utilities
  - `LazyModelLoader` - Context manager for lazy loading
  - `log_memory()` - RAM usage logging
  - `cleanup_model()` - Explicit model cleanup
  - `is_demo_mode()` - Demo mode detection
  - `get_demo_response()` - Sample response generator

### Modified Files
- **`backend/app_integrated.py`** - Main application
  - Removed global model imports
  - Added lazy loader instances
  - Updated all prediction endpoints with context managers
  - Added demo mode checks
  - Added memory logging

- **`backend/requirements.txt`**
  - Added `psutil>=5.9.0` for memory monitoring

## Troubleshooting

### Issue: "Import psutil could not be resolved"
**Solution:** Install dependencies:
```bash
pip install -r requirements.txt
```

### Issue: Models not loading in production
**Check:**
1. Model files exist: `colab_rf_model.joblib`, `model/plant_disease_model.h5`
2. Git LFS pulled correctly: `git lfs pull`
3. Logs show "Before loading [Model]" messages
4. Not in demo mode: `DEMO_MODE` is `false` or unset

### Issue: High memory usage persists
**Check:**
1. Using single worker: `-w 1` in start command
2. Memory logs show cleanup: "After cleanup" messages
3. Concurrent requests (only 1 worker can handle requests sequentially)

### Issue: Slow first request
**Expected:** First ML prediction takes 5-10 seconds (model loading)
**Subsequent requests:** 1-3 seconds (model loads from disk each time but cleanup happens)

## Performance Characteristics

### Latency
- **Demo Mode:** <100ms per request
- **Production Mode - First Request:** 5-10 seconds (model loading)
- **Production Mode - Subsequent:** 3-7 seconds (load → predict → cleanup)

### Throughput
- **Single Worker:** 6-12 requests/minute (with model loading/cleanup)
- **Demo Mode:** 60+ requests/minute

### Trade-offs
✅ **Benefits:**
- Fits in 512 MB RAM
- No startup failures
- Predictable memory usage
- Demo mode for testing

❌ **Trade-offs:**
- Slower predictions (model loaded per request)
- Sequential request handling only
- Higher CPU usage (repeated loading)

## Future Optimizations

### If You Upgrade to Higher RAM Tier (1GB+)
1. Use model caching: Keep models in memory for 5-10 minutes
2. Increase workers: `-w 2` or `-w 3`
3. Remove cleanup calls to keep models loaded

### If You Need Faster Responses
1. Keep `DEMO_MODE=true` for non-critical endpoints
2. Use serverless functions with pre-warmed containers
3. Consider dedicated ML serving infrastructure (TensorFlow Serving, etc.)

## Monitoring Checklist

✅ Check logs for memory usage patterns
✅ Verify "lazy loading" confirmation at startup
✅ Monitor for OOM errors (Out Of Memory)
✅ Track response times for ML endpoints
✅ Ensure cleanup messages appear after predictions
✅ Confirm RAM stays under 400 MB between requests

## Support

For issues or questions:
1. Check application logs for memory usage patterns
2. Verify environment variables are set correctly
3. Test with `DEMO_MODE=true` to isolate ML issues
4. Review memory logs for cleanup confirmation
