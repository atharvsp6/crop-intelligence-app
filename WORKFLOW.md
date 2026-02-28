# YieldWise — Complete Project Workflow & Documentation

> Use this document as reference material for presentations, reports, articles, and documentation.

---

## 1. Project Overview

**Project Name:** YieldWise — AI-Powered Crop Intelligence Platform  
**Domain:** Agricultural Technology (AgriTech) / Smart Farming  
**Target Users:** Indian farmers, agricultural advisors, agri-business professionals  
**Problem Statement:** Small and marginal farmers in India lack access to data-driven tools for crop planning, disease identification, market price tracking, and financial analysis — leading to suboptimal yields and income losses.  
**Solution:** A single web platform that combines AI/ML crop prediction, real-time disease detection, live market data, financial planning, multilingual chatbot advisory, and community knowledge sharing.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│   React 19 · TypeScript · Material UI 7 · Recharts · Mapbox │
│              Hosted on Vercel (CDN)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS REST API calls
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend API Server                       │
│          Python 3.11 · Flask · Gunicorn                      │
│        Hosted on Azure App Service (Linux B1)                │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Auth Module  │  │  ML Models   │  │  External APIs     │  │
│  │ JWT + OAuth  │  │ scikit-learn │  │  Gemini · Groq     │  │
│  │ bcrypt       │  │ Pillow       │  │  OpenWeather       │  │
│  └─────────────┘  └──────────────┘  │  Alpha Vantage     │  │
│                                      │  Data.gov.in       │  │
│                                      └────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   MongoDB Atlas (Cloud)                       │
│   Collections: users, user_sessions, predictions,            │
│   forum_posts, conversations, weather_cache                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack (Detailed)

### 3.1 Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.1 | UI framework with hooks and functional components |
| TypeScript | 5.6 | Type-safe development |
| Material UI (MUI) | 7.3 | Component library with custom dark/light theme |
| Recharts | 3.2 | Data visualization — bar, line, area, pie charts |
| Mapbox GL | 2.15 | Interactive weather and mandi location maps |
| i18next | 25.5 | Internationalization — 6 Indian languages |
| React Router | 6.26 | Client-side routing with protected routes |
| Axios | 1.6 | HTTP client for API communication |

### 3.2 Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11 | Server-side runtime |
| Flask | Latest | Lightweight web framework |
| Flask-CORS | Latest | Cross-origin request handling |
| Flask-JWT-Extended | Latest | JWT token management |
| Gunicorn | 22+ | Production WSGI server |
| scikit-learn | Latest | Crop yield prediction ML model |
| Pillow | 11.1 | Image processing for disease detection |
| Google Generative AI | Latest | Gemini API for explanations, chat, disease analysis |
| Groq | 0.9+ | LLM API (Llama 3.3 70B) for real-time advisory |
| bcrypt | Latest | Password hashing |
| PyMongo | Latest | MongoDB driver |
| psutil | 5.9+ | Memory monitoring and optimization |

### 3.3 Database
- **MongoDB Atlas** (cloud-hosted, M0 free tier compatible)
- Collections: `users`, `user_sessions`, `predictions`, `forum_posts`, `conversations`, `weather_cache`

### 3.4 External APIs
| API | Purpose |
|---|---|
| Google Gemini (gemini-3.0-flash) | Crop advice, disease analysis, multilingual chat, yield explanations |
| Groq (Llama 3.3 70B) | Fast advisory: crop recommendations, pest ID, market predictions, voice |
| OpenWeatherMap | Current weather, 5-day forecasts, weather alerts |
| Alpha Vantage | Commodity price data and financial indicators |
| Data.gov.in | Government agricultural datasets, mandi prices |
| Mapbox | Interactive map tiles and geocoding |

### 3.5 Deployment
| Component | Platform | Details |
|---|---|---|
| Backend API | Azure App Service | Linux, Python 3.11, B1 plan, GitHub integration |
| Frontend | Vercel | Automatic deployment from GitHub, CDN |
| Database | MongoDB Atlas | Cloud-hosted, Azure region |
| Disease Model | Render (optional) | Hugging Face-based microservice |

