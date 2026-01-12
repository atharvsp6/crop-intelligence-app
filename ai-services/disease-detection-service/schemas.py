"""
Pydantic schemas for Disease Detection API
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., example="healthy")
    service: str = Field(..., example="disease-detection-service")
    version: str = Field(..., example="1.0.0")
    model_loaded: bool = Field(..., example=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class TreatmentInfo(BaseModel):
    """Treatment recommendation info."""
    organic: List[str] = Field(..., description="Organic treatment methods")
    chemical: List[str] = Field(..., description="Chemical treatment methods")
    prevention: List[str] = Field(..., description="Prevention measures")


class PredictionItem(BaseModel):
    """Single prediction result."""
    class_id: int = Field(..., description="Class index")
    crop: str = Field(..., example="Tomato", description="Detected crop type")
    disease: str = Field(..., example="Late Blight", description="Detected disease")
    severity: str = Field(..., example="high", description="Disease severity")
    confidence: float = Field(..., ge=0, le=1, example=0.95)
    confidence_percent: str = Field(..., example="95.00%")


class ModelInfo(BaseModel):
    """Model metadata."""
    model_name: str = Field(..., example="efficientnet_b0")
    confidence_threshold: float = Field(..., example=0.3)
    is_above_threshold: bool = Field(..., example=True)


class PredictionResponse(BaseModel):
    """Disease prediction response."""
    success: bool = Field(..., description="Whether prediction succeeded")
    primary_prediction: Optional[PredictionItem] = Field(None, description="Top prediction")
    all_predictions: List[PredictionItem] = Field(default_factory=list)
    treatment: Optional[TreatmentInfo] = Field(None, description="Treatment recommendations")
    model_info: Optional[ModelInfo] = None
    error: Optional[str] = Field(None, description="Error message if failed")
    processing_time_ms: Optional[float] = Field(None, description="Inference time in ms")


class ModelInfoResponse(BaseModel):
    """Model information response."""
    model_name: str
    num_classes: int
    input_size: int
    device: str
    is_loaded: bool
    supported_crops: List[str]


class ErrorResponse(BaseModel):
    """Error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None
