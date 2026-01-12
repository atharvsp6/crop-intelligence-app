"""
Crop Yield Prediction API Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional

from app.core.logging import get_logger
from app.services import yield_client
from app.db.repositories import crop_data_repository
from app.api.v1.auth import get_current_active_user, get_current_user
from app.schemas import (
    YieldPredictionRequest,
    YieldPredictionResponse
)

router = APIRouter(prefix="/yield", tags=["Crop Yield Prediction"])
logger = get_logger(__name__)


@router.get("/health")
async def check_service_health():
    """Check yield prediction service health."""
    is_healthy = await yield_client.is_healthy()
    return {
        "service": "crop-yield-prediction",
        "healthy": is_healthy,
        "status": "up" if is_healthy else "down"
    }


@router.get("/model/info")
async def get_model_info():
    """Get yield prediction model information."""
    return await yield_client.get_model_info()


@router.get("/crops")
async def get_supported_crops():
    """Get list of supported crops for yield prediction."""
    return await yield_client.get_supported_crops()


@router.post("/predict", response_model=YieldPredictionResponse)
async def predict_yield(
    request: YieldPredictionRequest,
    save_result: bool = True,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Predict crop yield based on conditions.
    
    Provide weather, soil, crop, and location data to get:
    - Predicted yield (kg/hectare)
    - Total production estimate
    - Confidence intervals
    - Impact assessment of various factors
    - Actionable recommendations
    
    Supports major Indian crops including rice, wheat, cotton, sugarcane, etc.
    """
    # Convert request to dict for AI service
    prediction_data = {
        "weather": request.weather.model_dump(),
        "soil": request.soil.model_dump(),
        "crop": {
            **request.crop.model_dump(),
            "season": request.crop.season,
            "irrigation_type": request.crop.irrigation_type
        },
        "location": request.location.model_dump()
    }
    
    # Call AI service
    result = await yield_client.predict(prediction_data)
    
    # Save result if user is authenticated
    if save_result and current_user and result.get("success"):
        try:
            await crop_data_repository.save_prediction(
                user_id=current_user.get("id"),
                crop=request.crop.crop_name,
                prediction_result=result
            )
        except Exception as e:
            logger.warning(f"Failed to save prediction: {e}")
    
    return result


@router.post("/predict/anonymous", response_model=YieldPredictionResponse)
async def predict_yield_anonymous(request: YieldPredictionRequest):
    """
    Predict crop yield without authentication.
    
    Same as /predict but doesn't save results.
    """
    prediction_data = {
        "weather": request.weather.model_dump(),
        "soil": request.soil.model_dump(),
        "crop": {
            **request.crop.model_dump(),
            "season": request.crop.season,
            "irrigation_type": request.crop.irrigation_type
        },
        "location": request.location.model_dump()
    }
    
    return await yield_client.predict(prediction_data)


@router.post("/compare")
async def compare_crops(
    crops: List[str],
    weather: dict,
    soil: dict,
    location: dict,
    area: float = 1.0
):
    """
    Compare yield predictions across different crops.
    
    Useful for deciding which crop to plant based on current conditions.
    
    Provide conditions and a list of crops to compare.
    Returns ranked predictions for each crop.
    """
    if len(crops) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 crops to compare")
    
    if len(crops) < 2:
        raise HTTPException(status_code=400, detail="At least 2 crops required for comparison")
    
    return await yield_client.compare_crops(crops, weather, soil, location, area)


@router.get("/history")
async def get_prediction_history(
    limit: int = 10,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get user's prediction history.
    
    Returns the most recent yield predictions.
    """
    predictions = await crop_data_repository.get_user_predictions(
        user_id=current_user.get("id"),
        limit=limit
    )
    
    return {
        "success": True,
        "count": len(predictions),
        "predictions": predictions
    }


@router.post("/batch")
async def batch_predict(
    requests: List[YieldPredictionRequest],
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Batch prediction for multiple scenarios.
    
    Useful for:
    - Comparing different conditions
    - Planning across multiple plots
    - Seasonal analysis
    
    Maximum 20 predictions per batch.
    """
    if len(requests) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 predictions per batch")
    
    results = []
    for idx, req in enumerate(requests):
        prediction_data = {
            "weather": req.weather.model_dump(),
            "soil": req.soil.model_dump(),
            "crop": {
                **req.crop.model_dump(),
                "season": req.crop.season,
                "irrigation_type": req.crop.irrigation_type
            },
            "location": req.location.model_dump()
        }
        
        result = await yield_client.predict(prediction_data)
        result["request_index"] = idx
        results.append(result)
    
    return {
        "success": True,
        "total": len(results),
        "results": results
    }
