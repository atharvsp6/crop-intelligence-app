"""
Crop Yield Prediction Service - FastAPI Application
High-performance microservice for crop yield prediction
"""
import time
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from config import get_settings, CROP_INFO, INDIAN_STATES
from model import get_model, initialize_model, EnsembleYieldModel
from features import WeatherFeatures, SoilFeatures, CropFeatures, LocationFeatures
from schemas import (
    HealthResponse,
    YieldPredictionRequest,
    YieldPredictionResponse,
    ModelInfoResponse,
    ErrorResponse
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()

# Prometheus metrics
REQUEST_COUNT = Counter(
    "crop_yield_requests_total",
    "Total number of prediction requests",
    ["status"]
)
REQUEST_LATENCY = Histogram(
    "crop_yield_request_latency_seconds",
    "Request latency in seconds"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info("Starting Crop Yield Prediction Service...")
    success = initialize_model()
    if success:
        logger.info("✓ Models loaded successfully")
    else:
        logger.error("✗ Failed to load models")
    yield
    # Shutdown
    logger.info("Shutting down Crop Yield Prediction Service...")


# Create FastAPI app
app = FastAPI(
    title="Crop Yield Prediction Service",
    description="AI-powered crop yield prediction for Indian agriculture",
    version=settings.SERVICE_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency
def get_model_dependency() -> EnsembleYieldModel:
    """Dependency injection for model."""
    model = get_model()
    if not model.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Models not loaded. Service is starting up."
        )
    return model


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    REQUEST_COUNT.labels(status="error").inc()
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error", "detail": str(exc)}
    )


# Routes
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    model = get_model()
    return HealthResponse(
        status="healthy" if model.is_loaded else "degraded",
        service=settings.SERVICE_NAME,
        version=settings.SERVICE_VERSION,
        models_loaded=model.is_loaded,
        timestamp=datetime.utcnow()
    )


@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Readiness check for orchestrators."""
    model = get_model()
    if model.is_loaded:
        return {"ready": True}
    raise HTTPException(status_code=503, detail="Service not ready")


@app.get("/metrics", tags=["Monitoring"])
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


@app.get("/model/info", response_model=ModelInfoResponse, tags=["Model"])
async def model_info(model: EnsembleYieldModel = Depends(get_model_dependency)):
    """Get model information."""
    return model.get_model_info()


@app.get("/crops", tags=["Reference"])
async def get_supported_crops():
    """Get list of supported crops with info."""
    return {
        "total_crops": len(CROP_INFO),
        "crops": CROP_INFO
    }


@app.get("/states", tags=["Reference"])
async def get_supported_states():
    """Get list of Indian states with zones."""
    return {
        "total_states": len(INDIAN_STATES),
        "states": INDIAN_STATES
    }


@app.post("/predict", response_model=YieldPredictionResponse, tags=["Prediction"])
async def predict_yield(
    request: YieldPredictionRequest,
    model: EnsembleYieldModel = Depends(get_model_dependency)
):
    """
    Predict crop yield based on weather, soil, crop, and location factors.
    
    This endpoint provides:
    - Yield prediction in kg/hectare
    - Total production estimate
    - Confidence intervals
    - Factor impact assessment
    - Actionable recommendations
    
    Supports major Indian crops including rice, wheat, cotton, sugarcane, etc.
    """
    start_time = time.time()
    
    try:
        # Convert request to feature objects
        weather = WeatherFeatures(
            avg_temperature=request.weather.avg_temperature,
            min_temperature=request.weather.min_temperature,
            max_temperature=request.weather.max_temperature,
            rainfall=request.weather.rainfall,
            humidity=request.weather.humidity,
            solar_radiation=request.weather.solar_radiation
        )
        
        soil = SoilFeatures(
            soil_type=request.soil.soil_type,
            ph=request.soil.ph,
            nitrogen=request.soil.nitrogen,
            phosphorus=request.soil.phosphorus,
            potassium=request.soil.potassium,
            organic_carbon=request.soil.organic_carbon
        )
        
        crop = CropFeatures(
            crop_name=request.crop.crop_name,
            area=request.crop.area,
            season=request.crop.season.value,
            irrigation_type=request.crop.irrigation_type.value,
            seed_variety=request.crop.seed_variety,
            fertilizer_used=request.crop.fertilizer_used
        )
        
        location = LocationFeatures(
            state=request.location.state,
            district=request.location.district,
            latitude=request.location.latitude,
            longitude=request.location.longitude
        )
        
        # Make prediction
        result = model.predict(weather, soil, crop, location)
        
        # Add processing time
        processing_time = (time.time() - start_time) * 1000
        result["processing_time_ms"] = round(processing_time, 2)
        
        # Update metrics
        if result["success"]:
            REQUEST_COUNT.labels(status="success").inc()
        else:
            REQUEST_COUNT.labels(status="failed").inc()
        
        REQUEST_LATENCY.observe(time.time() - start_time)
        
        return result
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        REQUEST_COUNT.labels(status="error").inc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch", tags=["Prediction"])
async def predict_batch(
    requests: list[YieldPredictionRequest],
    model: EnsembleYieldModel = Depends(get_model_dependency)
):
    """
    Batch yield prediction for multiple scenarios.
    
    Useful for:
    - Comparing different crop options
    - Analyzing multiple plots
    - Seasonal planning
    
    Maximum 20 predictions per batch.
    """
    if len(requests) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 predictions per batch")
    
    results = []
    for idx, req in enumerate(requests):
        try:
            weather = WeatherFeatures(
                avg_temperature=req.weather.avg_temperature,
                min_temperature=req.weather.min_temperature,
                max_temperature=req.weather.max_temperature,
                rainfall=req.weather.rainfall,
                humidity=req.weather.humidity,
                solar_radiation=req.weather.solar_radiation
            )
            
            soil = SoilFeatures(
                soil_type=req.soil.soil_type,
                ph=req.soil.ph,
                nitrogen=req.soil.nitrogen,
                phosphorus=req.soil.phosphorus,
                potassium=req.soil.potassium,
                organic_carbon=req.soil.organic_carbon
            )
            
            crop = CropFeatures(
                crop_name=req.crop.crop_name,
                area=req.crop.area,
                season=req.crop.season.value,
                irrigation_type=req.crop.irrigation_type.value,
                seed_variety=req.crop.seed_variety,
                fertilizer_used=req.crop.fertilizer_used
            )
            
            location = LocationFeatures(
                state=req.location.state,
                district=req.location.district,
                latitude=req.location.latitude,
                longitude=req.location.longitude
            )
            
            result = model.predict(weather, soil, crop, location)
            result["request_index"] = idx
            results.append(result)
        except Exception as e:
            results.append({
                "success": False,
                "request_index": idx,
                "error": str(e)
            })
    
    return {
        "success": True,
        "total_processed": len(results),
        "results": results
    }


@app.post("/compare-crops", tags=["Analysis"])
async def compare_crops(
    crops: list[str],
    weather: dict,
    soil: dict,
    location: dict,
    area: float = 1.0,
    model: EnsembleYieldModel = Depends(get_model_dependency)
):
    """
    Compare yield predictions across different crops.
    
    Useful for crop selection decisions based on current conditions.
    """
    if len(crops) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 crops to compare")
    
    results = []
    for crop_name in crops:
        try:
            weather_obj = WeatherFeatures(**weather)
            soil_obj = SoilFeatures(**soil)
            crop_obj = CropFeatures(
                crop_name=crop_name,
                area=area,
                season="kharif",
                irrigation_type="canal"
            )
            location_obj = LocationFeatures(**location)
            
            result = model.predict(weather_obj, soil_obj, crop_obj, location_obj)
            results.append({
                "crop": crop_name,
                "predicted_yield": result["prediction"]["yield_per_hectare"] if result["success"] else None,
                "success": result["success"]
            })
        except Exception as e:
            results.append({
                "crop": crop_name,
                "predicted_yield": None,
                "success": False,
                "error": str(e)
            })
    
    # Sort by yield
    results.sort(key=lambda x: x.get("predicted_yield") or 0, reverse=True)
    
    return {
        "comparison": results,
        "best_crop": results[0]["crop"] if results else None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=settings.WORKERS
    )
