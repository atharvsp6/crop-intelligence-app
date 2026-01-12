"""
Disease Detection Model - EfficientNet-based architecture
Optimized for Indian crop diseases with PlantVillage + ICAR dataset compatibility
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import timm
import io
import logging
from typing import Tuple, List, Dict, Optional
from pathlib import Path
import numpy as np

from config import get_settings, DISEASE_CLASSES, get_treatment

settings = get_settings()
logger = logging.getLogger(__name__)


class DiseaseDetectionModel:
    """
    EfficientNet-based disease detection model.
    Uses transfer learning with ImageNet weights, fine-tuned for plant diseases.
    """
    
    def __init__(self):
        self.model: Optional[nn.Module] = None
        self.device = torch.device(settings.DEVICE)
        self.num_classes = len(DISEASE_CLASSES)
        self.is_loaded = False
        self._setup_transforms()
    
    def _setup_transforms(self):
        """Setup image preprocessing pipeline."""
        self.transform = transforms.Compose([
            transforms.Resize((settings.IMAGE_SIZE, settings.IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=settings.NORMALIZE_MEAN,
                std=settings.NORMALIZE_STD
            )
        ])
        
        # Augmentation for training (if needed)
        self.train_transform = transforms.Compose([
            transforms.Resize((settings.IMAGE_SIZE + 32, settings.IMAGE_SIZE + 32)),
            transforms.RandomCrop(settings.IMAGE_SIZE),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=settings.NORMALIZE_MEAN,
                std=settings.NORMALIZE_STD
            )
        ])
    
    def _create_model(self) -> nn.Module:
        """Create EfficientNet model with custom classifier."""
        # Use timm for efficient model creation
        model = timm.create_model(
            settings.MODEL_NAME,
            pretrained=settings.USE_PRETRAINED,
            num_classes=self.num_classes
        )
        return model
    
    def load(self) -> bool:
        """Load the model weights."""
        try:
            logger.info(f"Loading disease detection model: {settings.MODEL_NAME}")
            
            self.model = self._create_model()
            self.model.to(self.device)
            
            # Load custom weights if available
            weights_path = Path(settings.MODEL_WEIGHTS_PATH)
            if weights_path.exists():
                logger.info(f"Loading custom weights from {weights_path}")
                state_dict = torch.load(weights_path, map_location=self.device)
                self.model.load_state_dict(state_dict)
            else:
                logger.warning("Custom weights not found, using pretrained ImageNet weights")
                logger.info("Model will work but may need fine-tuning for best accuracy")
            
            self.model.eval()
            self.is_loaded = True
            
            # Warm up the model
            self._warmup()
            
            logger.info("Disease detection model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False
    
    def _warmup(self):
        """Warm up model with dummy inference."""
        try:
            dummy_input = torch.randn(1, 3, settings.IMAGE_SIZE, settings.IMAGE_SIZE)
            dummy_input = dummy_input.to(self.device)
            with torch.no_grad():
                _ = self.model(dummy_input)
            logger.info("Model warmup complete")
        except Exception as e:
            logger.warning(f"Warmup failed: {e}")
    
    def preprocess_image(self, image_bytes: bytes) -> torch.Tensor:
        """Preprocess image for inference."""
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = self.transform(image)
        return tensor.unsqueeze(0).to(self.device)
    
    def predict(self, image_bytes: bytes) -> Dict:
        """
        Run inference on an image.
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Dictionary containing predictions and metadata
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call load() first.")
        
        try:
            # Preprocess
            input_tensor = self.preprocess_image(image_bytes)
            
            # Inference
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = F.softmax(outputs, dim=1)
            
            # Get top-k predictions
            top_probs, top_indices = torch.topk(
                probabilities[0], 
                k=min(settings.TOP_K_PREDICTIONS, self.num_classes)
            )
            
            predictions = []
            for prob, idx in zip(top_probs.cpu().numpy(), top_indices.cpu().numpy()):
                disease_info = DISEASE_CLASSES.get(int(idx), {
                    "crop": "Unknown",
                    "disease": "Unknown",
                    "severity": "unknown"
                })
                
                predictions.append({
                    "class_id": int(idx),
                    "crop": disease_info["crop"],
                    "disease": disease_info["disease"],
                    "severity": disease_info["severity"],
                    "confidence": float(prob),
                    "confidence_percent": f"{float(prob) * 100:.2f}%"
                })
            
            # Primary prediction
            primary = predictions[0] if predictions else None
            
            # Build response
            result = {
                "success": True,
                "primary_prediction": primary,
                "all_predictions": predictions,
                "treatment": get_treatment(primary["disease"]) if primary else None,
                "model_info": {
                    "model_name": settings.MODEL_NAME,
                    "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
                    "is_above_threshold": primary["confidence"] >= settings.CONFIDENCE_THRESHOLD if primary else False
                }
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {
                "success": False,
                "error": str(e),
                "primary_prediction": None,
                "all_predictions": []
            }
    
    def get_model_info(self) -> Dict:
        """Get model information."""
        return {
            "model_name": settings.MODEL_NAME,
            "num_classes": self.num_classes,
            "input_size": settings.IMAGE_SIZE,
            "device": str(self.device),
            "is_loaded": self.is_loaded,
            "supported_crops": list(set(d["crop"] for d in DISEASE_CLASSES.values()))
        }


# Singleton instance
_model_instance: Optional[DiseaseDetectionModel] = None


def get_model() -> DiseaseDetectionModel:
    """Get or create the model instance."""
    global _model_instance
    if _model_instance is None:
        _model_instance = DiseaseDetectionModel()
    return _model_instance


def initialize_model() -> bool:
    """Initialize and load the model."""
    model = get_model()
    return model.load()
