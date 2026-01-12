"""
Disease Detection API Routes
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from typing import Optional

from app.core.logging import get_logger
from app.services import disease_client
from app.db.repositories import disease_detection_repository
from app.api.v1.auth import get_current_active_user, get_current_user
from app.schemas import DiseaseDetectionResponse

router = APIRouter(prefix="/disease", tags=["Disease Detection"])
logger = get_logger(__name__)


@router.get("/health")
async def check_service_health():
    """Check disease detection service health."""
    is_healthy = await disease_client.is_healthy()
    return {
        "service": "disease-detection",
        "healthy": is_healthy,
        "status": "up" if is_healthy else "down"
    }


@router.get("/model/info")
async def get_model_info():
    """Get disease detection model information."""
    return await disease_client.get_model_info()


@router.get("/classes")
async def get_disease_classes():
    """Get all disease classes the model can detect."""
    return await disease_client.get_classes()


@router.post("/detect", response_model=DiseaseDetectionResponse)
async def detect_disease(
    file: UploadFile = File(..., description="Plant leaf image"),
    save_result: bool = True,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Detect plant disease from an uploaded image.
    
    Upload an image of a plant leaf to identify diseases.
    
    Returns:
    - Crop type identification
    - Disease classification
    - Severity level
    - Treatment recommendations
    - Confidence scores
    
    Supported image formats: JPEG, PNG, WebP
    """
    # Validate file
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file (JPEG, PNG, WebP)"
        )
    
    # Read image
    image_bytes = await file.read()
    
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")
    
    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB allowed.")
    
    # Call AI service
    result = await disease_client.predict(image_bytes, file.filename or "image.jpg")
    
    # Save result if user is authenticated
    if save_result and current_user and result.get("success"):
        try:
            await disease_detection_repository.save_detection(
                user_id=current_user.get("id"),
                image_url=None,  # We don't store images in free tier
                detection_result=result
            )
        except Exception as e:
            logger.warning(f"Failed to save detection result: {e}")
    
    return result


@router.post("/detect/anonymous", response_model=DiseaseDetectionResponse)
async def detect_disease_anonymous(
    file: UploadFile = File(..., description="Plant leaf image")
):
    """
    Detect plant disease without authentication.
    
    Same as /detect but doesn't save results.
    Useful for quick checks.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file"
        )
    
    image_bytes = await file.read()
    
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    
    return await disease_client.predict(image_bytes, file.filename or "image.jpg")


@router.get("/history")
async def get_detection_history(
    limit: int = 10,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get user's disease detection history.
    
    Returns the most recent disease detection results.
    """
    detections = await disease_detection_repository.get_user_detections(
        user_id=current_user.get("id"),
        limit=limit
    )
    
    return {
        "success": True,
        "count": len(detections),
        "detections": detections
    }
