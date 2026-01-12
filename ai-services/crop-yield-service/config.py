"""
Configuration for Crop Yield Prediction Service
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List, Dict
import os


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Service Info
    SERVICE_NAME: str = "crop-yield-service"
    SERVICE_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8002
    WORKERS: int = 1
    
    # Model Settings
    MODEL_PATH: str = "models/yield_model.joblib"
    ENSEMBLE_MODELS: List[str] = ["xgboost", "lightgbm", "catboost"]
    USE_ENSEMBLE: bool = True
    
    # Feature Settings
    FEATURE_SCALER_PATH: str = "models/feature_scaler.joblib"
    
    # Prediction Settings
    PREDICTION_CONFIDENCE_INTERVAL: float = 0.95
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Indian states with agricultural zones
INDIAN_STATES = {
    "andhra_pradesh": {"zone": "south", "climate": "tropical"},
    "arunachal_pradesh": {"zone": "northeast", "climate": "subtropical"},
    "assam": {"zone": "northeast", "climate": "subtropical"},
    "bihar": {"zone": "east", "climate": "subtropical"},
    "chhattisgarh": {"zone": "central", "climate": "tropical"},
    "goa": {"zone": "west", "climate": "tropical"},
    "gujarat": {"zone": "west", "climate": "semi_arid"},
    "haryana": {"zone": "north", "climate": "semi_arid"},
    "himachal_pradesh": {"zone": "north", "climate": "temperate"},
    "jharkhand": {"zone": "east", "climate": "subtropical"},
    "karnataka": {"zone": "south", "climate": "tropical"},
    "kerala": {"zone": "south", "climate": "tropical"},
    "madhya_pradesh": {"zone": "central", "climate": "subtropical"},
    "maharashtra": {"zone": "west", "climate": "tropical"},
    "manipur": {"zone": "northeast", "climate": "subtropical"},
    "meghalaya": {"zone": "northeast", "climate": "subtropical"},
    "mizoram": {"zone": "northeast", "climate": "subtropical"},
    "nagaland": {"zone": "northeast", "climate": "subtropical"},
    "odisha": {"zone": "east", "climate": "tropical"},
    "punjab": {"zone": "north", "climate": "semi_arid"},
    "rajasthan": {"zone": "west", "climate": "arid"},
    "sikkim": {"zone": "northeast", "climate": "temperate"},
    "tamil_nadu": {"zone": "south", "climate": "tropical"},
    "telangana": {"zone": "south", "climate": "tropical"},
    "tripura": {"zone": "northeast", "climate": "subtropical"},
    "uttar_pradesh": {"zone": "north", "climate": "subtropical"},
    "uttarakhand": {"zone": "north", "climate": "temperate"},
    "west_bengal": {"zone": "east", "climate": "subtropical"},
}

# Supported crops with typical yields (kg/hectare)
CROP_INFO = {
    "rice": {
        "category": "cereal",
        "typical_yield_range": (2000, 6000),
        "optimal_rainfall": (1200, 1500),
        "optimal_temp": (20, 35),
        "growing_season": "kharif",
        "water_requirement": "high"
    },
    "wheat": {
        "category": "cereal",
        "typical_yield_range": (2500, 5500),
        "optimal_rainfall": (400, 600),
        "optimal_temp": (15, 25),
        "growing_season": "rabi",
        "water_requirement": "medium"
    },
    "maize": {
        "category": "cereal",
        "typical_yield_range": (2000, 6000),
        "optimal_rainfall": (500, 800),
        "optimal_temp": (20, 30),
        "growing_season": "kharif",
        "water_requirement": "medium"
    },
    "cotton": {
        "category": "fiber",
        "typical_yield_range": (300, 600),
        "optimal_rainfall": (500, 800),
        "optimal_temp": (25, 35),
        "growing_season": "kharif",
        "water_requirement": "medium"
    },
    "sugarcane": {
        "category": "cash_crop",
        "typical_yield_range": (60000, 100000),
        "optimal_rainfall": (1500, 2500),
        "optimal_temp": (25, 35),
        "growing_season": "annual",
        "water_requirement": "very_high"
    },
    "groundnut": {
        "category": "oilseed",
        "typical_yield_range": (1000, 2500),
        "optimal_rainfall": (500, 750),
        "optimal_temp": (25, 30),
        "growing_season": "kharif",
        "water_requirement": "medium"
    },
    "soybean": {
        "category": "oilseed",
        "typical_yield_range": (1000, 2500),
        "optimal_rainfall": (600, 1000),
        "optimal_temp": (20, 30),
        "growing_season": "kharif",
        "water_requirement": "medium"
    },
    "potato": {
        "category": "vegetable",
        "typical_yield_range": (15000, 30000),
        "optimal_rainfall": (400, 600),
        "optimal_temp": (15, 25),
        "growing_season": "rabi",
        "water_requirement": "medium"
    },
    "tomato": {
        "category": "vegetable",
        "typical_yield_range": (20000, 40000),
        "optimal_rainfall": (400, 600),
        "optimal_temp": (20, 30),
        "growing_season": "rabi",
        "water_requirement": "medium"
    },
    "onion": {
        "category": "vegetable",
        "typical_yield_range": (15000, 25000),
        "optimal_rainfall": (350, 550),
        "optimal_temp": (15, 25),
        "growing_season": "rabi",
        "water_requirement": "low"
    },
    "mustard": {
        "category": "oilseed",
        "typical_yield_range": (800, 1500),
        "optimal_rainfall": (250, 400),
        "optimal_temp": (15, 25),
        "growing_season": "rabi",
        "water_requirement": "low"
    },
    "pulses": {
        "category": "legume",
        "typical_yield_range": (500, 1200),
        "optimal_rainfall": (300, 500),
        "optimal_temp": (20, 30),
        "growing_season": "rabi",
        "water_requirement": "low"
    }
}

# Soil types in India
SOIL_TYPES = {
    "alluvial": {"fertility": "high", "water_retention": "medium"},
    "black": {"fertility": "high", "water_retention": "high"},
    "red": {"fertility": "medium", "water_retention": "low"},
    "laterite": {"fertility": "low", "water_retention": "low"},
    "desert": {"fertility": "low", "water_retention": "very_low"},
    "mountain": {"fertility": "medium", "water_retention": "medium"},
    "saline": {"fertility": "low", "water_retention": "high"},
}

# Season mapping
SEASONS = {
    "kharif": {"months": [6, 7, 8, 9, 10], "description": "Monsoon season"},
    "rabi": {"months": [10, 11, 12, 1, 2, 3], "description": "Winter season"},
    "zaid": {"months": [3, 4, 5, 6], "description": "Summer season"},
}


def get_crop_info(crop_name: str) -> dict:
    """Get crop information."""
    return CROP_INFO.get(crop_name.lower(), {
        "category": "unknown",
        "typical_yield_range": (1000, 5000),
        "optimal_rainfall": (500, 1000),
        "optimal_temp": (20, 30),
        "growing_season": "kharif",
        "water_requirement": "medium"
    })


def get_state_info(state: str) -> dict:
    """Get state information."""
    state_key = state.lower().replace(" ", "_")
    return INDIAN_STATES.get(state_key, {"zone": "central", "climate": "subtropical"})
