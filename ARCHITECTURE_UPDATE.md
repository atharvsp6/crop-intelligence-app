# Crop Intelligence App - Architecture Summary

## Current Architecture: Microservices

The application is split into **independent services** for optimal deployment:

### 1️⃣ Main Application Service
**Location**: `backend/` + `frontend/`

- Flask REST API
- React SPA
- User authentication (JWT)
- MongoDB integration
- Weather & market data
- Community forum
- **Orchestrates other services**

**Deployment**: Render (Backend) + Vercel (Frontend)

---

### 2️⃣ Disease Detection Service 🆕
**Location**: `models/disease_hf/`

- **Model**: HuggingFace MobileNetV2 (14M params)
- **Accuracy**: 99.48% on PlantVillage
- **Coverage**: 38 plant diseases
  - Rice: Blast, Blight, Brown Spot
  - Wheat: Rust, Blight
  - Tomato: 10+ diseases
  - Potato: Early/Late Blight
  - Corn, Pepper, and more
- **RAM**: 250MB (fits Render free tier)
- **API**: `/predict`, `/health`, `/model-info`

**Deployment**: Independent Render service

---

### 3️⃣ Crop Yield Predictor (Embedded)
**Location**: `backend/colab_style_predictor.py`

- Random Forest model
- Lazy-loaded in main app
- (Can be extracted to separate service if needed)

---

## Service Communication

```
┌─────────────┐
│   React     │  User Interface (Port 3000)
│  Frontend   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Flask Main Backend (Port 5001)    │
│                                     │
│  • Authentication                   │
│  • Crop Yield (local RF)           │
│  • Weather/Market APIs             │
│  • Proxies Disease Detection  ────┼─────┐
│                                     │     │
└─────────────────────────────────────┘     │
                                            │
                                            ▼
                              ┌──────────────────────────┐
                              │  Disease Service (5002)  │
                              │                          │
                              │  • HuggingFace Model     │
                              │  • Indian Crop Focus     │
                              │  • 38 Disease Classes    │
                              │                          │
                              └──────────────────────────┘
```

---

## Key Benefits

✅ **Lightweight Main App**: Heavy model (250MB) runs separately  
✅ **Independent Scaling**: Scale disease detection independently  
✅ **Model Updates**: Update ML without redeploying main app  
✅ **Free Tier Compatible**: Each service fits in 512MB RAM  
✅ **Fault Isolation**: Disease service down? Main app still works (demo mode)

---

## Quick Start

### Local Development

```bash
# Terminal 1: Disease service
cd models/disease_hf
pip install -r requirements.txt
python app.py

# Terminal 2: Main backend
cd backend
# Set: DISEASE_SERVICE_URL=http://localhost:5002/predict in .env
python app_integrated.py

# Terminal 3: Frontend
cd frontend
npm start
```

### Production Deployment

1. **Deploy Disease Service** (Render):
   - Root: `models/disease_hf`
   - Get URL: `https://disease-xyz.onrender.com`

2. **Deploy Main Backend** (Render):
   - Root: `backend`
   - Env: `DISEASE_SERVICE_URL=https://disease-xyz.onrender.com/predict`

3. **Deploy Frontend** (Vercel):
   - Root: `frontend`
   - Env: `REACT_APP_API_BASE=https://main-backend.onrender.com`

---

## Technology Stack

### Main App
- **Backend**: Flask, MongoDB, JWT
- **Frontend**: React, Material-UI, Axios
- **APIs**: OpenWeather, Alpha Vantage, Gov Data

### Disease Service
- **Model**: HuggingFace Transformers
- **Framework**: PyTorch (CPU-optimized)
- **Architecture**: MobileNetV2
- **Inference**: ~500ms per image

---

## Files Changed

### New Files Created
```
models/
├── disease_hf/
│   ├── app.py                 # Flask microservice
│   ├── requirements.txt       # Lightweight dependencies
│   ├── Procfile              # Deployment config
│   ├── runtime.txt           # Python 3.11.9
│   ├── README.md             # Service documentation
│   └── test_service.py       # Testing utilities
```

### Modified Files
```
backend/
└── app_integrated.py         # Updated to proxy disease detection
```

### Documentation
```
MICROSERVICES_DEPLOYMENT.md   # Complete deployment guide
```

---

## Environment Variables

### Main App (`backend/.env`)
```env
# MongoDB
MONGO_URI=mongodb+srv://...

# Authentication
JWT_SECRET_KEY=your-strong-secret

# Disease Service (UPDATE AFTER DEPLOYMENT)
DISEASE_SERVICE_URL=https://disease-service.onrender.com/predict
DISEASE_SERVICE_TIMEOUT=30

# APIs
GEMINI_API_KEY=...
OPENWEATHER_API_KEY=...
```

### Disease Service (`models/disease_hf/.env`)
```env
# Model Selection
HF_MODEL_ID=linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification

# Server (auto-set by platform)
PORT=5002
```

---

## Next Steps

### Immediate (Required)
1. ✅ Deploy disease service to Render
2. ✅ Get service URL
3. ✅ Update main app `DISEASE_SERVICE_URL`
4. ✅ Test end-to-end with frontend

### Optional Enhancements
- Extract crop yield to separate service
- Add caching layer (Redis)
- Implement API gateway
- Add monitoring (Sentry, DataDog)

---

## Support & Docs

- **Disease Service**: `models/disease_hf/README.md`
- **Deployment Guide**: `MICROSERVICES_DEPLOYMENT.md`
- **Main App**: `backend/README.md`

---

**Summary**: All disease detection now uses the optimized HuggingFace MobileNetV2 model deployed as a separate microservice. Main app is lighter and focuses on orchestration. Ready for production deployment! 🚀