---

## 4. Module-by-Module Breakdown

### 4.1 Authentication (`auth.py`)
- **Registration:** Email/password with bcrypt hashing; stores in MongoDB `users` collection
- **Login:** Validates credentials, returns JWT token (24-hour expiry, configurable)
- **Google OAuth:** One-tap sign-in; auto-creates account on first login
- **Profile Management:** View/update profile info and profile photo (base64 stored in DB)
- **Protected Routes:** Frontend `ProtectedRoute` component + backend `@jwt_required()` decorator

### 4.2 Dashboard (`Dashboard.tsx` · `dashboard_service.py`)
- **Stats Cards:** Total predictions, active crops, soil health score, community posts
- **Yield Trends Chart:** Historical yield data visualized with Recharts area chart
- **Soil Health Indicators:** pH, nitrogen, phosphorus, potassium levels
- **Recent Activity Feed:** Latest predictions, forum posts, and chatbot interactions
- **Weather Widget:** Current conditions pulled from OpenWeatherMap

### 4.3 Crop Yield Predictor (`CropPredictor.tsx` · `colab_style_predictor.py`)
- **Input:** Crop type, Indian state, season, area (hectares), year
- **ML Model:** Random Forest (scikit-learn) trained on `Custom_Crops_yield_Historical_Dataset.csv`
- **Process Flow:**
  1. User fills form → POST `/api/predict-yield`
  2. Backend loads model lazily (first use only), predicts yield in tonnes/hectare
  3. Gemini generates a natural-language explanation of the prediction
  4. Results displayed with confidence metrics and agricultural recommendations
- **Lazy Loading:** Model loaded on first request, unloaded after idle timeout to save RAM

### 4.4 Disease Detector (`DiseaseDetector.tsx` · `disease_detector.py`)
- **Input:** Upload a photo of a crop leaf
- **Detection Pipeline:**
  1. Image uploaded as base64 → POST `/api/detect-disease`
  2. For supported crops (tomato, potato, corn, grape, pepper): sent to custom Render-hosted model
  3. For all other crops: sent directly to Google Gemini with vision capabilities
  4. Returns: disease name, confidence, description, treatment plan, prevention tips
- **Gemini Fallback:** If the custom API is unavailable, all requests route through Gemini

### 4.5 Market Intelligence (`MarketIntelligence.tsx` · `market_data_service.py`)
- **Commodity Prices:** Real-time prices for rice, wheat, sugar, cotton, soybean, etc.
- **Mandi Data:** Government-sourced wholesale market (mandi) prices across India via Data.gov.in
- **Price Comparisons:** Side-by-side comparison of commodities across states and time
- **Trending Analysis:** Identifies rising/falling commodities using moving averages
- **Data Sources:** Alpha Vantage API, Quandl, Data.gov.in

### 4.6 Financial Dashboard (`FinancialDashboard.tsx` · `financial_analyzer.py`)
- **ROI Calculator:** Input crop, area, investment → projected returns, break-even analysis
- **Production Costs:** Seed, fertilizer, labor, irrigation cost breakdown by crop
- **Historical Price Charts:** Multi-year price trends for planning
- **Market Trends:** Price direction indicators and seasonal patterns

### 4.7 Community Forum (`CommunityForum.tsx` · `community_forum.py`)
- **CRUD:** Create posts (with optional images), reply, view threads
- **Likes:** Toggle like on posts
- **Search:** Full-text search across post titles and content
- **AI Moderation:** Groq checks new posts for spam/inappropriate content
- **AI Answers:** Groq can auto-generate expert answers to farming questions

### 4.8 Multilingual Chatbot (`MultilingualChatbot.tsx` · `multilingual_chatbot.py`)
- **Engine:** Google Gemini (gemini-3.0-flash)
- **Languages:** English, Hindi (हिन्दी), Bengali (বাংলা), Marathi (मराठी), Tamil (தமிழ்), Telugu (తెలుగు)
- **Features:**
  - Conversational memory (last N messages retained)
  - Crop-specific advice endpoint
  - Translation between languages
  - Integrated advice combining weather + market + crop data
