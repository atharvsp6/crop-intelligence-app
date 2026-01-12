"""
Disease Detection Service - FastAPI Application
High-performance microservice for plant disease detection
"""
import time
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from config import get_settings, DISEASE_CLASSES
from model import get_model, initialize_model, DiseaseDetectionModel
from schemas import (
    HealthResponse, 
    PredictionResponse, 
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
    "disease_detection_requests_total",
    "Total number of prediction requests",
    ["status"]
)
REQUEST_LATENCY = Histogram(
    "disease_detection_request_latency_seconds",
    "Request latency in seconds"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - startup and shutdown."""
    # Startup
    logger.info("Starting Disease Detection Service...")
    success = initialize_model()
    if success:
        logger.info("✓ Model loaded successfully")
    else:
        logger.error("✗ Failed to load model")
    yield
    # Shutdown
    logger.info("Shutting down Disease Detection Service...")


# Create FastAPI app
app = FastAPI(
    title="Disease Detection Service",
    description="AI-powered plant disease detection for Indian crops",
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


# Dependency to get model
def get_model_dependency() -> DiseaseDetectionModel:
    """Dependency injection for model."""
    model = get_model()
    if not model.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Service is starting up."
        )
    return model


# Error handlers
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
        model_loaded=model.is_loaded,
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
async def model_info(model: DiseaseDetectionModel = Depends(get_model_dependency)):
    """Get model information."""
    return model.get_model_info()


@app.get("/model/classes", tags=["Model"])
async def get_classes():
    """Get all disease classes."""
    return {
        "total_classes": len(DISEASE_CLASSES),
        "classes": DISEASE_CLASSES
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(
    file: UploadFile = File(..., description="Image file to analyze"),
    model: DiseaseDetectionModel = Depends(get_model_dependency)
):
    """
    Detect plant diseases from an image.
    
    Upload an image of a plant leaf to get disease predictions with:
    - Crop type identification
    - Disease classification
    - Severity assessment
    - Treatment recommendations
    - Confidence scores
    
    Supported formats: JPEG, PNG, WebP
    Recommended size: 224x224 or larger
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        REQUEST_COUNT.labels(status="invalid").inc()
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an image (JPEG, PNG, WebP)."
        )
    
    start_time = time.time()
    
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        if len(image_bytes) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="File too large. Max 10MB.")
        
        # Run prediction
        result = model.predict(image_bytes)
        
        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000
        result["processing_time_ms"] = round(processing_time, 2)
        
        # Update metrics
        if result["success"]:
            REQUEST_COUNT.labels(status="success").inc()
        else:
            REQUEST_COUNT.labels(status="failed").inc()
        
        REQUEST_LATENCY.observe(time.time() - start_time)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        REQUEST_COUNT.labels(status="error").inc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch", tags=["Prediction"])
async def predict_batch(
    files: list[UploadFile] = File(..., description="Multiple images to analyze"),
    model: DiseaseDetectionModel = Depends(get_model_dependency)
):
    """
    Batch prediction for multiple images.
    
    Upload up to 10 images for batch processing.
    """
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images per batch")
    
    results = []
    for idx, file in enumerate(files):
        try:
            image_bytes = await file.read()
            result = model.predict(image_bytes)
            result["file_index"] = idx
            result["filename"] = file.filename
            results.append(result)
        except Exception as e:
            results.append({
                "success": False,
                "file_index": idx,
                "filename": file.filename,
                "error": str(e)
            })
    
    return {
        "success": True,
        "total_processed": len(results),
        "results": results
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
