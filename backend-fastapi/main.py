"""
Crop Intelligence API - Main Application
Production-grade FastAPI backend
"""
from contextlib import asynccontextmanager
from datetime import datetime
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.logging import setup_logging, get_logger
from app.db import initialize_firebase
from app.api.v1 import api_router
from app.api.v1.legacy import router as legacy_router
from app.services import disease_client, yield_client

settings = get_settings()

# Setup logging
setup_logging()
logger = get_logger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Prometheus metrics
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"]
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events."""
    # Startup
    logger.info("=" * 50)
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info("=" * 50)
    
    # Initialize Firebase
    firebase_ok = initialize_firebase()
    if firebase_ok:
        logger.info("✓ Firebase initialized")
    else:
        logger.warning("⚠ Firebase initialization skipped (mock mode)")
    
    # Check AI services
    disease_ok = await disease_client.is_healthy()
    yield_ok = await yield_client.is_healthy()
    
    logger.info(f"✓ Disease Detection Service: {'UP' if disease_ok else 'DOWN'}")
    logger.info(f"✓ Yield Prediction Service: {'UP' if yield_ok else 'DOWN'}")
    
    logger.info("=" * 50)
    logger.info("Application startup complete")
    logger.info("=" * 50)
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    await disease_client.close()
    await yield_client.close()
    logger.info("Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    ## Crop Intelligence API
    
    AI-powered agricultural intelligence platform for Indian farmers.
    
    ### Features
    
    * **Disease Detection**: Upload plant images to detect diseases
    * **Yield Prediction**: Predict crop yields based on conditions
    * **Weather Data**: Agricultural weather forecasts
    * **Market Prices**: Real-time mandi prices
    * **Dashboard**: Personalized insights
    
    ### Authentication
    
    Most endpoints require JWT authentication. Get your token at `/api/v1/auth/login`.
    
    ### Free Tier Optimized
    
    This API is designed to run entirely on free-tier cloud services.
    """,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests and measure latency."""
    start_time = time.time()
    
    # Generate request ID
    request_id = f"{int(time.time() * 1000)}"
    
    # Process request
    response = await call_next(request)
    
    # Calculate latency
    latency = time.time() - start_time
    
    # Log request
    logger.info(
        f"{request.method} {request.url.path}",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "latency_ms": round(latency * 1000, 2)
        }
    )
    
    # Update metrics
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    REQUEST_LATENCY.observe(latency)
    
    # Add headers
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time"] = f"{round(latency * 1000, 2)}ms"
    
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else None
        }
    )


# Root endpoints
@app.get("/", tags=["Root"])
async def root():
    """API root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.ENVIRONMENT
    }


@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Readiness check for orchestrators."""
    # Check AI services
    disease_ok = await disease_client.is_healthy()
    yield_ok = await yield_client.is_healthy()
    
    services = {
        "disease_detection": "up" if disease_ok else "down",
        "yield_prediction": "up" if yield_ok else "down"
    }
    
    # Consider ready if at least one AI service is up
    is_ready = disease_ok or yield_ok
    
    if is_ready:
        return {
            "ready": True,
            "services": services
        }
    else:
        return JSONResponse(
            status_code=503,
            content={
                "ready": False,
                "services": services
            }
        )


@app.get("/metrics", tags=["Monitoring"])
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


# Include API routers
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
app.include_router(legacy_router)  # Legacy routes at root level for frontend compatibility


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=settings.WORKERS
    )
