# 🌾 Crop Intelligence Platform - Revamped

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-grade, AI-first agricultural intelligence platform designed for Indian farmers. Features plant disease detection, crop yield prediction, weather insights, and market intelligence.

## 🚀 Features

### AI Services
- **Disease Detection**: EfficientNet-based deep learning model for plant disease identification
- **Crop Yield Prediction**: Ensemble ML model (XGBoost + LightGBM + CatBoost) for accurate yield forecasting

### Platform Features
- **Weather Intelligence**: Agricultural weather forecasts with farming recommendations
- **Market Data**: Real-time mandi prices across India
- **User Dashboard**: Personalized insights and history tracking
- **Community Forum**: Knowledge sharing among farmers

### Technical Highlights
- 🔥 **FastAPI Backend**: High-performance async API
- 🔐 **JWT Authentication**: Secure token-based auth
- ☁️ **Firebase Integration**: Real-time database with caching
- 🐳 **Docker Ready**: Easy containerized deployment
- 💰 **Free Tier Optimized**: Runs entirely on free cloud services

## 📁 Project Structure

```
crop-intelligence-app/
├── ai-services/
│   ├── disease-detection-service/    # Plant disease AI microservice
│   │   ├── main.py                   # FastAPI application
│   │   ├── model.py                  # EfficientNet model
│   │   ├── config.py                 # Configuration
│   │   ├── schemas.py                # Pydantic schemas
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── crop-yield-service/           # Yield prediction AI microservice
│       ├── main.py                   # FastAPI application
│       ├── model.py                  # Ensemble ML model
│       ├── features.py               # Feature engineering
│       ├── config.py                 # Configuration
│       ├── schemas.py                # Pydantic schemas
│       ├── Dockerfile
│       └── requirements.txt
│
├── backend-fastapi/                  # Main API gateway
│   ├── main.py                       # FastAPI application
│   ├── app/
│   │   ├── api/v1/                   # API routes
│   │   │   ├── auth.py               # Authentication
│   │   │   ├── disease.py            # Disease detection
│   │   │   ├── yield_prediction.py   # Yield prediction
│   │   │   ├── weather.py            # Weather data
│   │   │   ├── market.py             # Market prices
│   │   │   └── dashboard.py          # Dashboard
│   │   ├── core/                     # Core utilities
│   │   │   ├── config.py             # Configuration
│   │   │   ├── security.py           # JWT & auth
│   │   │   └── logging.py            # Structured logging
│   │   ├── db/                       # Database layer
│   │   │   ├── firebase.py           # Firebase integration
│   │   │   └── repositories.py       # Data repositories
│   │   ├── services/                 # External services
│   │   │   ├── ai_client.py          # AI service clients
│   │   │   ├── weather.py            # Weather API
│   │   │   └── market.py             # Market data
│   │   └── schemas/                  # Pydantic schemas
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml                # Production compose
├── docker-compose.dev.yml            # Development compose
└── SETUP_GUIDE.md                    # This file
```

## 🛠️ Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose (optional)
- Firebase account (for production)
- OpenWeatherMap API key (optional)

### Local Development

1. **Clone and checkout the revamp branch:**
```bash
git clone <repository-url>
cd crop-intelligence-app
git checkout revamp-ai-fast-backend
```

2. **Set up the backend:**
```bash
cd backend-fastapi
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
```

3. **Set up AI services:**
```bash
# Disease Detection Service
cd ../ai-services/disease-detection-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Yield Prediction Service
cd ../crop-yield-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

4. **Run the services:**

Terminal 1 - Disease Detection Service:
```bash
cd ai-services/disease-detection-service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Terminal 2 - Yield Prediction Service:
```bash
cd ai-services/crop-yield-service
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

Terminal 3 - Main API:
```bash
cd backend-fastapi
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

5. **Access the API:**
- Main API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Disease Service: http://localhost:8001/docs
- Yield Service: http://localhost:8002/docs

### Docker Deployment

```bash
# Development
docker-compose -f docker-compose.dev.yml up --build

# Production
docker-compose up --build -d
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/auth/me` | Get current user |

### Disease Detection
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/disease/detect` | Detect disease from image |
| GET | `/api/v1/disease/classes` | Get all disease classes |
| GET | `/api/v1/disease/history` | Get detection history |

### Crop Yield Prediction
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/yield/predict` | Predict crop yield |
| GET | `/api/v1/yield/crops` | Get supported crops |
| POST | `/api/v1/yield/compare` | Compare multiple crops |
| GET | `/api/v1/yield/history` | Get prediction history |

### Weather
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/weather/current` | Get current weather |
| GET | `/api/v1/weather/forecast` | Get weather forecast |
| GET | `/api/v1/weather/agricultural` | Get agricultural weather |

### Market Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/market/prices/{commodity}` | Get commodity prices |
| GET | `/api/v1/market/mandis` | Get mandi list |
| GET | `/api/v1/market/trend/{commodity}` | Get price trend |
| GET | `/api/v1/market/summary` | Get market summary |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/` | Get user dashboard |
| GET | `/api/v1/dashboard/stats` | Get user statistics |
| GET | `/api/v1/dashboard/services` | Get service status |

## 🔧 Configuration

### Environment Variables

#### Backend API
```env
ENVIRONMENT=development          # development, staging, production
DEBUG=true                       # Enable debug mode
DISEASE_SERVICE_URL=http://localhost:8001
YIELD_SERVICE_URL=http://localhost:8002
JWT_SECRET_KEY=your-secret-key
FIREBASE_CREDENTIALS_PATH=       # Path to Firebase credentials
WEATHER_API_KEY=                 # OpenWeatherMap API key
```

#### Disease Detection Service
```env
MODEL_NAME=efficientnet_b0       # Model architecture
DEVICE=cpu                       # cpu or cuda
CONFIDENCE_THRESHOLD=0.3         # Minimum confidence
```

#### Yield Prediction Service
```env
USE_ENSEMBLE=true                # Use ensemble predictions
MODEL_PATH=models/yield_model.joblib
```

## 🌐 Deployment

### Railway (Recommended for Free Tier)

1. Create three Railway services:
   - `crop-api` (backend-fastapi)
   - `disease-service` (ai-services/disease-detection-service)
   - `yield-service` (ai-services/crop-yield-service)

2. Set environment variables for each service

3. Deploy from GitHub

### Render

1. Create three Web Services
2. Point to respective Dockerfiles
3. Configure environment variables

### Docker on VPS

```bash
docker-compose up -d --build
```

## 📊 AI Models

### Disease Detection
- **Architecture**: EfficientNet-B0 (transfer learning)
- **Dataset**: PlantVillage + Indian crop diseases
- **Classes**: 40 disease categories across 12 crops
- **Crops Supported**: Rice, Wheat, Cotton, Sugarcane, Maize, Tomato, Potato, Apple, Grape, etc.

### Yield Prediction
- **Models**: XGBoost, LightGBM, CatBoost (ensemble)
- **Features**: 30 engineered features
- **Inputs**: Weather, soil, crop, and location data
- **Crops Supported**: 12+ major Indian crops

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation with Pydantic
- CORS configuration

## 📈 Monitoring

- Prometheus metrics at `/metrics`
- Health check at `/health`
- Readiness check at `/ready`
- Structured JSON logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- PlantVillage for disease dataset
- Indian Council of Agricultural Research (ICAR)
- OpenWeatherMap for weather data
- Firebase for database
