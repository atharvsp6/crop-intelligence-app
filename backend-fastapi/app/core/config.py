"""
Application Configuration
Environment-based configuration with validation
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application
    APP_NAME: str = "Crop Intelligence API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development, staging, production
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 1
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # API Versioning
    API_V1_PREFIX: str = "/api/v1"
    
    # Firebase Configuration
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_DATABASE_URL: str = ""
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_CREDENTIALS_JSON: Optional[str] = None  # For cloud deployments
    
    # AI Services
    DISEASE_SERVICE_URL: str = "http://localhost:8001"
    YIELD_SERVICE_URL: str = "http://localhost:8002"
    AI_SERVICE_TIMEOUT: int = 30
    
    # Authentication
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60
    
    # Caching
    CACHE_TTL_SECONDS: int = 300
    CACHE_MAX_SIZE: int = 1000
    
    # External APIs (Free Tier)
    WEATHER_API_KEY: Optional[str] = None  # OpenWeatherMap free tier
    WEATHER_API_URL: str = "https://api.openweathermap.org/data/2.5"
    
    # Market Data
    MARKET_DATA_CACHE_TTL: int = 3600  # 1 hour
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json or text
    
    # Background Tasks
    REDIS_URL: Optional[str] = None
    USE_BACKGROUND_TASKS: bool = False
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


class DevelopmentSettings(Settings):
    """Development-specific settings."""
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"
    LOG_FORMAT: str = "text"


class ProductionSettings(Settings):
    """Production-specific settings."""
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    WORKERS: int = 4


class StagingSettings(Settings):
    """Staging-specific settings."""
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"


@lru_cache()
def get_settings() -> Settings:
    """Get settings based on environment."""
    env = os.getenv("ENVIRONMENT", "development")
    
    settings_map = {
        "development": DevelopmentSettings,
        "staging": StagingSettings,
        "production": ProductionSettings
    }
    
    settings_class = settings_map.get(env, Settings)
    return settings_class()


# Constants
class Constants:
    """Application constants."""
    
    # Supported Indian states
    INDIAN_STATES = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
        "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
        "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
        "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
        "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
        "Uttar Pradesh", "Uttarakhand", "West Bengal"
    ]
    
    # Major crops
    MAJOR_CROPS = [
        "Rice", "Wheat", "Maize", "Cotton", "Sugarcane",
        "Groundnut", "Soybean", "Potato", "Tomato", "Onion",
        "Mustard", "Pulses", "Jowar", "Bajra", "Ragi"
    ]
    
    # Seasons
    SEASONS = {
        "kharif": {"months": [6, 7, 8, 9, 10], "name": "Monsoon"},
        "rabi": {"months": [10, 11, 12, 1, 2, 3], "name": "Winter"},
        "zaid": {"months": [3, 4, 5, 6], "name": "Summer"}
    }
    
    # Soil types
    SOIL_TYPES = [
        "Alluvial", "Black", "Red", "Laterite",
        "Desert", "Mountain", "Saline"
    ]
