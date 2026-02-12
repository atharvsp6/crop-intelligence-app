# YieldWise

A comprehensive full-stack crop intelligence platform for farmers, built with Flask, React, and MongoDB integration.



## 🌾 Features

- **🔐 Secure Authentication:** JWT-based auth with email/password and optional Google OAuth, seamlessly works across Azure, Render, or any backend
- **🤖 Crop Yield Predictor:** Machine Learning Random Forest regressor trained on MongoDB crop data for accurate yield predictions
- **🔍 Disease Detection:** Deep learning model (TensorFlow/Keras) for plant disease identification with image analysis
- **💰 Financial Dashboard:** ROI calculator, market trend analysis, and financial decision support
- **⚡ Live Market Intelligence:** Multi-source commodity pricing with background refresh, caching, and WebSocket streaming updates
- **🌍 Community Forum:** Multilingual farmer community with threaded discussions (supports English, Hindi, Spanish, French, German)
- **💬 AI Chatbot:** Gemini API-powered conversational assistant for instant farming advice
- **🎨 Modern UI:** Light/dark mode toggle with Material-UI design
- **📊 Real-time Data:** All modules integrated with MongoDB for live data storage and retrieval

## 🏗️ Architecture

```
crop-intelligence-app/
│
├── backend/                    # Flask API server
│   ├── app_integrated.py      # Unified Flask application (all API endpoints)
│   ├── database.py            # MongoDB connection and data management
│   ├── crop_predictor.py      # ML-based yield prediction module
│   ├── disease_detector.py    # AI-powered disease detection
│   ├── financial_analyzer.py  # ROI and market analysis
│   ├── market_data_service.py # Indian market costing + multi-source fallbacks
│   ├── community_forum.py     # Multilingual forum functionality
│   ├── chatbot.py             # Gemini AI integration
│   ├── realtime_market_service.py  # Multi-API market data orchestrator
│   ├── websocket_market_service.py # WebSocket broadcaster for live prices
│   ├── requirements.txt       # Python dependencies
│   ├── test_mandi_api.py      # Govt mandi API diagnostics
│   ├── test_real_apis.py      # Connectivity checks for external feeds
│   └── .env.example          # Environment variables template
│
├── frontend/                   # React TypeScript web app
│   ├── src/
│   │   ├── components/        # React components for each feature
│   │   │   ├── Dashboard.tsx  # Main dashboard with statistics
│   │   │   ├── CropPredictor.tsx
│   │   │   ├── DiseaseDetector.tsx
│   │   │   ├── FinancialDashboard.tsx
│   │   │   ├── CommunityForum.tsx
│   │   │   ├── Chatbot.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── hooks/
│   │   │   └── useRealTimeMarketData.ts  # WebSocket + HTTP market data hook
│   │   ├── App.tsx            # Main app with routing
│   │   └── ...
│   ├── package.json           # Node.js dependencies
│   └── ...
│
├── model/                      # Model artifacts (drop `plant_disease_model.h5` here when enabled)
│   └── README.md              # Instructions for supplying the disease model
│
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## 🚀 Quick Start

> **🔐 New to Authentication?** See [AUTHENTICATION_QUICK_START.md](AUTHENTICATION_QUICK_START.md) for detailed authentication setup guide.

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB Atlas (recommended) or local MongoDB
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd crop-intelligence-app
```

### 2. Backend Setup
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration (see below)

# Verify configuration
python check_auth_config.py

# Start Flask server
python app_integrated.py
```

**Required Environment Variables** (in `backend/.env`):
```env
# Authentication
JWT_SECRET_KEY=<generate-with-python-secrets>
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# CORS (for production)
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app

# AI Services (recommended)
GEMINI_API_KEY=<your-google-gemini-api-key>
```

The backend will start on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend

# Install Node.js dependencies
npm install

# Set up environment variables
# Create .env.local file:
echo "REACT_APP_API_BASE=http://localhost:5000" > .env.local

# Start React development server
npm start
```

The frontend will start on `http://localhost:3000`

### 4. Test Authentication
1. Open `http://localhost:3000` in your browser
2. Click "SIGN UP" and create an account
3. Login with your credentials
4. You should be redirected to the dashboard

**Demo Credentials** (if test data exists):
- Email: `demo2@gmail.com`
- Password: `demo123`

### 4. MongoDB Setup
Create a MongoDB database with these collections:
- `crop_yield_data` - Historical crop yield data
- `market_prices` - Current market pricing information
- `forum_posts` - Community forum discussions

The application will automatically initialize with sample data.

### 5. Optional: AI Model Setup
Place your trained plant disease detection model at:
```
model/plant_disease_model.h5
```

If no model is provided, the application will create a sample model for demonstration.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory (see `.env.example` for a template) and populate the keys you need:

