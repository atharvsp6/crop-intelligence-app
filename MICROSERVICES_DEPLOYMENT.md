# Microservices Architecture Deployment Guide

## Overview

The crop intelligence app is split into **3 independently deployable services**:

```
1. Main App (Backend + Frontend) - Flask + React
2. Disease Detection Service - Hugging Face MobileNetV2
3. (Future) Crop Yield Service - Random Forest (optional separate deployment)
```

## Why Separate Services?

- **Memory Optimization**: Disease model (250MB) deployed separately from main app
- **Independent Scaling**: Scale services based on usage
- **Model Updates**: Update ML models without redeploying main app
- **Cost Efficiency**: Run heavy models on paid tier, light services on free tier

---

## Service 1: Main Application

**Location**: `backend/` + `frontend/`

### Features
- User authentication (JWT)
- Crop yield prediction
- Weather integration
- Market data
- Community forum
- **Proxies to disease service**

### Deployment (Render/Railway)

1. **Backend**:
   - Root: `backend/`
   - Build: `pip install -r requirements.txt`
   - Start: `gunicorn app_integrated:app`
   - Env Variables:
     ```
     MONGO_URI=mongodb+srv://...
     JWT_SECRET_KEY=your-secret
     DISEASE_SERVICE_URL=https://disease-hf.onrender.com/predict
     GEMINI_API_KEY=...
     ```

2. **Frontend**:
   - Root: `frontend/`
   - Build: `npm install && npm run build`
   - Start: `serve -s build`
   - Env Variables:
     ```
     REACT_APP_API_BASE=https://your-backend.onrender.com
     ```

---

## Service 2: Disease Detection (Hugging Face)

**Location**: `models/disease_hf/`

### Features
- MobileNetV2 (14M params, 250MB RAM)
- 38 disease classes
- Indian crops: Rice, Wheat, Tomato, Potato, Corn
- 99.48% accuracy

### Deployment Steps

#### Option A: Render.com

1. **Create New Web Service**
   - Name: `crop-disease-detector`
   - Repository: Select your repo
   - **Root Directory**: `models/disease_hf`

2. **Configure Build**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn --workers 1 --threads 1 --timeout 120 app:app`

3. **Settings**
   - Instance Type: Free (512MB) ✅ Fits!
   - Python Version: 3.11.9 (runtime.txt)

4. **Environment Variables**
   ```
   HF_MODEL_ID=linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification
   PORT=10000
   ```

5. **Deploy** - Note the URL: `https://crop-disease-detector.onrender.com`

#### Option B: Railway.app

1. **New Project** → Deploy from GitHub
2. **Settings**:
   - Root Directory: `models/disease_hf`
   - Build Command: (auto-detected from Procfile)
   - Start Command: (auto-detected from Procfile)

3. **Deploy** - Get the URL

#### Option C: Docker (Self-Hosted)

```bash
cd models/disease_hf
docker build -t disease-service .
docker run -p 5002:5002 -e HF_MODEL_ID=linkanjarad/... disease-service
```

### Testing the Service

```bash
# Health check
curl https://your-disease-service.onrender.com/health

# Test prediction
curl -X POST https://your-disease-service.onrender.com/predict \
  -F "image=@test_plant.jpg"
```

---

## Connecting Services

### Update Main App

In main app `.env`:
```env
# Production disease service
DISEASE_SERVICE_URL=https://crop-disease-detector.onrender.com/predict
DISEASE_SERVICE_TIMEOUT=30

# For local dev (run disease service on localhost:5002)
# DISEASE_SERVICE_URL=http://localhost:5002/predict
```

### Flow Diagram

```
User → React Frontend (Port 3000)
         ↓
      Main Backend (Port 5001)
         ↓ /api/detect-disease
      Disease Service (Port 5002)
         ↓
      HuggingFace Model
         ↓
      JSON Response → User
```

---

## Local Development Setup

### Terminal 1: Disease Service
```bash
cd models/disease_hf
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5002
```

### Terminal 2: Main Backend
```bash
cd backend
# .env should have: DISEASE_SERVICE_URL=http://localhost:5002/predict
python app_integrated.py
# Runs on http://localhost:5001
```

### Terminal 3: Frontend
```bash
cd frontend
npm start
# Runs on http://localhost:3000
```

---

## Cost Breakdown

| Service | Platform | Tier | RAM | Cost |
|---------|----------|------|-----|------|
| Main Backend | Render | Free | 512MB | $0 |
| Frontend | Vercel | Free | N/A | $0 |
| Disease Service | Render | Free | 512MB | $0 |
| **Total** | | | | **$0/month** |

**Upgrade Options**:
- If main app needs more RAM → Render $7/month (512MB → 1GB)
- If disease service slow → Railway Pro $5/month (better CPU)

---

## Production Checklist

### Main App
- [ ] Set `DISEASE_SERVICE_URL` to production URL
- [ ] Configure CORS to allow disease service domain
- [ ] Set `JWT_SECRET_KEY` (strong secret)
- [ ] Set `MONGO_URI` (production MongoDB)

### Disease Service
- [ ] Deploy to Render/Railway
- [ ] Verify `/health` endpoint returns `{"status": "healthy"}`
- [ ] Test `/predict` with sample image
- [ ] Note service URL for main app

### Frontend
- [ ] Set `REACT_APP_API_BASE` to main backend URL
- [ ] Build and deploy to Vercel

---

## Monitoring

### Disease Service Health
```bash
# Check if service is up
curl https://disease-service.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2026-01-12T..."
}
```

### Main App Logs
```bash
# Check if disease service is reachable
# Should see: "[Disease Detection] Using microservice at: https://..."
```

---

## Troubleshooting

### "Cannot connect to disease detection service"
**Cause**: `DISEASE_SERVICE_URL` not set or wrong
**Fix**: 
1. Deploy disease service first
2. Set `DISEASE_SERVICE_URL=https://your-deployed-url.com/predict` in main app
3. Restart main app

### "Disease detection service timeout"
**Cause**: Cold start (Render free tier sleeps after 15 min inactivity)
**Fix**:
- First request takes 10-15s (model loading) - this is normal
- Subsequent requests are fast (~500ms)
- Upgrade to paid tier to avoid sleep

### "Model not loaded" in disease service
**Cause**: Insufficient RAM or wrong `HF_MODEL_ID`
**Fix**:
1. Check logs: `model_loaded: false`
2. Verify `HF_MODEL_ID` is valid on Hugging Face
3. Use default model (already tested)

---

## Alternative Models

Edit `models/disease_hf/.env`:

```bash
# Default (recommended) - 14M params, 250MB RAM
HF_MODEL_ID=linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification

# Smaller (if RAM issues) - 86M params
HF_MODEL_ID=nateraw/vit-base-beans

# Object detection (heavier) - 41M params
HF_MODEL_ID=susnato/detr-resnet-50-plant-disease-detection
```

---

## Future Enhancements

### Service 3: Crop Yield Predictor (Optional)
Move Random Forest to `models/crop_yield/` for separate deployment if needed.

### API Gateway
Add nginx/Cloudflare to route requests to appropriate services.

### Caching
Add Redis to cache frequent disease predictions.

---

## Support

- **Disease Service Issues**: Check `models/disease_hf/README.md`
- **Main App Issues**: Check `backend/README.md`
- **Deployment Help**: Render docs, Railway docs
