"""
Crop Yield Prediction Model
Ensemble of XGBoost, LightGBM, and CatBoost for robust predictions
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
import logging
import joblib
from dataclasses import dataclass

from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score

from config import get_settings, CROP_INFO, get_crop_info
from features import (
    FeatureEngineer,
    WeatherFeatures,
    SoilFeatures,
    CropFeatures,
    LocationFeatures,
    get_feature_engineer
)

logger = logging.getLogger(__name__)
settings = get_settings()


@dataclass
class PredictionResult:
    """Prediction result with confidence intervals."""
    predicted_yield: float  # kg/hectare
    confidence_lower: float
    confidence_upper: float
    confidence_level: float
    unit: str = "kg/ha"


class EnsembleYieldModel:
    """
    Ensemble model for crop yield prediction.
    Combines XGBoost, LightGBM, and CatBoost predictions.
    """
    
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.scaler: Optional[StandardScaler] = None
        self.feature_engineer: FeatureEngineer = get_feature_engineer()
        self.is_loaded = False
        self.model_weights = {"xgboost": 0.4, "lightgbm": 0.35, "catboost": 0.25}
    
    def _create_default_models(self):
        """Create default model configurations."""
        from xgboost import XGBRegressor
        from lightgbm import LGBMRegressor
        from catboost import CatBoostRegressor
        
        self.models = {
            "xgboost": XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1
            ),
            "lightgbm": LGBMRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1,
                verbose=-1
            ),
            "catboost": CatBoostRegressor(
                iterations=100,
                depth=6,
                learning_rate=0.1,
                random_state=42,
                verbose=False
            )
        }
        
        self.scaler = StandardScaler()
    
    def load(self) -> bool:
        """Load trained models."""
        try:
            logger.info("Loading crop yield prediction models...")
            
            model_path = Path(settings.MODEL_PATH)
            scaler_path = Path(settings.FEATURE_SCALER_PATH)
            
            if model_path.exists():
                logger.info(f"Loading models from {model_path}")
                self.models = joblib.load(model_path)
                
                if scaler_path.exists():
                    self.scaler = joblib.load(scaler_path)
                else:
                    self.scaler = StandardScaler()
                    
                self.is_loaded = True
            else:
                logger.warning("Trained models not found, creating default models")
                self._create_default_models()
                self._train_on_synthetic_data()
                self.is_loaded = True
            
            # Warmup
            self._warmup()
            
            logger.info("Crop yield models loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            self._create_default_models()
            self._train_on_synthetic_data()
            self.is_loaded = True
            return True
    
    def _train_on_synthetic_data(self):
        """Train on synthetic data for demo purposes."""
        logger.info("Training on synthetic data...")
        
        np.random.seed(42)
        n_samples = 1000
        
        # Generate synthetic features
        X = np.random.randn(n_samples, 30)
        
        # Generate synthetic yields (realistic range)
        base_yield = 3000  # kg/ha
        y = base_yield + X[:, 0] * 500 + X[:, 3] * 300 + np.random.randn(n_samples) * 200
        y = np.clip(y, 500, 10000)  # Realistic bounds
        
        # Fit scaler
        X_scaled = self.scaler.fit_transform(X)
        
        # Train each model
        for name, model in self.models.items():
            logger.info(f"Training {name}...")
            model.fit(X_scaled, y)
        
        logger.info("Synthetic training complete")
    
    def _warmup(self):
        """Warm up models with dummy prediction."""
        try:
            dummy_features = np.zeros((1, 30))
            if self.scaler:
                dummy_features = self.scaler.transform(dummy_features)
            for model in self.models.values():
                _ = model.predict(dummy_features)
            logger.info("Model warmup complete")
        except Exception as e:
            logger.warning(f"Warmup failed: {e}")
    
    def predict(
        self,
        weather: WeatherFeatures,
        soil: SoilFeatures,
        crop: CropFeatures,
        location: LocationFeatures
    ) -> Dict:
        """
        Make yield prediction with confidence intervals.
        
        Returns:
            Dictionary containing prediction, confidence intervals, and metadata
        """
        if not self.is_loaded:
            raise RuntimeError("Models not loaded. Call load() first.")
        
        try:
            # Engineer features
            features, feature_names = self.feature_engineer.engineer_features(
                weather, soil, crop, location
            )
            
            # Validate inputs
            warnings = self.feature_engineer.validate_input(
                weather, soil, crop, location
            )
            
            # Scale features
            features_scaled = self.scaler.transform(features.reshape(1, -1))
            
            # Get predictions from each model
            predictions = {}
            for name, model in self.models.items():
                pred = model.predict(features_scaled)[0]
                predictions[name] = max(0, pred)  # Ensure non-negative
            
            # Ensemble prediction (weighted average)
            ensemble_pred = sum(
                pred * self.model_weights.get(name, 1/len(self.models))
                for name, pred in predictions.items()
            )
            
            # Calculate confidence interval from model disagreement
            pred_values = list(predictions.values())
            pred_std = np.std(pred_values)
            
            # 95% confidence interval
            z_score = 1.96
            confidence_lower = max(0, ensemble_pred - z_score * pred_std)
            confidence_upper = ensemble_pred + z_score * pred_std
            
            # Get crop-specific adjustments
            crop_info = get_crop_info(crop.crop_name)
            yield_range = crop_info.get("typical_yield_range", (1000, 5000))
            
            # Clip to realistic range for the crop
            ensemble_pred = np.clip(ensemble_pred, yield_range[0] * 0.5, yield_range[1] * 1.5)
            confidence_lower = np.clip(confidence_lower, yield_range[0] * 0.3, ensemble_pred)
            confidence_upper = np.clip(confidence_upper, ensemble_pred, yield_range[1] * 2)
            
            # Calculate total production
            total_production = ensemble_pred * crop.area
            
            # Build response
            result = {
                "success": True,
                "prediction": {
                    "yield_per_hectare": round(ensemble_pred, 2),
                    "yield_unit": "kg/ha",
                    "total_production": round(total_production, 2),
                    "production_unit": "kg",
                    "area": crop.area,
                    "area_unit": "hectares"
                },
                "confidence": {
                    "lower_bound": round(confidence_lower, 2),
                    "upper_bound": round(confidence_upper, 2),
                    "confidence_level": 0.95
                },
                "model_predictions": {
                    name: round(pred, 2) for name, pred in predictions.items()
                },
                "crop_info": {
                    "crop": crop.crop_name,
                    "category": crop_info.get("category", "unknown"),
                    "typical_yield_range": yield_range,
                    "season": crop.season,
                    "irrigation": crop.irrigation_type
                },
                "factors": {
                    "weather_impact": self._assess_weather_impact(weather, crop_info),
                    "soil_impact": self._assess_soil_impact(soil),
                    "irrigation_impact": self._assess_irrigation_impact(crop, weather)
                },
                "recommendations": self._generate_recommendations(
                    weather, soil, crop, location, ensemble_pred, crop_info
                ),
                "warnings": warnings if warnings else None
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {
                "success": False,
                "error": str(e),
                "prediction": None
            }
    
    def _assess_weather_impact(
        self, 
        weather: WeatherFeatures, 
        crop_info: Dict
    ) -> Dict:
        """Assess weather conditions impact on yield."""
        optimal_temp = crop_info.get("optimal_temp", (20, 30))
        optimal_rainfall = crop_info.get("optimal_rainfall", (500, 1000))
        
        temp_optimal = optimal_temp[0] <= weather.avg_temperature <= optimal_temp[1]
        rainfall_optimal = optimal_rainfall[0] <= weather.rainfall <= optimal_rainfall[1]
        
        temp_score = 1 - min(1, abs(weather.avg_temperature - np.mean(optimal_temp)) / 15)
        rainfall_score = 1 - min(1, abs(weather.rainfall - np.mean(optimal_rainfall)) / np.mean(optimal_rainfall))
        
        return {
            "temperature": {
                "value": weather.avg_temperature,
                "optimal_range": optimal_temp,
                "is_optimal": temp_optimal,
                "score": round(temp_score, 2)
            },
            "rainfall": {
                "value": weather.rainfall,
                "optimal_range": optimal_rainfall,
                "is_optimal": rainfall_optimal,
                "score": round(rainfall_score, 2)
            },
            "overall_score": round((temp_score + rainfall_score) / 2, 2)
        }
    
    def _assess_soil_impact(self, soil: SoilFeatures) -> Dict:
        """Assess soil conditions impact."""
        # pH score (optimal around 6.5)
        ph_score = 1 - min(1, abs(soil.ph - 6.5) / 3)
        
        # Nutrient score
        nutrient_score = min(1, (soil.nitrogen + soil.phosphorus + soil.potassium) / 300)
        
        return {
            "ph": {
                "value": soil.ph,
                "optimal_range": (6.0, 7.5),
                "score": round(ph_score, 2)
            },
            "nutrients": {
                "nitrogen": soil.nitrogen,
                "phosphorus": soil.phosphorus,
                "potassium": soil.potassium,
                "score": round(nutrient_score, 2)
            },
            "overall_score": round((ph_score + nutrient_score) / 2, 2)
        }
    
    def _assess_irrigation_impact(
        self, 
        crop: CropFeatures, 
        weather: WeatherFeatures
    ) -> Dict:
        """Assess irrigation impact."""
        efficiency_map = {
            "drip": 0.9, "sprinkler": 0.75, "tubewell": 0.6,
            "canal": 0.5, "flood": 0.4, "rainfed": 0.3
        }
        efficiency = efficiency_map.get(crop.irrigation_type.lower(), 0.5)
        
        # Assess if irrigation is adequate
        crop_info = get_crop_info(crop.crop_name)
        water_need = crop_info.get("water_requirement", "medium")
        
        adequacy_map = {
            "very_high": {"drip": "adequate", "sprinkler": "adequate", "rainfed": "insufficient"},
            "high": {"drip": "adequate", "sprinkler": "adequate", "rainfed": "marginal"},
            "medium": {"drip": "adequate", "sprinkler": "adequate", "rainfed": "adequate"},
            "low": {"drip": "adequate", "sprinkler": "adequate", "rainfed": "adequate"}
        }
        
        adequacy = adequacy_map.get(water_need, {}).get(
            crop.irrigation_type.lower(), "unknown"
        )
        
        return {
            "type": crop.irrigation_type,
            "efficiency": efficiency,
            "adequacy": adequacy,
            "water_requirement": water_need
        }
    
    def _generate_recommendations(
        self,
        weather: WeatherFeatures,
        soil: SoilFeatures,
        crop: CropFeatures,
        location: LocationFeatures,
        predicted_yield: float,
        crop_info: Dict
    ) -> List[Dict]:
        """Generate actionable recommendations."""
        recommendations = []
        
        # Temperature recommendations
        optimal_temp = crop_info.get("optimal_temp", (20, 30))
        if weather.avg_temperature < optimal_temp[0]:
            recommendations.append({
                "category": "temperature",
                "priority": "high",
                "issue": "Below optimal temperature",
                "suggestion": "Consider using mulching or row covers to retain heat"
            })
        elif weather.avg_temperature > optimal_temp[1]:
            recommendations.append({
                "category": "temperature",
                "priority": "high",
                "issue": "Above optimal temperature",
                "suggestion": "Increase irrigation frequency and consider shade netting"
            })
        
        # Soil pH recommendations
        if soil.ph < 5.5:
            recommendations.append({
                "category": "soil",
                "priority": "medium",
                "issue": "Acidic soil",
                "suggestion": "Apply lime to raise pH levels"
            })
        elif soil.ph > 8.0:
            recommendations.append({
                "category": "soil",
                "priority": "medium",
                "issue": "Alkaline soil",
                "suggestion": "Apply gypsum or sulfur to lower pH"
            })
        
        # Nutrient recommendations
        if soil.nitrogen < 30:
            recommendations.append({
                "category": "nutrients",
                "priority": "high",
                "issue": "Low nitrogen",
                "suggestion": "Apply urea or organic nitrogen sources"
            })
        if soil.phosphorus < 15:
            recommendations.append({
                "category": "nutrients",
                "priority": "medium",
                "issue": "Low phosphorus",
                "suggestion": "Apply DAP or SSP fertilizer"
            })
        if soil.potassium < 100:
            recommendations.append({
                "category": "nutrients",
                "priority": "medium",
                "issue": "Low potassium",
                "suggestion": "Apply MOP (Muriate of Potash)"
            })
        
        # Irrigation recommendations
        if crop.irrigation_type.lower() == "rainfed":
            water_need = crop_info.get("water_requirement", "medium")
            if water_need in ["high", "very_high"]:
                recommendations.append({
                    "category": "irrigation",
                    "priority": "high",
                    "issue": "High water crop with rainfed irrigation",
                    "suggestion": "Consider supplemental irrigation during dry spells"
                })
        
        # Yield improvement
        yield_range = crop_info.get("typical_yield_range", (1000, 5000))
        if predicted_yield < yield_range[0]:
            recommendations.append({
                "category": "general",
                "priority": "high",
                "issue": "Below average expected yield",
                "suggestion": "Review all input factors and consider soil testing"
            })
        
        return recommendations if recommendations else [{
            "category": "general",
            "priority": "low",
            "issue": None,
            "suggestion": "Current conditions are favorable. Maintain practices."
        }]
    
    def get_model_info(self) -> Dict:
        """Get model information."""
        return {
            "models": list(self.models.keys()),
            "weights": self.model_weights,
            "is_loaded": self.is_loaded,
            "supported_crops": list(CROP_INFO.keys()),
            "num_features": 30
        }


# Singleton instance
_model_instance: Optional[EnsembleYieldModel] = None


def get_model() -> EnsembleYieldModel:
    """Get or create model instance."""
    global _model_instance
    if _model_instance is None:
        _model_instance = EnsembleYieldModel()
    return _model_instance


def initialize_model() -> bool:
    """Initialize and load models."""
    model = get_model()
    return model.load()