| Key | Required | Purpose |
| --- | --- | --- |
| `MONGO_URI` | ✅ | MongoDB connection string used by all services |
| `JWT_SECRET_KEY` | ✅ | Secret for signing auth tokens |
| `GEMINI_API_KEY` | ✅ | Powers the multilingual AI chatbot |
| `MULTILINGUAL_GEMINI_MODEL` | ➕ | Override Gemini model (defaults provided) |
| `ALPHA_VANTAGE_API_KEY` | ✅ | Live commodity quotes (500 free calls/day) |
| `DATA_GOV_IN_API_KEY` / `GOVT_OPEN_DATA_KEY` | ✅ for Indian mandi data | Government mandi price feed (resilient fallback to cached/Yahoo/Alpha Vantage when offline) |
| `EXCHANGERATE_API_KEY` | ➕ | USD ↔︎ INR currency conversion (used by diagnostics today) |
| `QUANDL_API_KEY` | ➕ | Nasdaq Data Link commodity datasets (optional fallback) |
| `COMMODITIES_API_KEY` | ➕ | Commodities-API.com feed (leave empty if you don’t have a paid plan) |
| `OPENWEATHER_API_KEY` | ✅ | Weather forecasts and alerts |
| `ALLOWED_ORIGINS` | ➕ | Comma-separated frontend origins for CORS (defaults cover localhost:3000/3001) |

```env
MONGO_URI=mongodb://localhost:27017/crop_intelligence
GEMINI_API_KEY=your_gemini_api_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
DATA_GOV_IN_API_KEY=your_data_gov_key
EXCHANGERATE_API_KEY=optional_exchange_rate_key
JWT_SECRET_KEY=replace_with_secure_random_value
FLASK_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

> Never commit the real `.env` file—copy `.env.example`, fill it locally, and keep secrets out of version control.

### Diagnostics & Health Checks

- `python test_real_apis.py` — quick sanity check that your Alpha Vantage / ExchangeRate keys return live data.
- `python test_mandi_api.py` — verifies the Indian government mandi endpoint; expect a "Resource id doesn't exist" message when the upstream dataset is temporarily unpublished.
- Watch backend logs for `real_time_price` messages to confirm cache hits/misses and fallback sources.
- WebSocket smoke test: `wscat -c ws://localhost:8765` (or any WebSocket client) should stream `market_update` payloads every minute.

## 📋 API Endpoints

### Crop Prediction
- `POST /api/predict-yield` - Predict crop yield
- `POST /api/train-yield-model` - Train ML model

### Disease Detection  
- `POST /api/detect-disease` - Analyze plant disease from image

### Financial Analysis & Market Intelligence
- `POST /api/financial/roi` - Calculate return on investment for a crop/region
- `GET /api/financial/market-trends` - Rolling trend series with cache-aware refresh
- `GET /api/financial/real-time-price` - Multi-API live snapshot (Yahoo → Alpha Vantage → World Bank/Data.gov fallbacks)
- `GET /api/market/commodities` - Enumerate supported commodity IDs and metadata
- `GET /api/market/price-comparison` - Compare multiple commodities in one call
- `GET /api/market/trending` - Volatility-based trending list
- `GET /api/financial/production-costs` - Region-aware production cost breakdown

### Community Forum
- `GET /api/forum/posts` - List forum posts
- `POST /api/forum/posts` - Create new post
- `POST /api/forum/posts/{id}/replies` - Add reply
- `GET /api/forum/search` - Search posts

### AI Chatbot
- `POST /api/chat` - Chat with AI assistant
- `POST /api/chat/crop-recommendations` - Get crop advice
- `POST /api/chat/analyze-problem` - Analyze farming issues

## 🌟 Key Features Detail

### 1. Crop Yield Predictor
- **Machine Learning**: Random Forest regression model
- **Input Parameters**: Temperature, humidity, soil pH, rainfall, NPK values
- **Features**: Confidence intervals, feature importance analysis
- **Data Storage**: All predictions stored in MongoDB

### 2. Disease Detection
- **Deep Learning**: TensorFlow/Keras CNN model  
- **Image Analysis**: Upload plant images for disease identification
- **Results**: Disease classification, confidence scores, treatment recommendations
- **Support**: 13+ plant diseases across multiple crops

### 3. Financial Dashboard
- **ROI Calculator**: Comprehensive return on investment analysis
- **Market Trends**: Real-time price tracking and trend analysis
- **Risk Assessment**: Investment risk evaluation
- **Charts**: Interactive price history visualizations

### 4. Community Forum
- **Multilingual**: 5 languages supported (English, Hindi, Spanish, French, German)
- **Features**: Threaded discussions, search, categories, likes
- **Real-time**: Live post updates and notifications
- **Moderation**: Content filtering and user management

### 5. AI Chatbot
- **Gemini AI**: Google's advanced language model integration
- **Contexts**: Crop recommendations, problem analysis, weather advice
- **Fallback**: Comprehensive offline knowledge base
- **History**: Conversation tracking and context awareness

### 6. Live Market Intelligence
- **Multi-source aggregation**: Tries Yahoo Finance → Alpha Vantage → Indian Govt mandi feed → World Bank/Quandl, with automatic cache-based fallbacks when a source is offline.
- **Background refresh**: `realtime_market_service` schedules updates every minute, with rate limiting and Mongo-backed caching to stay within free API quotas.
- **WebSocket streaming**: Optional broadcaster pushes `market_update` frames over `ws://localhost:8765`, backed by the same aggregator.
- **Resilience**: When `data.gov.in` returns the upstream `"Resource id doesn't exist"` error, the service records the incident, reuses the freshest cache entry, and surfaces the condition in the response metadata.

