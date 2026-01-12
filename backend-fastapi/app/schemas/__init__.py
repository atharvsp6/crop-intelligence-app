"""
Pydantic schemas for API requests and responses
"""
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


# ============== Auth Schemas ==============

class UserRole(str, Enum):
    """User roles."""
    FARMER = "farmer"
    EXPERT = "expert"
    ADMIN = "admin"


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole = UserRole.FARMER


class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """User response schema."""
    id: str
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None


class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str


# ============== Disease Detection Schemas ==============

class DiseaseDetectionResponse(BaseModel):
    """Disease detection response."""
    success: bool
    primary_prediction: Optional[Dict[str, Any]] = None
    all_predictions: List[Dict[str, Any]] = []
    treatment: Optional[Dict[str, Any]] = None
    model_info: Optional[Dict[str, Any]] = None
    processing_time_ms: Optional[float] = None
    error: Optional[str] = None


# ============== Crop Yield Schemas ==============

class WeatherInput(BaseModel):
    """Weather input for yield prediction."""
    avg_temperature: float = Field(..., ge=-10, le=50)
    min_temperature: float = Field(..., ge=-20, le=45)
    max_temperature: float = Field(..., ge=-5, le=55)
    rainfall: float = Field(..., ge=0, le=5000)
    humidity: float = Field(..., ge=0, le=100)
    solar_radiation: Optional[float] = None


class SoilInput(BaseModel):
    """Soil input for yield prediction."""
    soil_type: str
    ph: float = Field(..., ge=3, le=10)
    nitrogen: float = Field(..., ge=0, le=500)
    phosphorus: float = Field(..., ge=0, le=200)
    potassium: float = Field(..., ge=0, le=500)
    organic_carbon: Optional[float] = None


class CropInput(BaseModel):
    """Crop input for yield prediction."""
    crop_name: str
    area: float = Field(..., gt=0, le=10000)
    season: str
    irrigation_type: str
    seed_variety: Optional[str] = None
    fertilizer_used: Optional[float] = None


class LocationInput(BaseModel):
    """Location input for yield prediction."""
    state: str
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class YieldPredictionRequest(BaseModel):
    """Yield prediction request."""
    weather: WeatherInput
    soil: SoilInput
    crop: CropInput
    location: LocationInput


class YieldPredictionResponse(BaseModel):
    """Yield prediction response."""
    success: bool
    prediction: Optional[Dict[str, Any]] = None
    confidence: Optional[Dict[str, Any]] = None
    model_predictions: Optional[Dict[str, float]] = None
    crop_info: Optional[Dict[str, Any]] = None
    factors: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    warnings: Optional[List[str]] = None
    processing_time_ms: Optional[float] = None
    error: Optional[str] = None


# ============== Weather Schemas ==============

class WeatherResponse(BaseModel):
    """Weather data response."""
    location: str
    temperature: float
    humidity: float
    description: str
    wind_speed: float
    pressure: float
    feels_like: float
    forecast: Optional[List[Dict[str, Any]]] = None


# ============== Market Data Schemas ==============

class CommodityPrice(BaseModel):
    """Commodity price data."""
    commodity: str
    market: str
    price: float
    unit: str
    date: str
    change_percent: Optional[float] = None


class MarketDataResponse(BaseModel):
    """Market data response."""
    success: bool
    data: List[CommodityPrice]
    last_updated: datetime


# ============== Forum Schemas ==============

class ForumPostCreate(BaseModel):
    """Forum post creation."""
    title: str = Field(..., min_length=5, max_length=200)
    content: str = Field(..., min_length=10, max_length=10000)
    category: str


class ForumPostResponse(BaseModel):
    """Forum post response."""
    id: str
    user_id: str
    user_name: Optional[str] = None
    title: str
    content: str
    category: str
    likes: int
    comments_count: int
    created_at: datetime


class CommentCreate(BaseModel):
    """Comment creation."""
    content: str = Field(..., min_length=1, max_length=2000)


class CommentResponse(BaseModel):
    """Comment response."""
    id: str
    user_id: str
    user_name: Optional[str] = None
    content: str
    created_at: datetime


# ============== Dashboard Schemas ==============

class DashboardStats(BaseModel):
    """Dashboard statistics."""
    total_predictions: int
    total_detections: int
    active_crops: int
    weather_alerts: int


class DashboardResponse(BaseModel):
    """Dashboard response."""
    stats: DashboardStats
    recent_predictions: List[Dict[str, Any]]
    recent_detections: List[Dict[str, Any]]
    weather: Optional[WeatherResponse] = None
    market_highlights: List[CommodityPrice]


# ============== Common Schemas ==============

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    timestamp: datetime
    services: Dict[str, str]


class ErrorResponse(BaseModel):
    """Error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""
    items: List[Any]
    total: int
    page: int
    page_size: int
    has_next: bool
    has_prev: bool
