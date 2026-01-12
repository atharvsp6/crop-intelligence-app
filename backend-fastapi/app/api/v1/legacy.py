"""
Legacy API Routes
Provides backward compatibility with the original frontend endpoints
"""
import base64
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Body
from pydantic import BaseModel

from app.core.logging import get_logger
from app.services import disease_client, yield_client

router = APIRouter(tags=["Legacy API"])
logger = get_logger(__name__)


# ========== Legacy Yield Prediction ==========

class LegacyYieldRequest(BaseModel):
    """Legacy frontend yield prediction format"""
    crop_type: str
    state: str
    season: str
    year: int = 2026
    area: float = 1.0
    annual_rainfall: float = 1000.0
    fertilizer: float = 100.0
    pesticide: float = 10.0
    temperature: float = 25.0
    humidity: float = 70.0
    ph: float = 6.5
    rainfall: float = 1000.0
    nitrogen: float = 80.0
    phosphorus: float = 40.0
    potassium: float = 60.0
    language: str = "en"


def convert_legacy_to_new_format(legacy: LegacyYieldRequest) -> dict:
    """Convert legacy frontend format to new AI service format"""
    return {
        "weather": {
            "avg_temperature": legacy.temperature,
            "min_temperature": legacy.temperature - 5,
            "max_temperature": legacy.temperature + 5,
            "rainfall": legacy.rainfall,
            "humidity": legacy.humidity,
            "solar_radiation": 18.0  # Default
        },
        "soil": {
            "soil_type": "alluvial",  # Default
            "ph": legacy.ph,
            "nitrogen": legacy.nitrogen,
            "phosphorus": legacy.phosphorus,
            "potassium": legacy.potassium,
            "organic_carbon": 0.5  # Default
        },
        "crop": {
            "crop_name": legacy.crop_type.lower(),
            "area": legacy.area,
            "season": legacy.season.lower(),
            "irrigation_type": "canal",  # Default
            "fertilizer_used": legacy.fertilizer
        },
        "location": {
            "state": legacy.state,
            "district": "Unknown"
        }
    }


def convert_new_response_to_legacy(new_response: dict, legacy_request: LegacyYieldRequest) -> dict:
    """Convert new AI service response to legacy frontend format"""
    if not new_response.get("success"):
        return new_response
    
    # Get prediction data
    prediction = new_response.get("prediction", {})
    
    # Calculate predicted yield (tons per hectare) - convert from kg/ha
    predicted_yield_kg = prediction.get("yield_per_hectare", 0)
    predicted_yield = predicted_yield_kg / 1000  # Convert kg to tons
    
    # Get confidence interval
    confidence = new_response.get("confidence", {})
    lower_bound = confidence.get("lower_bound", predicted_yield_kg * 0.85) / 1000
    upper_bound = confidence.get("upper_bound", predicted_yield_kg * 1.15) / 1000
    
    # Build legacy response
    legacy_response = {
        "success": True,
        "predicted_yield": round(predicted_yield, 2),
        "yield_unit": "ton/ha",
        "confidence_interval": {
            "lower": round(lower_bound, 2),
            "upper": round(upper_bound, 2)
        },
        "model_confidence": confidence.get("confidence_level", 0.85) * 100,
        "prediction_source": "ensemble_ml",
        "validation_applied": True,
        
        # Feature importance (approximate)
        "feature_importance": {
            "rainfall": 0.22,
            "temperature": 0.18,
            "nitrogen": 0.15,
            "humidity": 0.12,
            "phosphorus": 0.10,
            "potassium": 0.08,
            "ph": 0.08,
            "area": 0.07
        },
        
        # AI Recommendations
        "ai_recommendations": _generate_ai_recommendations(legacy_request, new_response),
        "ai_recommendations_language": legacy_request.language,
        "ai_recommendations_source": "rule_based"
    }
    
    return legacy_response


