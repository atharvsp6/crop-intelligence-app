"""
Feature Engineering for Crop Yield Prediction
India-centric feature processing pipeline
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import logging

from config import (
    CROP_INFO, 
    INDIAN_STATES, 
    SOIL_TYPES, 
    SEASONS,
    get_crop_info,
    get_state_info
)

logger = logging.getLogger(__name__)


@dataclass
class WeatherFeatures:
    """Weather-related features."""
    avg_temperature: float  # Celsius
    min_temperature: float
    max_temperature: float
    rainfall: float  # mm
    humidity: float  # percentage
    solar_radiation: Optional[float] = None  # MJ/m²/day


@dataclass
class SoilFeatures:
    """Soil-related features."""
    soil_type: str
    ph: float
    nitrogen: float  # kg/ha
    phosphorus: float  # kg/ha
    potassium: float  # kg/ha
    organic_carbon: Optional[float] = None  # percentage


@dataclass
class CropFeatures:
    """Crop and cultivation features."""
    crop_name: str
    area: float  # hectares
    season: str
    irrigation_type: str  # 'rainfed', 'canal', 'tubewell', 'drip', 'sprinkler'
    seed_variety: Optional[str] = None
    fertilizer_used: Optional[float] = None  # kg/ha


@dataclass
class LocationFeatures:
    """Location-related features."""
    state: str
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class FeatureEngineer:
    """
    Feature engineering pipeline for crop yield prediction.
    Handles preprocessing, encoding, and feature generation.
    """
    
    # Encoding mappings
    SEASON_ENCODING = {"kharif": 0, "rabi": 1, "zaid": 2, "annual": 3}
    IRRIGATION_ENCODING = {
        "rainfed": 0, "canal": 1, "tubewell": 2, 
        "drip": 3, "sprinkler": 4, "flood": 5
    }
    CROP_CATEGORY_ENCODING = {
        "cereal": 0, "oilseed": 1, "fiber": 2, 
        "cash_crop": 3, "vegetable": 4, "legume": 5, "unknown": 6
    }
    ZONE_ENCODING = {
        "north": 0, "south": 1, "east": 2, 
        "west": 3, "central": 4, "northeast": 5
    }
    CLIMATE_ENCODING = {
        "tropical": 0, "subtropical": 1, "semi_arid": 2, 
        "arid": 3, "temperate": 4
    }
    SOIL_TYPE_ENCODING = {
        "alluvial": 0, "black": 1, "red": 2, "laterite": 3,
        "desert": 4, "mountain": 5, "saline": 6, "unknown": 7
    }
    
    def __init__(self):
        self.feature_names: List[str] = []
        self._setup_feature_names()
    
    def _setup_feature_names(self):
        """Define the feature names."""
        self.feature_names = [
            # Weather features (6)
            "avg_temperature", "min_temperature", "max_temperature",
            "rainfall", "humidity", "solar_radiation",
            # Soil features (6)
            "soil_type_encoded", "ph", "nitrogen", 
            "phosphorus", "potassium", "organic_carbon",
            # Crop features (6)
            "crop_category", "area", "season_encoded",
            "irrigation_encoded", "fertilizer_used", "crop_yield_potential",
            # Location features (3)
            "zone_encoded", "climate_encoded", "latitude_normalized",
            # Derived features (9)
            "temp_range", "rainfall_temp_ratio", "nutrient_index",
            "water_stress_index", "growing_degree_days", "soil_fertility_score",
            "irrigation_efficiency", "weather_crop_match", "regional_yield_factor"
        ]
    
    def process_weather(self, weather: WeatherFeatures) -> np.ndarray:
        """Process weather features."""
        return np.array([
            weather.avg_temperature,
            weather.min_temperature,
            weather.max_temperature,
            weather.rainfall,
            weather.humidity,
            weather.solar_radiation or 15.0  # Default solar radiation
        ])
    
    def process_soil(self, soil: SoilFeatures) -> np.ndarray:
        """Process soil features."""
        soil_encoded = self.SOIL_TYPE_ENCODING.get(
            soil.soil_type.lower(), 
            self.SOIL_TYPE_ENCODING["unknown"]
        )
        return np.array([
            soil_encoded,
            soil.ph,
            soil.nitrogen,
            soil.phosphorus,
            soil.potassium,
            soil.organic_carbon or 0.5  # Default organic carbon
        ])
    
    def process_crop(self, crop: CropFeatures) -> np.ndarray:
        """Process crop features."""
        crop_info = get_crop_info(crop.crop_name)
        crop_category = self.CROP_CATEGORY_ENCODING.get(
            crop_info.get("category", "unknown"),
            self.CROP_CATEGORY_ENCODING["unknown"]
        )
        season_encoded = self.SEASON_ENCODING.get(
            crop.season.lower(), 
            self.SEASON_ENCODING["kharif"]
        )
        irrigation_encoded = self.IRRIGATION_ENCODING.get(
            crop.irrigation_type.lower(),
            self.IRRIGATION_ENCODING["rainfed"]
        )
        
        # Yield potential based on crop
        yield_range = crop_info.get("typical_yield_range", (1000, 5000))
        yield_potential = (yield_range[0] + yield_range[1]) / 2
        
        return np.array([
            crop_category,
            crop.area,
            season_encoded,
            irrigation_encoded,
            crop.fertilizer_used or 100.0,  # Default fertilizer
            yield_potential / 1000  # Normalize
        ])
    
    def process_location(self, location: LocationFeatures) -> np.ndarray:
        """Process location features."""
        state_info = get_state_info(location.state)
        zone_encoded = self.ZONE_ENCODING.get(
            state_info.get("zone", "central"),
            self.ZONE_ENCODING["central"]
        )
        climate_encoded = self.CLIMATE_ENCODING.get(
            state_info.get("climate", "subtropical"),
            self.CLIMATE_ENCODING["subtropical"]
        )
        
        # Normalize latitude (India: ~8° to ~37°)
        lat = location.latitude or 20.0  # Default central India
        lat_normalized = (lat - 8) / (37 - 8)
        
        return np.array([
            zone_encoded,
            climate_encoded,
            lat_normalized
        ])
    
    def compute_derived_features(
        self,
        weather: WeatherFeatures,
        soil: SoilFeatures,
        crop: CropFeatures,
        location: LocationFeatures
    ) -> np.ndarray:
        """Compute derived/engineered features."""
        crop_info = get_crop_info(crop.crop_name)
        
        # Temperature range
        temp_range = weather.max_temperature - weather.min_temperature
        
        # Rainfall to temperature ratio
        rainfall_temp_ratio = weather.rainfall / (weather.avg_temperature + 1)
        
        # Nutrient index (NPK balance)
        nutrient_index = (soil.nitrogen + soil.phosphorus + soil.potassium) / 3
        
        # Water stress index
        optimal_rainfall = crop_info.get("optimal_rainfall", (500, 1000))
        optimal_mid = (optimal_rainfall[0] + optimal_rainfall[1]) / 2
        water_stress = abs(weather.rainfall - optimal_mid) / optimal_mid
        
        # Growing degree days (simplified)
        base_temp = 10  # Base temperature for crop growth
        gdd = max(0, weather.avg_temperature - base_temp) * 120  # Approximate days
        
        # Soil fertility score
        soil_info = SOIL_TYPES.get(soil.soil_type.lower(), {"fertility": "medium"})
        fertility_map = {"high": 1.0, "medium": 0.6, "low": 0.3, "very_low": 0.1}
        soil_fertility = fertility_map.get(soil_info.get("fertility", "medium"), 0.5)
        
        # Irrigation efficiency
        irrigation_efficiency_map = {
            "drip": 0.9, "sprinkler": 0.75, "tubewell": 0.6,
            "canal": 0.5, "flood": 0.4, "rainfed": 0.3
        }
        irrigation_efficiency = irrigation_efficiency_map.get(
            crop.irrigation_type.lower(), 0.5
        )
        
        # Weather-crop match score
        optimal_temp = crop_info.get("optimal_temp", (20, 30))
        temp_match = 1 - min(1, abs(weather.avg_temperature - np.mean(optimal_temp)) / 15)
        rainfall_match = 1 - min(1, water_stress)
        weather_crop_match = (temp_match + rainfall_match) / 2
        
        # Regional yield factor (based on zone productivity)
        state_info = get_state_info(location.state)
        zone = state_info.get("zone", "central")
        regional_factors = {
            "north": 1.1, "south": 1.0, "east": 0.95,
            "west": 1.05, "central": 1.0, "northeast": 0.85
        }
        regional_yield_factor = regional_factors.get(zone, 1.0)
        
        return np.array([
            temp_range,
            rainfall_temp_ratio,
            nutrient_index,
            water_stress,
            gdd / 1000,  # Normalize
            soil_fertility,
            irrigation_efficiency,
            weather_crop_match,
            regional_yield_factor
        ])
    
    def engineer_features(
        self,
        weather: WeatherFeatures,
        soil: SoilFeatures,
        crop: CropFeatures,
        location: LocationFeatures
    ) -> Tuple[np.ndarray, List[str]]:
        """
        Generate complete feature vector from input features.
        
        Returns:
            Tuple of (feature_array, feature_names)
        """
        try:
            # Process each feature group
            weather_features = self.process_weather(weather)
            soil_features = self.process_soil(soil)
            crop_features = self.process_crop(crop)
            location_features = self.process_location(location)
            derived_features = self.compute_derived_features(
                weather, soil, crop, location
            )
            
            # Concatenate all features
            all_features = np.concatenate([
                weather_features,
                soil_features,
                crop_features,
                location_features,
                derived_features
            ])
            
            return all_features, self.feature_names
            
        except Exception as e:
            logger.error(f"Feature engineering error: {e}")
            raise
    
    def validate_input(
        self,
        weather: WeatherFeatures,
        soil: SoilFeatures,
        crop: CropFeatures,
        location: LocationFeatures
    ) -> List[str]:
        """Validate input features and return list of warnings."""
        warnings = []
        
        # Temperature validation
        if not -10 <= weather.avg_temperature <= 50:
            warnings.append(f"Unusual temperature: {weather.avg_temperature}°C")
        
        # Rainfall validation
        if weather.rainfall < 0:
            warnings.append("Rainfall cannot be negative")
        if weather.rainfall > 5000:
            warnings.append(f"Very high rainfall: {weather.rainfall}mm")
        
        # Soil pH validation
        if not 3 <= soil.ph <= 10:
            warnings.append(f"Unusual soil pH: {soil.ph}")
        
        # Crop validation
        if crop.crop_name.lower() not in CROP_INFO:
            warnings.append(f"Unknown crop: {crop.crop_name}")
        
        # State validation
        state_key = location.state.lower().replace(" ", "_")
        if state_key not in INDIAN_STATES:
            warnings.append(f"Unknown state: {location.state}")
        
        return warnings


# Singleton instance
_feature_engineer: Optional[FeatureEngineer] = None


def get_feature_engineer() -> FeatureEngineer:
    """Get feature engineer instance."""
    global _feature_engineer
    if _feature_engineer is None:
        _feature_engineer = FeatureEngineer()
    return _feature_engineer
