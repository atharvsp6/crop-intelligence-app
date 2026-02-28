# YieldWise — AI-Powered Crop Intelligence Platform

YieldWise is a full-stack web application that empowers Indian farmers with AI-driven crop yield predictions, real-time disease detection, market intelligence, financial planning, and multilingual advisory — all in one unified dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Material UI 7, Recharts, Mapbox GL |
| Backend | Python 3.11, Flask, Gunicorn |
| Database | MongoDB Atlas |
| AI/ML | Google Gemini, Groq (Llama 3.3 70B), scikit-learn, Pillow |
| Auth | JWT + Google OAuth |
| i18n | i18next — English, Hindi, Bengali, Marathi, Tamil, Telugu |
| Hosting | Azure App Service (backend) · Vercel (frontend) |

## Features

- **Dashboard** — live weather, soil health, yield trends, and AI insights
- **Crop Yield Predictor** — ML model trained on Indian agricultural data; Gemini-powered explanations
- **Disease Detector** — upload a leaf photo → AI diagnosis + treatment plan (custom API + Gemini fallback)
- **Market Intelligence** — real-time commodity prices, mandi data, price comparisons, and trend analysis
- **Financial Dashboard** — ROI calculator, production costs, and historical price charts
- **Community Forum** — post, reply, like, and AI-moderated discussions
- **Multilingual Chatbot** — Gemini-backed conversational advisor in 6 Indian languages
- **Smart Advisor** — Groq-powered quick advice on crops, pests, weather, and finances
- **Voice Commands** — speech-to-text input and voice advisory via Groq

## Project Structure

```
├── backend/                  # Flask API server
│   ├── app_integrated.py     # Main application (all routes)
│   ├── auth.py               # JWT + Google OAuth authentication
│   ├── database.py           # MongoDB connection manager
│   ├── weather_service.py    # OpenWeatherMap integration
│   ├── market_data_service.py        # Commodity & mandi data
│   ├── realtime_market_service.py    # Live price feeds
│   ├── financial_analyzer.py         # ROI & cost analysis
│   ├── groq_services.py             # Groq LLM endpoints
│   ├── multilingual_chatbot.py       # Gemini multilingual chat
│   ├── disease_detector.py           # Disease detection helpers
│   ├── colab_style_predictor.py      # Crop yield ML model
│   ├── community_forum.py           # Forum CRUD
│   ├── memory_manager.py            # Lazy model loading & RAM control
│   ├── wsgi.py               # WSGI entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Routes & theme
│   │   ├── config.ts         # API base URL
│   │   ├── i18n.ts           # Translations (6 languages)
│   │   ├── context/AuthContext.tsx
│   │   └── components/       # All UI pages
│   └── package.json
└── models/
    └── disease_hf/           # Hugging Face disease detection microservice
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Create .env from .env.example and fill in API keys
cp .env.example .env
python app_integrated.py          # Runs on http://localhost:5001
```

### Frontend
```bash
cd frontend
npm install
# Set REACT_APP_API_BASE in .env if backend is not on localhost:5001
npm start                         # Runs on http://localhost:3000
```

## Environment Variables

See `backend/.env.example` for the full list. Critical keys:

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Google Gemini API |
| `GROQ_API_KEY` | Groq LLM API |
| `JWT_SECRET_KEY` | Token signing secret |
| `OPENWEATHER_API_KEY` | Weather data |
| `MAPBOX_API_KEY` | Map tiles |

## Deployment

- **Backend → Azure App Service** (Python 3.11, Linux, B1 plan)
- **Frontend → Vercel** (automatic from GitHub)
- See `.deployment` for Azure subdirectory config

## License

MIT