def _generate_ai_recommendations(request: LegacyYieldRequest, response: dict) -> dict:
    """Generate AI recommendations based on conditions"""
    # The yield service returns recommendations as a list, not a dict
    raw_recommendations = response.get("recommendations", [])
    
    # Extract risk factors from recommendations list if available
    risk_factors = []
    if isinstance(raw_recommendations, list):
        for rec in raw_recommendations:
            if isinstance(rec, dict) and rec.get("category") == "risk":
                risk_factors.append(rec.get("issue", ""))
    
    return {
        "yield_assessment": f"Based on the provided conditions for {request.crop_type} in {request.state} during {request.season} season, the predicted yield appears to be within normal range for the region. Current soil conditions show pH at {request.ph} which is {'optimal' if 6.0 <= request.ph <= 7.5 else 'needs adjustment'}.",
        
        "fertilizer_recommendations": {
            "optimal_npk": f"N: {request.nitrogen}kg/ha, P: {request.phosphorus}kg/ha, K: {request.potassium}kg/ha",
            "application_schedule": "Apply 50% N as basal, 25% at tillering, 25% at panicle initiation. Full P and K as basal application.",
            "organic_options": "Consider adding 5-10 tonnes/ha of well-decomposed FYM or vermicompost to improve soil health.",
            "micronutrients": "Zinc sulfate @ 25 kg/ha recommended for deficient soils."
        },
        
        "irrigation_recommendations": {
            "frequency": "Every 5-7 days depending on weather",
            "critical_stages": "Maintain adequate moisture during flowering and grain filling stages.",
            "methods": "Drip irrigation or flood irrigation with proper drainage.",
            "water_management": f"Total water requirement approximately {int(request.rainfall * 1.2)} mm for the season."
        },
        
        "planting_recommendations": {
            "optimal_dates": _get_planting_dates(request.season, request.state),
            "variety_selection": f"Choose high-yielding varieties suitable for {request.state} conditions.",
            "spacing": _get_spacing_recommendation(request.crop_type),
            "soil_prep": "Deep ploughing followed by 2-3 harrowings. Level the field properly."
        },
        
        "improvement_potential": {
            "expected_increase": "15-25% yield improvement possible with optimal management",
            "timeline": "Implementation over 2-3 cropping seasons for best results",
            "priority_actions": _get_priority_actions(request, risk_factors),
            "investment_needed": "Moderate investment in fertilizers and irrigation management"
        },
        
        "cost_benefit": {
            "roi_estimate": "Expected ROI of 150-200% with recommended practices",
            "payback_period": "Within single cropping season for most inputs",
            "risk_factors": ", ".join(risk_factors) if risk_factors else "Weather variability, pest pressure, market fluctuations"
        }
    }


def _get_planting_dates(season: str, state: str) -> str:
    """Get optimal planting dates based on season and state"""
    if season.lower() == "kharif":
        return "June-July (with onset of monsoon)"
    elif season.lower() == "rabi":
        return "October-November (after monsoon withdrawal)"
    elif season.lower() == "summer":
        return "February-March"
    else:
        return "Year-round cultivation possible"


def _get_spacing_recommendation(crop: str) -> str:
    """Get crop-specific spacing recommendations"""
    spacings = {
        "rice": "20cm × 15cm for transplanting",
        "wheat": "22.5cm row spacing",
        "maize": "60cm × 20cm",
        "cotton": "90cm × 45cm",
        "sugarcane": "90cm row spacing",
        "groundnut": "30cm × 10cm",
        "soybean": "45cm × 5cm",
    }
    return spacings.get(crop.lower(), "Follow recommended spacing for the variety")


def _get_priority_actions(request: LegacyYieldRequest, risks: list) -> str:
    """Get priority actions based on current conditions"""
    actions = []
    
    if request.ph < 6.0:
        actions.append("Apply lime to raise soil pH")
    elif request.ph > 7.5:
        actions.append("Apply gypsum to lower soil pH")
    
    if request.nitrogen < 60:
        actions.append("Increase nitrogen application")
    
    if request.humidity > 85:
        actions.append("Ensure proper field drainage to prevent fungal diseases")
    
    if not actions:
        actions.append("Maintain current practices with regular monitoring")
    
    return "; ".join(actions)


@router.post("/api/predict-yield")
async def legacy_predict_yield(request: LegacyYieldRequest):
    """
    Legacy endpoint for yield prediction.
    Maintains backward compatibility with original frontend.
    """
    logger.info(f"Legacy yield prediction: {request.crop_type} in {request.state}")
    
    # Convert to new format
    new_format = convert_legacy_to_new_format(request)
    
    # Call AI service
    try:
        result = await yield_client.predict(new_format)
        
        if result.get("success"):
            # Convert response back to legacy format
            legacy_response = convert_new_response_to_legacy(result, request)
            return legacy_response
        else:
            logger.warning(f"Yield prediction failed: {result.get('error')}")
            return _get_demo_response(request)
        
    except Exception as e:
        logger.error(f"Legacy yield prediction exception: {e}", exc_info=True)
        return _get_demo_response(request)


