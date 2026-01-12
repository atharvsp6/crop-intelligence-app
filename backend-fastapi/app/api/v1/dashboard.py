"""
Dashboard API Routes
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.core.logging import get_logger
from app.services import weather_service, market_service, check_all_services
from app.db.repositories import (
    crop_data_repository,
    disease_detection_repository
)
from app.api.v1.auth import get_current_active_user
from app.schemas import DashboardResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
logger = get_logger(__name__)


@router.get("/")
async def get_dashboard(
    city: Optional[str] = Query("Delhi", description="City for weather"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get user dashboard data.
    
    Aggregates:
    - Recent predictions
    - Recent detections
    - Weather data
    - Market highlights
    - Activity statistics
    """
    user_id = current_user.get("id")
    
    # Fetch data in parallel
    predictions = await crop_data_repository.get_user_predictions(user_id, limit=5)
    detections = await disease_detection_repository.get_user_detections(user_id, limit=5)
    weather = await weather_service.get_current_weather(city)
    market_summary = await market_service.get_market_summary()
    
    # Calculate stats
    stats = {
        "total_predictions": len(predictions),
        "total_detections": len(detections),
        "active_crops": len(set(p.get("crop", "") for p in predictions)),
        "weather_alerts": 0  # Would come from weather alerts
    }
    
    return {
        "success": True,
        "user": {
            "name": current_user.get("name"),
            "email": current_user.get("email")
        },
        "stats": stats,
        "recent_predictions": predictions[:5],
        "recent_detections": detections[:5],
        "weather": weather if weather.get("success") else None,
        "market_highlights": market_summary.get("key_commodities", []),
        "market_sentiment": market_summary.get("market_sentiment")
    }


@router.get("/stats")
async def get_user_stats(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get detailed user statistics.
    """
    user_id = current_user.get("id")
    
    predictions = await crop_data_repository.get_user_predictions(user_id, limit=100)
    detections = await disease_detection_repository.get_user_detections(user_id, limit=100)
    
    # Analyze predictions
    crops_analyzed = {}
    for p in predictions:
        crop = p.get("crop", "unknown")
        crops_analyzed[crop] = crops_analyzed.get(crop, 0) + 1
    
    # Analyze detections
    diseases_found = {}
    for d in detections:
        result = d.get("result", {})
        primary = result.get("primary_prediction", {})
        disease = primary.get("disease", "unknown")
        if disease != "Healthy":
            diseases_found[disease] = diseases_found.get(disease, 0) + 1
    
    return {
        "success": True,
        "predictions": {
            "total": len(predictions),
            "by_crop": crops_analyzed
        },
        "detections": {
            "total": len(detections),
            "diseases_found": diseases_found,
            "healthy_count": sum(
                1 for d in detections 
                if d.get("result", {}).get("primary_prediction", {}).get("disease") == "Healthy"
            )
        }
    }


@router.get("/services")
async def get_service_status():
    """
    Get status of all AI services.
    """
    service_status = await check_all_services()
    
    all_healthy = all(service_status.values())
    
    return {
        "overall_status": "healthy" if all_healthy else "degraded",
        "services": {
            name: {"status": "up" if healthy else "down"}
            for name, healthy in service_status.items()
        }
    }


@router.get("/quick-actions")
async def get_quick_actions(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get suggested quick actions for user.
    """
    # Get recent activity
    predictions = await crop_data_repository.get_user_predictions(
        current_user.get("id"), 
        limit=1
    )
    
    actions = []
    
    if not predictions:
        actions.append({
            "action": "first_prediction",
            "title": "Make Your First Prediction",
            "description": "Predict crop yield for your farm",
            "endpoint": "/api/v1/yield/predict"
        })
    
    actions.extend([
        {
            "action": "detect_disease",
            "title": "Check Plant Health",
            "description": "Upload a photo to detect diseases",
            "endpoint": "/api/v1/disease/detect"
        },
        {
            "action": "check_weather",
            "title": "View Weather",
            "description": "Get agricultural weather forecast",
            "endpoint": "/api/v1/weather/agricultural"
        },
        {
            "action": "market_prices",
            "title": "Check Market Prices",
            "description": "View current commodity prices",
            "endpoint": "/api/v1/market/summary"
        }
    ])
    
    return {
        "success": True,
        "actions": actions
    }
