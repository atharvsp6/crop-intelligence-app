# Free Tier Deployment Guide

This guide covers deploying the Crop Intelligence Platform entirely on free-tier services.

## Recommended Stack (All Free Tier)

| Service | Platform | Free Tier Limits |
|---------|----------|------------------|
| Backend API | Railway / Render | 500 hours/month |
| Disease AI Service | Railway / Render | 500 hours/month |
| Yield AI Service | Railway / Render | 500 hours/month |
| Database | Firebase Realtime DB | 1GB storage, 10GB/month transfer |
| Frontend | Vercel / Netlify | Unlimited |

---

## Option 1: Railway Deployment (Recommended)

### Prerequisites
- GitHub account
- Railway account (https://railway.app)
- Firebase account (https://firebase.google.com)

### Step 1: Prepare Firebase

1. Go to Firebase Console → Create Project
2. Enable Realtime Database
3. Go to Project Settings → Service Accounts
4. Generate new private key (JSON file)
5. Keep this file secure - you'll need it later

### Step 2: Deploy AI Services

#### Disease Detection Service

1. Go to Railway Dashboard
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - **Root Directory**: `ai-services/disease-detection-service`
   - **Build Command**: (auto-detected from Dockerfile)
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. Add environment variables:
```
DEBUG=false
DEVICE=cpu
MODEL_NAME=efficientnet_b0
USE_PRETRAINED=true
CONFIDENCE_THRESHOLD=0.3
```

6. Deploy and note the URL (e.g., `https://disease-service-xxxx.railway.app`)

#### Yield Prediction Service

1. Create another Railway service
2. Configure:
   - **Root Directory**: `ai-services/crop-yield-service`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. Add environment variables:
```
DEBUG=false
USE_ENSEMBLE=true
```

4. Deploy and note the URL (e.g., `https://yield-service-xxxx.railway.app`)

### Step 3: Deploy Main Backend

1. Create another Railway service
2. Configure:
   - **Root Directory**: `backend-fastapi`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. Add environment variables:
```
ENVIRONMENT=production
DEBUG=false
DISEASE_SERVICE_URL=https://disease-service-xxxx.railway.app
YIELD_SERVICE_URL=https://yield-service-xxxx.railway.app
JWT_SECRET_KEY=<generate-a-strong-secret>
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_DATABASE_URL=https://<project-id>.firebaseio.com
FIREBASE_CREDENTIALS_JSON=<paste-entire-json-as-string>
```

4. Deploy and note the URL

### Step 4: Test Deployment

```bash
# Health check
curl https://your-api.railway.app/health

# API docs
open https://your-api.railway.app/docs
```

---

## Option 2: Render Deployment

### Step 1: Create render.yaml

Create `render.yaml` in project root:

```yaml
services:
  - type: web
    name: crop-api
    env: docker
    dockerfilePath: ./backend-fastapi/Dockerfile
    dockerContext: ./backend-fastapi
    healthCheckPath: /health
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: DISEASE_SERVICE_URL
        fromService:
          name: disease-service
          type: web
          property: host
      - key: YIELD_SERVICE_URL
        fromService:
          name: yield-service
          type: web
          property: host

  - type: web
    name: disease-service
    env: docker
    dockerfilePath: ./ai-services/disease-detection-service/Dockerfile
    dockerContext: ./ai-services/disease-detection-service
    healthCheckPath: /health
    plan: free

  - type: web
    name: yield-service
    env: docker
    dockerfilePath: ./ai-services/crop-yield-service/Dockerfile
    dockerContext: ./ai-services/crop-yield-service
    healthCheckPath: /health
    plan: free
```

### Step 2: Deploy on Render

1. Go to Render Dashboard
2. New → Blueprint
3. Connect your repository
4. Render will detect `render.yaml` and create all services

---

## Option 3: Fly.io Deployment

### Install Fly CLI

```bash
# Windows (PowerShell)
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Linux/Mac
curl -L https://fly.io/install.sh | sh
```

### Deploy Services

```bash
# Disease Service
cd ai-services/disease-detection-service
fly launch --name disease-service
fly deploy

# Yield Service
cd ../crop-yield-service
fly launch --name yield-service
fly deploy

# Main API
cd ../../backend-fastapi
fly launch --name crop-api
fly secrets set DISEASE_SERVICE_URL=https://disease-service.fly.dev
fly secrets set YIELD_SERVICE_URL=https://yield-service.fly.dev
fly deploy
```

---

## Firebase Setup Details

### Database Rules

Set these rules for basic security:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "crop_data": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "disease_detections": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "market_data": {
      ".read": true,
      ".write": false
    },
    "forum": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

### Data Structure

```
├── users/
│   └── {user_id}/
│       ├── email
│       ├── name
│       ├── role
│       └── created_at
├── crop_data/
│   └── {prediction_id}/
│       ├── user_id
│       ├── crop
│       ├── prediction
│       └── timestamp
├── disease_detections/
│   └── {detection_id}/
│       ├── user_id
│       ├── result
│       └── timestamp
└── market_data/
    └── {commodity}/
        ├── prices
        └── updated_at
```

---

## Environment Variables Reference

### Backend API
| Variable | Required | Description |
|----------|----------|-------------|
| `ENVIRONMENT` | Yes | production/staging/development |
| `DEBUG` | No | Enable debug mode (default: false) |
| `JWT_SECRET_KEY` | Yes | Secret for JWT signing |
| `DISEASE_SERVICE_URL` | Yes | Disease detection service URL |
| `YIELD_SERVICE_URL` | Yes | Yield prediction service URL |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_DATABASE_URL` | Yes | Firebase database URL |
| `FIREBASE_CREDENTIALS_JSON` | Yes* | Firebase credentials as JSON string |
| `WEATHER_API_KEY` | No | OpenWeatherMap API key |

### AI Services
| Variable | Required | Description |
|----------|----------|-------------|
| `DEBUG` | No | Enable debug mode |
| `DEVICE` | No | cpu or cuda (default: cpu) |
| `MODEL_NAME` | No | Model architecture |

---

## Monitoring & Logs

### Railway
- View logs: Dashboard → Service → Logs
- Metrics: Dashboard → Service → Metrics

### Render
- View logs: Dashboard → Service → Logs

### Health Checks

All services expose:
- `/health` - Basic health check
- `/ready` - Readiness (includes dependencies)
- `/metrics` - Prometheus metrics

---

## Cost Optimization Tips

1. **Sleep on inactivity**: Free tier services sleep after inactivity. First request may be slow.

2. **Optimize cold starts**:
   - Use lightweight base images
   - Minimize dependencies
   - Lazy load models

3. **Cache aggressively**:
   - Weather data: 5 min TTL
   - Market data: 1 hour TTL
   - Model predictions: Consider caching similar inputs

4. **Use Firebase efficiently**:
   - Batch reads/writes
   - Structure data for minimal reads
   - Use caching layer

5. **Monitor usage**:
   - Railway: Dashboard shows usage
   - Firebase: Console shows reads/writes

---

## Troubleshooting

### Service won't start
1. Check logs for errors
2. Verify environment variables
3. Check health endpoint locally first

### AI service timeout
1. Increase timeout in settings
2. Check memory limits
3. Optimize model loading

### Firebase connection issues
1. Verify credentials JSON is valid
2. Check database URL format
3. Verify network access

### Cold start delays
1. Add warmup endpoint
2. Use persistent connections
3. Consider upgrade to paid tier for always-on

---

## Upgrading from Free Tier

When you outgrow free tier:

| Need | Solution | Cost |
|------|----------|------|
| More hours | Railway Hobby: $5/month | ~$5-20/month |
| More memory | Render Standard: $7/month | ~$21/month (3 services) |
| GPU inference | RunPod/Lambda Labs | ~$0.20/hour |
| More database | Firebase Blaze (pay-as-go) | ~$5-25/month |

Total estimated cost for light production: **$30-50/month**
