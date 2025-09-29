# YieldWise - Detailed Workflow Diagram Guide

## 🔧 **Step-by-Step Diagram Creation Process**

### **Phase 1: Setup Your Diagramming Environment**

#### **Option A: Using Draw.io (Recommended for beginners)**
1. Go to https://app.diagrams.net/
2. Choose "Create New Diagram"
3. Select "Flowchart" template
4. Import the shape libraries: "Network", "AWS", "GCP", "Azure"

#### **Option B: Using Mermaid (Code-based)**
1. Use GitHub's built-in Mermaid support
2. Or use Mermaid Live Editor: https://mermaid.live/
3. Copy the Mermaid code from `mermaid-diagrams.md`

#### **Option C: Using Lucidchart (Professional)**
1. Sign up at https://lucidchart.com
2. Use "Software Architecture" template
3. Import custom icons for React, Flask, MongoDB

### **Phase 2: Create the Main Workflow Layers**

#### **Layer 1: User Interface (Blue Theme)**
```
Components to include:
- User Browser/Device
- React Frontend (Port 3000)
- Individual Components:
  * CropPredictor.tsx
  * FinancialDashboard.tsx
  * DiseaseDetector.tsx
  * Chatbot.tsx
- State Management (React useState/useEffect)
- API Communication (Axios)
```

#### **Layer 2: API Gateway (Green Theme)**
```
Components to include:
- Flask Server (Port 5001)
- Route Handlers:
  * /api/predict-yield
  * /api/financial/roi
  * /api/financial/market-trends
  * /api/mchatbot
  * /api/auth/login
  * /api/disease/detect
- Middleware:
  * CORS handling
  * JWT Authentication
  * Request validation
```

#### **Layer 3: Business Logic (Orange Theme)**
```
Services to include:
- colab_style_predictor.py (ML Model)
- financial_analyzer.py (ROI Calculator)
- realtime_market_service.py (Market Data)
- disease_detector.py (CNN Model)
- chatbot.py (Multilingual Chat)
- auth.py (User Management)
```

#### **Layer 4: AI/ML Systems (Yellow Theme)**
```
AI Components:
- Gemini AI 2.0 Flash
  * Yield Validation
  * Recommendations
  * Multilingual Chat
- Machine Learning Models:
  * RandomForest (Yield Prediction)
  * CNN (Disease Detection)
  * Statistical Fallback
```

#### **Layer 5: Data Layer (Purple Theme)**
```
Data Systems:
- MongoDB Atlas
  * Users Collection
  * Predictions Collection
  * Market Data Cache
- External APIs:
  * data.gov.in Mandi Feed
  * Yahoo Finance
  * Alpha Vantage
  * OpenWeather
```

### **Phase 3: Add Technical Annotations**

#### **Data Flow Annotations**
```
For each connection, add:
- Data format (JSON, FormData, etc.)
- HTTP methods (GET, POST, PUT)
- Response times (<2s, <5s)
- Error handling paths
- Caching strategies
```

#### **Technology Stack Labels**
```
Frontend:
- React 19.1.1
- TypeScript 5.9.2
- Material-UI 7.3.2
- Axios 1.12.2

Backend:
- Python 3.13
- Flask 3.x
- MongoDB 7.x
- scikit-learn 1.x
- TensorFlow 2.x

AI Services:
- Google Generative AI
- Gemini 2.0 Flash Exp
```

#### **Performance Metrics**
```
Add performance indicators:
- API Response: <2s
- ML Prediction: <1s
- Market Data Cache: 30min TTL
- Database Query: <500ms
- Gemini AI Call: <3s
```

### **Phase 4: Create Detailed Sub-workflows**

#### **Prediction Workflow (Most Important)**
```
1. User Input Validation
   └─ Frontend validation (required fields)
   └─ Backend sanitization
   
2. ML Model Processing
   └─ Feature engineering
   └─ Model prediction
   └─ Statistical fallback (if needed)
   
3. Gemini AI Validation
   └─ Parallel prediction request
   └─ Comparison logic (>25% difference)
   └─ Final prediction selection
   
4. Response Formatting
   └─ Add confidence scores
   └─ Include prediction source
   └─ Generate recommendations
   
5. Frontend Display
   └─ Prediction chips (AI Enhanced/Verified)
   └─ Console logging
   └─ No error messages to user
```

#### **Market Data Workflow**
```
1. API Priority Chain
   └─ data.gov.in Mandi (Priority 1)
   └─ Yahoo Finance (Priority 2)
   └─ Alpha Vantage (Priority 3)
   └─ Static fallback (Priority 4)
   
2. Data Processing
   └─ Currency conversion (USD → INR)
   └─ Data normalization
   └─ Cache storage (30min TTL)
   
3. Real-time Updates
   └─ Scheduled refresh
   └─ WebSocket updates (future)
   └─ Frontend state updates
```

### **Phase 5: Add Error Handling & Fallback Paths**

#### **Error Handling Layers**
```
Frontend Errors:
- Network timeouts → Retry mechanism
- API errors → User-friendly messages
- Validation errors → Form highlights

Backend Errors:
- Model failures → Statistical fallback
- API failures → Cached data
- Database errors → In-memory fallback

AI Service Errors:
- Gemini unavailable → ML-only prediction
- Model loading fails → Statistical method
- Timeout → Default recommendations
```

### **Phase 6: Visual Design Recommendations**

#### **Color Scheme**
```
- Primary Blue (#1976d2): Frontend components
- Success Green (#2e7d32): Backend services
- Warning Orange (#f57c00): AI/ML systems
- Secondary Purple (#7b1fa2): Database operations
- Error Red (#c62828): External APIs
- Info Cyan (#0097a7): Caching/Performance
```

#### **Icon Recommendations**
```
- Frontend: React logo, browser icons
- Backend: Python logo, Flask icon
- Database: MongoDB leaf icon
- AI: Brain/robot icons
- APIs: Cloud/network icons
- Security: Shield/lock icons
```

#### **Layout Structure**
```
Top-to-Bottom Flow:
User → Frontend → API → Services → Database/AI → External APIs

Left-to-Right Flow:
Input Processing → Business Logic → Data Storage/Retrieval → Response
```

## 📊 **Final Diagram Checklist**

### **Must Include Technical Details:**
- [ ] All API endpoints with HTTP methods
- [ ] Database collections and schema
- [ ] Caching strategies and TTL
- [ ] Authentication flow (JWT)
- [ ] Error handling paths
- [ ] Performance metrics
- [ ] Technology versions
- [ ] Port numbers and URLs
- [ ] Data formats (JSON, FormData)
- [ ] Security measures

### **Visual Requirements:**
- [ ] Clear layer separation
- [ ] Consistent color coding
- [ ] Readable fonts (12pt minimum)
- [ ] Legend/Key for symbols
- [ ] Directional arrows
- [ ] Proper spacing
- [ ] High-resolution export (PNG/SVG)

### **Documentation Integration:**
- [ ] Link to GitHub repository
- [ ] API documentation references
- [ ] Deployment instructions
- [ ] Environment variables list
- [ ] Database setup guide