"""
Pydantic schemas for Crop Yield Service API
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class IrrigationType(str, Enum):
    """Irrigation type options."""
    RAINFED = "rainfed"
    CANAL = "canal"
    TUBEWELL = "tubewell"
    DRIP = "drip"
    SPRINKLER = "sprinkler"
    FLOOD = "flood"


class Season(str, Enum):
    """Crop season options."""
    KHARIF = "kharif"
    RABI = "rabi"
    ZAID = "zaid"
    ANNUAL = "annual"


class WeatherInput(BaseModel):
    """Weather input data."""
    avg_temperature: float = Field(..., ge=-10, le=50, description="Average temperature in Celsius")
    min_temperature: float = Field(..., ge=-20, le=45, description="Minimum temperature in Celsius")
    max_temperature: float = Field(..., ge=-5, le=55, description="Maximum temperature in Celsius")
    rainfall: float = Field(..., ge=0, le=5000, description="Total rainfall in mm")
    humidity: float = Field(..., ge=0, le=100, description="Average humidity percentage")
    solar_radiation: Optional[float] = Field(None, ge=0, le=40, description="Solar radiation MJ/m²/day")
    
    @field_validator('max_temperature')
    @classmethod
    def max_temp_greater_than_min(cls, v, info):
        if 'min_temperature' in info.data and v < info.data['min_temperature']:
            raise ValueError('max_temperature must be >= min_temperature')
        return v


class SoilInput(BaseModel):
    """Soil input data."""
    soil_type: str = Field(..., description="Type of soil (alluvial, black, red, etc.)")
    ph: float = Field(..., ge=3, le=10, description="Soil pH level")
    nitrogen: float = Field(..., ge=0, le=500, description="Nitrogen content kg/ha")
    phosphorus: float = Field(..., ge=0, le=200, description="Phosphorus content kg/ha")
    potassium: float = Field(..., ge=0, le=500, description="Potassium content kg/ha")
    organic_carbon: Optional[float] = Field(None, ge=0, le=5, description="Organic carbon percentage")


class CropInput(BaseModel):
    """Crop input data."""
    crop_name: str = Field(..., description="Name of the crop")
    area: float = Field(..., gt=0, le=10000, description="Area in hectares")
    season: Season = Field(..., description="Growing season")
    irrigation_type: IrrigationType = Field(..., description="Type of irrigation")
    seed_variety: Optional[str] = Field(None, description="Seed variety name")
    fertilizer_used: Optional[float] = Field(None, ge=0, le=1000, description="Fertilizer used kg/ha")


class LocationInput(BaseModel):
    """Location input data."""
    state: str = Field(..., description="Indian state name")
    district: Optional[str] = Field(None, description="District name")
    latitude: Optional[float] = Field(None, ge=6, le=38, description="Latitude")
    longitude: Optional[float] = Field(None, ge=68, le=98, description="Longitude")


class YieldPredictionRequest(BaseModel):
    """Complete yield prediction request."""
    weather: WeatherInput
    soil: SoilInput
    crop: CropInput
    location: LocationInput
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "weather": {
                    "avg_temperature": 28.5,
                    "min_temperature": 22.0,
                    "max_temperature": 35.0,
                    "rainfall": 850.0,
                    "humidity": 72.0
                },
                "soil": {
                    "soil_type": "alluvial",
                    "ph": 6.8,
                    "nitrogen": 120,
                    "phosphorus": 45,
                    "potassium": 180
                },
                "crop": {
                    "crop_name": "rice",
                    "area": 2.5,
                    "season": "kharif",
                    "irrigation_type": "canal"
                },
                "location": {
                    "state": "Punjab",
                    "district": "Ludhiana"
                }
            }
        }
    }


class PredictionValue(BaseModel):
    """Prediction values."""
    yield_per_hectare: float
    yield_unit: str = "kg/ha"
    total_production: float
    production_unit: str = "kg"
    area: float
    area_unit: str = "hectares"


class ConfidenceInterval(BaseModel):
    """Confidence interval for prediction."""
    lower_bound: float
    upper_bound: float
    confidence_level: float = 0.95


class FactorAssessment(BaseModel):
    """Factor impact assessment."""
    weather_impact: Dict[str, Any]
    soil_impact: Dict[str, Any]
    irrigation_impact: Dict[str, Any]


class Recommendation(BaseModel):
    """Recommendation item."""
    category: str
    priority: str
    issue: Optional[str]
    suggestion: str


class CropInfoResponse(BaseModel):
    """Crop information in response."""
    crop: str
    category: str
    typical_yield_range: tuple
    season: str
    irrigation: str


class YieldPredictionResponse(BaseModel):
    """Yield prediction response."""
    success: bool
    prediction: Optional[PredictionValue] = None
    confidence: Optional[ConfidenceInterval] = None
    model_predictions: Optional[Dict[str, float]] = None
    crop_info: Optional[Dict[str, Any]] = None
    factors: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    warnings: Optional[List[str]] = None
    error: Optional[str] = None
    processing_time_ms: Optional[float] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    version: str
    models_loaded: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ModelInfoResponse(BaseModel):
    """Model information response."""
    models: List[str]
    weights: Dict[str, float]
    is_loaded: bool
    supported_crops: List[str]
    num_features: int


class ErrorResponse(BaseModel):
    """Error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None