- **Fallback:** If Gemini fails, returns a graceful error in the user's selected language

### 4.9 Smart Advisor / Groq Services (`SmartAdvisor.tsx` · `groq_services.py`)
- **Engine:** Groq API with Llama 3.3 70B Versatile
- **Endpoints (9 specialized):**
  1. Crop Recommendation — soil, climate, budget inputs
  2. Disease Treatment — symptom-based diagnosis
  3. Pest Identification — description-based pest ID
  4. Market Prediction — price forecasting advice
  5. Financial Planning — budget and investment plans
  6. Weather Alerts — crop-specific weather advisories
  7. Forum Answer — AI-generated expert replies
  8. Post Moderation — spam/content filtering
  9. Voice Advisory — spoken-style farming tips
- **Why Groq?** Very high free-tier rate limits (~30 req/min), ultra-low latency (~200ms)

### 4.10 Voice Commands (`VoiceCommandButton.tsx` · Groq speech endpoints)
- **Speech-to-Text:** Browser's Web Speech API captures voice → sent to Groq for intent parsing
- **Voice Intent Detection:** Groq classifies the user's spoken command into an action category
- **Voice Answer:** Groq generates a concise spoken-style response
- **Navigation:** Detected intents can auto-navigate to the relevant app section

### 4.11 Weather Service (`Weather.tsx` · `weather_service.py`)
- **Current Weather:** Temperature, humidity, wind speed, conditions for any Indian city
- **5-Day Forecast:** Hourly breakdown with rain probability
- **Alerts:** Severe weather warnings relevant to farming (frost, heatwave, heavy rain)
- **Map Integration:** Mapbox-powered interactive weather map

---

## 5. Data Flow Diagrams

### 5.1 Crop Prediction Flow
```
User Input (crop, state, season, area)
       │
       ▼
  Frontend Form Validation
       │
       ▼
  POST /api/predict-yield
       │
       ▼
  Backend: Load ML Model (lazy)
       │
       ├── scikit-learn Random Forest → yield (tonnes/ha)
       │
       ├── Gemini API → natural-language explanation
       │
       ▼
  Response: { yield, explanation, confidence, recommendations }
       │
       ▼
  Frontend: Render results with charts
```

### 5.2 Disease Detection Flow
```
User uploads leaf photo
       │
       ▼
  Frontend: Convert to base64
       │
       ▼
  POST /api/detect-disease
       │
       ▼
  Backend: Check crop type
       │
       ├── Supported crop → Custom API (Render)
       │       │
       │       ├── Success → Return diagnosis
       │       └── Failure → Fallback to Gemini
       │
       └── Other crop → Gemini Vision API
               │
               ▼
  Response: { disease, confidence, treatment, prevention }
```

### 5.3 Authentication Flow
```
User → Register/Login/Google OAuth
       │
       ▼
  Backend: Validate credentials
       │
       ├── bcrypt verify (email/password)
       └── Google token verify (OAuth)
       │
       ▼
  Generate JWT token (24h expiry)
       │
       ▼
  Frontend: Store token in localStorage
       │
       ▼
  All subsequent API calls include Authorization: Bearer <token>
```

---

## 6. API Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/google-login` | Google OAuth login |
| GET | `/api/auth/verify` | Verify JWT token |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update user profile |
| PUT | `/api/auth/profile/photo` | Update profile photo |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/yield-trends` | Historical yield trend data |
| GET | `/api/dashboard/soil-health` | Soil health indicators |
| GET | `/api/dashboard/crops` | Active crops list |
| GET | `/api/dashboard/forum` | Recent forum activity |
| GET | `/api/dashboard/activity` | Recent user activity |

### Weather
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/weather/current` | Current weather for a city |
| GET | `/api/weather/forecast` | 5-day forecast |
| GET | `/api/weather/alerts` | Weather alerts |

### Crop Prediction
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/predict-yield` | Predict crop yield |
| POST | `/api/predict-yield/explain` | Get AI explanation for a prediction |
| POST | `/api/predict-crop` | Suggest best crop for given conditions |
| GET | `/api/model-info/yield` | Model metadata and accuracy |

### Disease Detection
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/detect-disease` | Detect disease from leaf image |