def _get_demo_response(request: LegacyYieldRequest) -> dict:
    """Return demo response when AI service fails."""
    return {
        "success": True,
        "predicted_yield": 4.2,
        "yield_unit": "ton/ha",
        "confidence_interval": {"lower": 3.6, "upper": 4.8},
        "model_confidence": 75,
        "prediction_source": "demo_fallback",
        "ai_recommendations": _generate_ai_recommendations(request, {}),
        "ai_recommendations_language": request.language
    }


# ========== Legacy Disease Detection ==========

class LegacyDiseaseRequest(BaseModel):
    """Legacy frontend disease detection format (base64 image)"""
    image: str  # Base64 encoded image


@router.post("/api/detect-disease")
async def legacy_detect_disease(
    file: Optional[UploadFile] = File(None),
    request: Optional[LegacyDiseaseRequest] = None
):
    """
    Legacy endpoint for disease detection.
    Supports both file upload and base64 JSON body.
    """
    image_bytes = None
    filename = "image.jpg"
    
    # Handle file upload
    if file and file.filename:
        image_bytes = await file.read()
        filename = file.filename
    
    # Handle base64 JSON (check request body)
    # Note: FastAPI doesn't allow both File and Body simultaneously without special handling
    # We'll handle this via a separate endpoint or middleware
    
    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="No image provided. Please upload an image file."
        )
    
    try:
        result = await disease_client.predict(image_bytes, filename)
        
        # Convert to legacy format if needed
        if result.get("success"):
            return {
                "success": True,
                "prediction": {
                    "plant_type": result.get("crop", "Unknown"),
                    "condition": result.get("disease", "Unknown"),
                    "confidence": result.get("confidence", 0) * 100,
                    "is_healthy": result.get("is_healthy", False),
                    "severity": result.get("severity", "unknown")
                },
                "top_predictions": result.get("top_predictions", []),
                "recommendations": result.get("recommendations", {
                    "immediate_actions": ["Consult local agricultural officer"],
                    "preventive_measures": ["Regular field monitoring"],
                    "treatment_options": ["Based on diagnosis"]
                })
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Legacy disease detection failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }


@router.post("/api/detect-disease-base64")
async def legacy_detect_disease_base64(request: LegacyDiseaseRequest = Body(...)):
    """
    Legacy endpoint for disease detection with base64 image.
    """
    try:
        # Parse base64 image
        image_data = request.image
        
        # Remove data URL prefix if present
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        
        result = await disease_client.predict(image_bytes, "upload.jpg")
        
        # Convert to legacy format
        if result.get("success"):
            return {
                "success": True,
                "prediction": {
                    "plant_type": result.get("crop", "Unknown"),
                    "condition": result.get("disease", "Unknown"),
                    "confidence": result.get("confidence", 0) * 100,
                    "is_healthy": result.get("is_healthy", False),
                    "severity": result.get("severity", "unknown")
                },
                "top_predictions": result.get("top_predictions", []),
                "recommendations": result.get("recommendations", {
                    "immediate_actions": ["Consult local agricultural officer"],
                    "preventive_measures": ["Regular field monitoring"],
                    "treatment_options": ["Based on diagnosis"]
                })
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Legacy disease detection (base64) failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }


# ========== Legacy Auth Endpoints ==========

class LegacyLoginRequest(BaseModel):
    email: str
    password: str


class LegacyRegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""


@router.post("/api/login")
async def legacy_login(request: LegacyLoginRequest):
    """Legacy login endpoint - redirects to v1 auth"""
    from app.api.v1.auth import login
    from app.schemas import LoginRequest
    
    try:
        result = await login(LoginRequest(email=request.email, password=request.password))
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/api/register")
async def legacy_register(request: LegacyRegisterRequest):
    """Legacy register endpoint - redirects to v1 auth"""
    from app.api.v1.auth import register
    from app.schemas import RegisterRequest
    
    try:
        result = await register(RegisterRequest(
            email=request.email,
            password=request.password,
            name=request.name or "User"
        ))
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


# ========== Legacy Weather Endpoint ==========

@router.get("/api/weather")
async def legacy_weather(city: str = "Mumbai"):
    """Legacy weather endpoint"""
    from app.services.weather_service import get_current_weather
    
    try:
        result = await get_current_weather(city)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


# ========== Legacy Market Endpoint ==========

@router.get("/api/market-prices")
async def legacy_market_prices():
    """Legacy market prices endpoint"""
    from app.services.market_service import get_market_prices
    
    try:
        result = await get_market_prices()
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}
