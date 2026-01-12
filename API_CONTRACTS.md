# API Contracts

This document defines the API contracts between the main backend and AI microservices.

## Disease Detection Service

### Base URL
`http://localhost:8001` (local) or configured via `DISEASE_SERVICE_URL`

### Endpoints

#### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "disease-detection-service",
  "version": "1.0.0",
  "model_loaded": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Predict Disease
```
POST /predict
Content-Type: multipart/form-data
```

**Request:**
- `file`: Image file (JPEG, PNG, WebP)

**Response:**
```json
{
  "success": true,
  "primary_prediction": {
    "class_id": 13,
    "crop": "Tomato",
    "disease": "Late Blight",
    "severity": "high",
    "confidence": 0.95,
    "confidence_percent": "95.00%"
  },
  "all_predictions": [
    {
      "class_id": 13,
      "crop": "Tomato",
      "disease": "Late Blight",
      "severity": "high",
      "confidence": 0.95,
      "confidence_percent": "95.00%"
    },
    {
      "class_id": 12,
      "crop": "Tomato",
      "disease": "Early Blight",
      "severity": "medium",
      "confidence": 0.03,
      "confidence_percent": "3.00%"
    }
  ],
  "treatment": {
    "organic": ["Copper spray", "Bordeaux mixture"],
    "chemical": ["Metalaxyl", "Chlorothalonil"],
    "prevention": ["Avoid wet conditions", "Remove infected plants"]
  },
  "model_info": {
    "model_name": "efficientnet_b0",
    "confidence_threshold": 0.3,
    "is_above_threshold": true
  },
  "processing_time_ms": 125.5
}
```

#### Get Model Info
```
GET /model/info
```

**Response:**
```json
{
  "model_name": "efficientnet_b0",
  "num_classes": 40,
  "input_size": 224,
  "device": "cpu",
  "is_loaded": true,
  "supported_crops": ["Rice", "Wheat", "Cotton", "Tomato", ...]
}
```

#### Get Disease Classes
```
GET /model/classes
```

**Response:**
```json
{
  "total_classes": 40,
  "classes": {
    "0": {"crop": "Rice", "disease": "Bacterial Leaf Blight", "severity": "high"},
    "1": {"crop": "Rice", "disease": "Brown Spot", "severity": "medium"},
    ...
  }
}
```

---

## Crop Yield Prediction Service

### Base URL
`http://localhost:8002` (local) or configured via `YIELD_SERVICE_URL`

### Endpoints

#### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "crop-yield-service",
  "version": "1.0.0",
  "models_loaded": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Predict Yield
```
POST /predict
Content-Type: application/json
```

**Request:**
```json
{
  "weather": {
    "avg_temperature": 28.5,
    "min_temperature": 22.0,
    "max_temperature": 35.0,
    "rainfall": 850.0,
    "humidity": 72.0,
    "solar_radiation": 18.5
  },
  "soil": {
    "soil_type": "alluvial",
    "ph": 6.8,
    "nitrogen": 120,
    "phosphorus": 45,
    "potassium": 180,
    "organic_carbon": 0.75
  },
  "crop": {
    "crop_name": "rice",
    "area": 2.5,
    "season": "kharif",
    "irrigation_type": "canal",
    "seed_variety": "IR-64",
    "fertilizer_used": 150
  },
  "location": {
    "state": "Punjab",
    "district": "Ludhiana",
    "latitude": 30.9,
    "longitude": 75.85
  }
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "yield_per_hectare": 4250.75,
    "yield_unit": "kg/ha",
    "total_production": 10626.88,
    "production_unit": "kg",
    "area": 2.5,
    "area_unit": "hectares"
  },
  "confidence": {
    "lower_bound": 3850.50,
    "upper_bound": 4650.25,
    "confidence_level": 0.95
  },
  "model_predictions": {
    "xgboost": 4300.00,
    "lightgbm": 4180.25,
    "catboost": 4275.50
  },
  "crop_info": {
    "crop": "rice",
    "category": "cereal",
    "typical_yield_range": [2000, 6000],
    "season": "kharif",
    "irrigation": "canal"
  },
  "factors": {
    "weather_impact": {
      "temperature": {
        "value": 28.5,
        "optimal_range": [20, 35],
        "is_optimal": true,
        "score": 0.85
      },
      "rainfall": {
        "value": 850.0,
        "optimal_range": [1200, 1500],
        "is_optimal": false,
        "score": 0.65
      },
      "overall_score": 0.75
    },
    "soil_impact": {
      "ph": {"value": 6.8, "optimal_range": [6.0, 7.5], "score": 0.95},
      "nutrients": {"nitrogen": 120, "phosphorus": 45, "potassium": 180, "score": 0.80},
      "overall_score": 0.87
    },
    "irrigation_impact": {
      "type": "canal",
      "efficiency": 0.5,
      "adequacy": "adequate",
      "water_requirement": "high"
    }
  },
  "recommendations": [
    {
      "category": "irrigation",
      "priority": "medium",
      "issue": "Rainfall below optimal",
      "suggestion": "Consider supplemental irrigation"
    }
  ],
  "warnings": null,
  "processing_time_ms": 45.2
}
```

