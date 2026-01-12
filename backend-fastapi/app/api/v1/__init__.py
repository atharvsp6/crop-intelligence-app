"""
API v1 Router
Aggregates all v1 endpoints
"""
from fastapi import APIRouter

from .auth import router as auth_router
from .disease import router as disease_router
from .yield_prediction import router as yield_router
from .weather import router as weather_router
from .market import router as market_router
from .dashboard import router as dashboard_router
from .legacy import router as legacy_router

# Create main v1 router
api_router = APIRouter()

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(disease_router)
api_router.include_router(yield_router)
api_router.include_router(weather_router)
api_router.include_router(market_router)
api_router.include_router(dashboard_router)

# Include legacy routes at root level (not under /api/v1)