## 🚢 Deployment

The application supports seamless deployment across multiple platforms without code changes.

### Supported Platforms

- **Azure App Service** - Automatic deployment via GitHub Actions
- **Render** - One-click deployment with `render.yaml`
- **Vercel** - Frontend deployment (automatic with GitHub integration)
- **Local** - Development environment

### Quick Deployment Guides

**For Azure:**
See [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md) for detailed Azure setup.

**For Render:**
1. Connect your GitHub repository
2. Use the `render.yaml` blueprint
3. Set environment variables in Render Dashboard
4. Deploy

**For Production Frontend (Vercel):**
1. Connect your GitHub repository
2. Set `REACT_APP_API_BASE` to your backend URL
3. Optional: Set `REACT_APP_GOOGLE_CLIENT_ID` for Google OAuth
4. Deploy

### Seamless Backend Switching

Switch between Azure and Render without code changes:

1. **Update Frontend Environment Variable:**
   - Vercel Dashboard → Settings → Environment Variables
   - Change `REACT_APP_API_BASE` to new backend URL
   - Redeploy

2. **Backend automatically allows CORS from:**
   - All `*.vercel.app` domains
   - All `*.azurewebsites.net` domains
   - All `*.onrender.com` domains

**See [BACKEND_SWITCHING_GUIDE.md](BACKEND_SWITCHING_GUIDE.md) for complete instructions.**

### Deployment Verification

After deployment, verify your setup:

```bash
# Backend health check
curl https://your-backend-url/ping

# Run automated configuration check
cd backend && python check_auth_config.py
```

**See [DEPLOYMENT_VERIFICATION.md](DEPLOYMENT_VERIFICATION.md) for detailed testing guide.**

## 🔐 Authentication System

The application includes a robust authentication system with:

- **Email/Password Authentication** (always works, no setup required)
- **Google OAuth** (optional, requires Google Cloud Console setup)
- **JWT Token-based** (secure, stateless)
- **Cross-platform support** (works seamlessly on Azure, Render, or any backend)

### Quick Authentication Setup

1. **Set Backend Environment Variables:**
   ```env
   JWT_SECRET_KEY=<generate-strong-secret>
   MONGO_URI=<your-mongodb-connection-string>
   FRONTEND_URL=<your-frontend-url>
   ```

2. **Set Frontend Environment Variable:**
   ```env
   REACT_APP_API_BASE=<your-backend-url>
   ```

3. **Optional - Enable Google OAuth:**
   - Get Client ID from [Google Cloud Console](https://console.cloud.google.com/)
   - Set `REACT_APP_GOOGLE_CLIENT_ID` in frontend
   - Add your frontend URL to Authorized JavaScript Origins

**See [AUTHENTICATION_QUICK_START.md](AUTHENTICATION_QUICK_START.md) for complete setup guide.**

### Authentication Features

✅ Secure JWT token generation and validation
✅ Password hashing with bcrypt
✅ User registration and login
✅ Protected API routes
✅ Token expiration handling
✅ Google OAuth integration (optional)
✅ Works across all deployment platforms
✅ Detailed error messages and fallback guidance

## 🛠️ Technology Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: MongoDB with PyMongo
- **ML/AI**: Scikit-learn, TensorFlow, Keras
- **AI Integration**: Google Generative AI (Gemini)
- **Image Processing**: Pillow, NumPy

### Frontend  
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router DOM
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Internationalization**: React-i18next

### Development
- **Language**: Python 3.8+, TypeScript 4.9+
- **Package Managers**: pip, npm
- **Development**: Hot reload, error boundaries
- **Code Quality**: ESLint, TypeScript strict mode

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Theme toggle with persistent preference
- **Material Design**: Clean, modern interface following Google's guidelines
- **Accessibility**: ARIA labels, keyboard navigation support
- **Performance**: Optimized components and lazy loading

## 🔒 Security Features

- **Input Validation**: Comprehensive server-side validation
- **Error Handling**: Graceful error recovery and user feedback
- **API Security**: CORS configuration and request validation
- **Data Protection**: Secure MongoDB connections

## 📈 Performance

- **Backend**: Efficient MongoDB queries with indexing
- **Frontend**: React optimization with useMemo and useCallback
- **Caching**: Browser caching for static assets
- **Scalability**: Modular architecture ready for horizontal scaling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please:
1. Check the documentation above
2. Search existing issues
3. Create a new issue with detailed description
4. Contact the development team

## 🙏 Acknowledgments

- **Machine Learning**: Scikit-learn and TensorFlow teams
- **UI Framework**: Material-UI community
- **AI Integration**: Google Gemini AI platform
- **Database**: MongoDB community
- **Open Source**: All the amazing open-source libraries used

---

**Built with ❤️ for farmers worldwide** 🌾
