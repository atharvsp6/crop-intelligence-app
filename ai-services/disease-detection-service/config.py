"""
Configuration for Disease Detection Service
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List
import os


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Service Info
    SERVICE_NAME: str = "disease-detection-service"
    SERVICE_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    WORKERS: int = 1
    
    # Model Settings
    MODEL_NAME: str = "efficientnet_b0"  # Low RAM, high accuracy
    MODEL_WEIGHTS_PATH: str = "models/disease_model.pth"
    USE_PRETRAINED: bool = True
    DEVICE: str = "cpu"  # Free tier: CPU only
    
    # Image Processing
    IMAGE_SIZE: int = 224
    NORMALIZE_MEAN: List[float] = [0.485, 0.456, 0.406]
    NORMALIZE_STD: List[float] = [0.229, 0.224, 0.225]
    
    # Inference Settings
    CONFIDENCE_THRESHOLD: float = 0.3
    TOP_K_PREDICTIONS: int = 3
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
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


# Disease class mapping for Indian crops
DISEASE_CLASSES = {
    0: {"crop": "Rice", "disease": "Bacterial Leaf Blight", "severity": "high"},
    1: {"crop": "Rice", "disease": "Brown Spot", "severity": "medium"},
    2: {"crop": "Rice", "disease": "Leaf Smut", "severity": "low"},
    3: {"crop": "Rice", "disease": "Healthy", "severity": "none"},
    4: {"crop": "Wheat", "disease": "Brown Rust", "severity": "high"},
    5: {"crop": "Wheat", "disease": "Yellow Rust", "severity": "high"},
    6: {"crop": "Wheat", "disease": "Septoria", "severity": "medium"},
    7: {"crop": "Wheat", "disease": "Healthy", "severity": "none"},
    8: {"crop": "Cotton", "disease": "Bacterial Blight", "severity": "high"},
    9: {"crop": "Cotton", "disease": "Curl Virus", "severity": "high"},
    10: {"crop": "Cotton", "disease": "Fusarium Wilt", "severity": "medium"},
    11: {"crop": "Cotton", "disease": "Healthy", "severity": "none"},
    12: {"crop": "Tomato", "disease": "Early Blight", "severity": "medium"},
    13: {"crop": "Tomato", "disease": "Late Blight", "severity": "high"},
    14: {"crop": "Tomato", "disease": "Leaf Mold", "severity": "medium"},
    15: {"crop": "Tomato", "disease": "Septoria Leaf Spot", "severity": "medium"},
    16: {"crop": "Tomato", "disease": "Spider Mites", "severity": "low"},
    17: {"crop": "Tomato", "disease": "Target Spot", "severity": "medium"},
    18: {"crop": "Tomato", "disease": "Yellow Leaf Curl Virus", "severity": "high"},
    19: {"crop": "Tomato", "disease": "Mosaic Virus", "severity": "high"},
    20: {"crop": "Tomato", "disease": "Healthy", "severity": "none"},
    21: {"crop": "Potato", "disease": "Early Blight", "severity": "medium"},
    22: {"crop": "Potato", "disease": "Late Blight", "severity": "high"},
    23: {"crop": "Potato", "disease": "Healthy", "severity": "none"},
    24: {"crop": "Maize", "disease": "Cercospora Leaf Spot", "severity": "medium"},
    25: {"crop": "Maize", "disease": "Common Rust", "severity": "medium"},
    26: {"crop": "Maize", "disease": "Northern Leaf Blight", "severity": "high"},
    27: {"crop": "Maize", "disease": "Healthy", "severity": "none"},
    28: {"crop": "Sugarcane", "disease": "Red Rot", "severity": "high"},
    29: {"crop": "Sugarcane", "disease": "Smut", "severity": "high"},
    30: {"crop": "Sugarcane", "disease": "Rust", "severity": "medium"},
    31: {"crop": "Sugarcane", "disease": "Healthy", "severity": "none"},
    32: {"crop": "Grape", "disease": "Black Rot", "severity": "high"},
    33: {"crop": "Grape", "disease": "Esca (Black Measles)", "severity": "high"},
    34: {"crop": "Grape", "disease": "Leaf Blight", "severity": "medium"},
    35: {"crop": "Grape", "disease": "Healthy", "severity": "none"},
    36: {"crop": "Apple", "disease": "Apple Scab", "severity": "medium"},
    37: {"crop": "Apple", "disease": "Black Rot", "severity": "high"},
    38: {"crop": "Apple", "disease": "Cedar Apple Rust", "severity": "medium"},
    39: {"crop": "Apple", "disease": "Healthy", "severity": "none"},
}

# Treatment recommendations
TREATMENT_RECOMMENDATIONS = {
    "Bacterial Leaf Blight": {
        "organic": ["Neem oil spray", "Copper-based bactericides", "Remove infected leaves"],
        "chemical": ["Streptomycin sulfate", "Copper hydroxide"],
        "prevention": ["Use resistant varieties", "Avoid overhead irrigation", "Proper spacing"]
    },
    "Brown Spot": {
        "organic": ["Trichoderma treatment", "Neem cake application"],
        "chemical": ["Mancozeb", "Carbendazim"],
        "prevention": ["Balanced fertilization", "Proper drainage"]
    },
    "Late Blight": {
        "organic": ["Copper spray", "Bordeaux mixture"],
        "chemical": ["Metalaxyl", "Chlorothalonil"],
        "prevention": ["Avoid wet conditions", "Remove infected plants"]
    },
    "Early Blight": {
        "organic": ["Neem oil", "Baking soda spray"],
        "chemical": ["Mancozeb", "Chlorothalonil"],
        "prevention": ["Crop rotation", "Mulching"]
    },
    "Healthy": {
        "organic": ["Continue current practices"],
        "chemical": ["No treatment needed"],
        "prevention": ["Regular monitoring", "Balanced nutrition"]
    }
}

# Get treatment for a disease
def get_treatment(disease_name: str) -> dict:
    """Get treatment recommendation for a disease."""
    return TREATMENT_RECOMMENDATIONS.get(
        disease_name,
        {
            "organic": ["Consult local agricultural officer"],
            "chemical": ["Contact certified agronomist"],
            "prevention": ["Regular field monitoring"]
        }
    )