#### Get Supported Crops
```
GET /crops
```

**Response:**
```json
{
  "total_crops": 12,
  "crops": {
    "rice": {
      "category": "cereal",
      "typical_yield_range": [2000, 6000],
      "optimal_rainfall": [1200, 1500],
      "optimal_temp": [20, 35],
      "growing_season": "kharif",
      "water_requirement": "high"
    },
    ...
  }
}
```

#### Compare Crops
```
POST /compare-crops?area=1.0
Content-Type: application/json
```

**Request:**
```json
{
  "crops": ["rice", "wheat", "maize"],
  "weather": { ... },
  "soil": { ... },
  "location": { ... }
}
```

**Response:**
```json
{
  "comparison": [
    {"crop": "rice", "predicted_yield": 4250.75, "success": true},
    {"crop": "wheat", "predicted_yield": 3800.50, "success": true},
    {"crop": "maize", "predicted_yield": 3500.25, "success": true}
  ],
  "best_crop": "rice"
}
```

---

## Error Responses

All services return errors in this format:

```json
{
  "success": false,
  "error": "Error message",
  "detail": "Detailed error description"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Data Types

### Weather Input
| Field | Type | Required | Range | Description |
|-------|------|----------|-------|-------------|
| avg_temperature | float | Yes | -10 to 50 | Average temperature (°C) |
| min_temperature | float | Yes | -20 to 45 | Minimum temperature (°C) |
| max_temperature | float | Yes | -5 to 55 | Maximum temperature (°C) |
| rainfall | float | Yes | 0 to 5000 | Total rainfall (mm) |
| humidity | float | Yes | 0 to 100 | Average humidity (%) |
| solar_radiation | float | No | 0 to 40 | Solar radiation (MJ/m²/day) |

### Soil Input
| Field | Type | Required | Range | Description |
|-------|------|----------|-------|-------------|
| soil_type | string | Yes | - | alluvial, black, red, laterite, desert, mountain, saline |
| ph | float | Yes | 3 to 10 | Soil pH level |
| nitrogen | float | Yes | 0 to 500 | Nitrogen (kg/ha) |
| phosphorus | float | Yes | 0 to 200 | Phosphorus (kg/ha) |
| potassium | float | Yes | 0 to 500 | Potassium (kg/ha) |
| organic_carbon | float | No | 0 to 5 | Organic carbon (%) |

### Crop Input
| Field | Type | Required | Values | Description |
|-------|------|----------|--------|-------------|
| crop_name | string | Yes | - | Crop name |
| area | float | Yes | 0 to 10000 | Area in hectares |
| season | enum | Yes | kharif, rabi, zaid, annual | Growing season |
| irrigation_type | enum | Yes | rainfed, canal, tubewell, drip, sprinkler, flood | Irrigation type |
| seed_variety | string | No | - | Seed variety name |
| fertilizer_used | float | No | 0 to 1000 | Fertilizer (kg/ha) |

### Location Input
| Field | Type | Required | Range | Description |
|-------|------|----------|-------|-------------|
| state | string | Yes | - | Indian state name |
| district | string | No | - | District name |
| latitude | float | No | 6 to 38 | Latitude |
| longitude | float | No | 68 to 98 | Longitude |