### Market & Financial
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/market/commodities` | Commodity prices |
| GET | `/api/market/price-comparison` | Cross-state price comparison |
| GET | `/api/market/trending` | Trending commodities |
| GET | `/api/market/mandi-data` | Government mandi prices |
| POST | `/api/financial/roi` | ROI calculation |
| GET | `/api/financial/market-trends` | Market trend indicators |
| GET | `/api/financial/real-time-price` | Live commodity price |
| GET | `/api/financial/production-costs` | Crop production cost breakdown |
| GET | `/api/financial/historical-prices` | Historical price data |

### Chatbot
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chatbot/chat` | Send message to chatbot |
| POST | `/api/chatbot/recommendations` | Get crop recommendations |
| GET | `/api/chatbot/conversation-summary` | Conversation summary |
| POST | `/api/chatbot/clear-history` | Clear chat history |

### Multilingual Chatbot
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/mchatbot` | Multilingual chat message |
| POST | `/api/mchatbot/crop-advice` | Crop-specific advice |
| GET | `/api/mchatbot/languages` | List supported languages |
| POST | `/api/mchatbot/translate` | Translate text |
| POST | `/api/mchatbot/integrated-advice` | Combined weather+market+crop advice |

### Groq Smart Advisor
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/groq/crop-recommendation` | AI crop recommendation |
| POST | `/api/groq/disease-treatment` | AI treatment plan |
| POST | `/api/groq/pest-identify` | AI pest identification |
| POST | `/api/groq/market-prediction` | AI market price prediction |
| POST | `/api/groq/financial-plan` | AI financial planning |
| POST | `/api/groq/weather-alerts` | AI weather advisory |
| POST | `/api/groq/forum-answer` | AI forum answer |
| POST | `/api/groq/moderate-post` | AI content moderation |
| POST | `/api/groq/voice-advisory` | AI voice-style advisory |
| POST | `/api/groq/speech-to-text` | Process speech input |
| POST | `/api/groq/voice-intent` | Detect voice command intent |
| POST | `/api/groq/voice-answer` | Voice-style answer |
| POST | `/api/groq/quick-advice` | Quick one-line advice |
| GET | `/api/groq/status` | Groq service health check |

### Forum
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/forum/posts` | List forum posts |
| POST | `/api/forum/posts` | Create new post |
| GET | `/api/forum/posts/:id` | Get single post |
| POST | `/api/forum/posts/:id/replies` | Reply to a post |
| POST | `/api/forum/posts/:id/like` | Like/unlike a post |
| GET | `/api/forum/search` | Search forum posts |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/` | API welcome page |

---

## 7. Database Schema

