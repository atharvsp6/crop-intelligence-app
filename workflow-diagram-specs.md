# YieldWise - Workflow Diagram Specifications

## 🏗️ **System Architecture Components**

### **Frontend (React/TypeScript)**
- **Technologies**: React 19, TypeScript, Material-UI, Axios
- **Components**:
  - CropPredictor.tsx (Main prediction interface)
  - FinancialDashboard.tsx (ROI calculator, market trends)
  - Dashboard.tsx (User overview)
  - Header.tsx & Sidebar.tsx (Navigation)
  - CommunityForum.tsx (User interactions)
  - DiseaseDetector.tsx (Plant disease analysis)
  - Chatbot.tsx (Multilingual AI assistant)

### **Backend (Python/Flask)**
- **Main Server**: app_integrated.py (Flask API server)
- **Core Services**:
  - Authentication (JWT-based, bcrypt)
  - User Management (MongoDB integration)
  - Prediction Engine (ML + AI validation)

### **AI/ML Systems**
1. **Machine Learning Model**:
   - File: colab_style_predictor.py
   - Technology: scikit-learn, RandomForestRegressor
   - Fallback: Statistical prediction system

2. **Gemini AI Integration**:
   - Primary: Yield prediction validation
   - Secondary: Multilingual chatbot
   - Tertiary: Recommendation system

3. **Disease Detection**:
   - Technology: TensorFlow/Keras
   - Model: CNN for plant disease classification

### **Data Services**
1. **Real-time Market Data**:
   - File: realtime_market_service.py
   - APIs: Yahoo Finance, Alpha Vantage, Mandi Feed, Commodities API
   - Priority: Mandi API → Yahoo Finance → Fallbacks

2. **Financial Analysis**:
   - File: financial_analyzer.py
   - Features: ROI calculation, cost analysis, profit projections
   - Currency: INR (Indian Rupees)

3. **Database**:
   - Technology: MongoDB Atlas
   - Collections: Users, Predictions, Market Data, Cache

### **External APIs & Integrations**
- **Gemini AI**: google-generativeai (gemini-2.0-flash-exp)
- **Market Data**: Multiple financial data providers
- **Weather Data**: OpenWeather API
- **Government Data**: data.gov.in Mandi Feed API

## 🔄 **User Journey Workflows**

### **1. User Authentication Flow**
```
User Registration/Login → JWT Token Generation → Session Management → Protected Routes
```

### **2. Crop Yield Prediction Flow**
```
User Input → Data Validation → ML Model Prediction → Gemini AI Validation → 
Result Comparison → Final Prediction Display → AI Recommendations
```

### **3. Financial Analysis Flow**
```
Crop Data → Market Data Retrieval → ROI Calculation → Cost Analysis → 
Profit Projections → Currency Conversion (USD→INR) → Display Results
```

### **4. Disease Detection Flow**
```
Image Upload → Image Processing → CNN Model Analysis → Disease Identification → 
Treatment Recommendations → Result Display
```

## 🔧 **Technical Data Flow**

### **Prediction System Architecture**
```
Frontend Form → API Request → Backend Validation → ML Model Processing → 
Gemini AI Cross-validation → Statistical Fallback (if needed) → 
Response Formatting → Frontend Display
```

### **Market Data Pipeline**
```
Scheduled Tasks → API Calls (Priority Order) → Data Processing → 
MongoDB Caching → Real-time Updates → Frontend Display
```

### **Multi-language Support**
```
User Language Selection → Content Translation → AI Response Generation → 
Language-specific Formatting → Localized Display
```

## 📊 **Key Technical Specifications**

### **Performance Metrics**
- API Response Time: < 2 seconds
- Model Prediction Accuracy: 90%+ (ML + Gemini validation)
- Market Data Refresh: Every 30 minutes
- Concurrent Users: Scalable with MongoDB Atlas

### **Security Features**
- JWT Authentication
- Password Hashing (bcrypt)
- API Rate Limiting
- Input Validation & Sanitization
- CORS Protection

### **Fallback Systems**
- Statistical Prediction (when ML fails)
- Mock Market Data (when APIs fail)
- Basic Disease Detection (when CNN fails)
- Error Handling at every layer

## 🎨 **Diagram Structure Recommendations**

### **Main Workflow Layers**
1. **User Interface Layer** (Frontend Components)
2. **API Gateway Layer** (Flask Routes)
3. **Business Logic Layer** (Services & Models)
4. **Data Layer** (Database & External APIs)
5. **AI/ML Layer** (Models & Validation)

### **Color Coding Suggestions**
- 🔵 **Blue**: Frontend/UI components
- 🟢 **Green**: Backend services
- 🟡 **Yellow**: AI/ML components
- 🔴 **Red**: External APIs
- 🟣 **Purple**: Database operations
- 🟠 **Orange**: Authentication/Security

### **Technical Detail Annotations**
- Include API endpoints (/api/predict-yield, /api/financial/roi)
- Show data formats (JSON, MongoDB documents)
- Indicate response times and caching
- Mark fallback paths and error handling
- Display technology stacks for each component