### Users Collection
```json
{
  "_id": "ObjectId",
  "email": "string",
  "password_hash": "bcrypt hash",
  "name": "string",
  "phone": "string (optional)",
  "location": "string (optional)",
  "photo": "base64 string (optional)",
  "google_id": "string (if Google OAuth)",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Forum Posts Collection
```json
{
  "_id": "ObjectId",
  "title": "string",
  "content": "string",
  "author_id": "string",
  "author_name": "string",
  "category": "string",
  "image": "base64 (optional)",
  "likes": ["user_id"],
  "replies": [
    {
      "author_id": "string",
      "author_name": "string",
      "content": "string",
      "created_at": "datetime"
    }
  ],
  "created_at": "datetime"
}
```

### Predictions Collection
```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "crop_type": "string",
  "state": "string",
  "season": "string",
  "area": "number",
  "predicted_yield": "number",
  "explanation": "string",
  "created_at": "datetime"
}
```

---

## 8. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Flask over Django** | Lightweight; only REST APIs needed, no server-side rendering |
| **Gemini + Groq (dual LLM)** | Gemini for deep analysis and multilingual chat; Groq for fast, high-throughput advisory (free tier: ~30 req/min) |
| **Lazy model loading** | ML models loaded on first request, not at startup — reduces cold-start time and memory to ~120 MB |
| **Custom disease API + Gemini fallback** | Custom model gives higher accuracy for 5 supported crops; Gemini covers all other crops |
| **i18next with bundled translations** | No network calls for language switching; instant UI translation in 6 languages |
| **JWT over sessions** | Stateless auth suitable for Vercel → Azure cross-origin architecture |
| **MongoDB Atlas** | Schema-flexible, cloud-native, free tier available, good Python driver |
| **Azure App Service** | Student credits available, native Python support, GitHub CI/CD integration |

---

## 9. Security Measures

- Passwords hashed with **bcrypt** (salt rounds)
- JWT tokens with **configurable expiry** (default 24 hours)
- **CORS whitelist** — only known frontend origins allowed
- **Google OAuth** token verification via Google's API
- Environment variables for all secrets (never hardcoded)
- Input validation on all API endpoints
- Rate limiting via Gunicorn worker configuration

---

## 10. Performance Optimizations

- **Lazy Model Loading:** ML models not loaded until first prediction request — saves ~300 MB RAM
- **Memory Manager:** `psutil`-based monitoring; auto-cleanup when RAM exceeds threshold
- **Compressed Build Artifacts:** Oryx uses zstd compression for Azure deployment
- **Single Worker + Timeout:** Gunicorn configured with 1 worker + 600s timeout for memory-constrained B1 plan
- **Frontend Code Splitting:** React lazy loading for route-level components
- **CDN Delivery:** Vercel serves frontend from edge locations globally

---

## 11. User Journey

1. **Landing Page** → User sees YieldWise hero section with feature highlights
2. **Sign Up / Login** → Register with email or one-click Google sign-in
3. **Dashboard** → Overview of weather, crops, yield trends, soil health, recent activity
4. **Predict Yield** → Select crop, state, season → get AI-powered yield prediction with explanation
5. **Detect Disease** → Upload leaf photo → get instant diagnosis and treatment plan
6. **Check Markets** → View live commodity prices, mandi rates, price trends
7. **Financial Planning** → Calculate ROI, view production costs, analyze historical prices
8. **Ask the Chatbot** → Chat in any of 6 languages about farming queries
9. **Get Quick Advice** → Use Smart Advisor for instant Groq-powered recommendations
10. **Voice Command** → Speak a farming question → get a spoken-style AI answer
11. **Community** → Post questions, share knowledge, get AI-moderated expert answers

---

## 12. Supported Crops & Regions

### Crops (Yield Prediction)
Arecanut, Arhar/Tur, Bajra, Banana, Barley, Black pepper, Cardamom, Cashewnut, Castor seed, Coconut, Coriander, Cotton, Cowpea, Dry chillies, Garlic, Ginger, Gram, Groundnut, Guar seed, Horse-gram, Jute, Khesari, Linseed, Maize, Mango, Masoor, Mesta, Moong, Moth, Niger seed, Oilseeds, Onion, Other Rabi pulses, Peas, Potato, Ragi, Rapeseed/Mustard, Rice, Rubber, Safflower, Sannhemp, Sesamum, Small millets, Soyabean, Sugarcane, Sunflower, Sweet potato, Tapioca, Tea, Tobacco, Turmeric, Urad, Wheat

### Indian States
All 28 states + 8 Union Territories

### Seasons
Kharif, Rabi, Whole Year, Summer, Winter, Autumn

---

## 13. Future Scope

- Satellite imagery integration for farm-level monitoring
- IoT sensor data ingestion (soil moisture, temperature)
- Regional language voice I/O using Bhashini API
- Crop insurance recommendation engine
- Farmer-to-buyer direct marketplace
- Drone-based field scanning integration
- Offline-first Progressive Web App (PWA) mode

---

## 14. References & Data Sources

- [OpenWeatherMap API](https://openweathermap.org/api)
- [Google Gemini API](https://ai.google.dev/)
- [Groq Cloud](https://console.groq.com/)
- [Data.gov.in — Open Government Data](https://data.gov.in/)
- [Alpha Vantage — Financial APIs](https://www.alphavantage.co/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- Indian Agricultural Statistics — Ministry of Agriculture & Farmers' Welfare
