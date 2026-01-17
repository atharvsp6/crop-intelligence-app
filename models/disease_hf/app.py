"""
Hugging Face Plant Disease Detection Microservice
Optimized for Indian crops with lightweight model for 512MB RAM deployment
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoImageProcessor, AutoModelForImageClassification
import torch
from PIL import Image
import io
import base64
import os
import traceback
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ============================================================================
# MODEL CONFIGURATION - Lightweight model optimized for Indian crops
# ============================================================================
# Using linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification
# - Only 14M parameters (lightweight for 512MB RAM)
# - 99.48% accuracy on PlantVillage
# - Supports 38 plant-disease classes including Indian crops
# Alternative models to consider:
# - "nateraw/vit-base-beans" (beans diseases)
# - "susnato/detr-resnet-50-plant-disease-detection" (object detection, heavier)
# - "YuchengShi/LLaVA-v1.5-7B-Plant-Leaf-Diseases-Detection" (too heavy)

MODEL_ID = os.environ.get(
    "HF_MODEL_ID",
    "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
)

print(f"[Startup] Loading Hugging Face model: {MODEL_ID}")

try:
    processor = AutoImageProcessor.from_pretrained(MODEL_ID)
    model = AutoModelForImageClassification.from_pretrained(MODEL_ID)
    model.eval()  # Set to evaluation mode
    
    # Move to CPU (no GPU on Render free tier)
    device = torch.device("cpu")
    model = model.to(device)
    
    print(f"[Startup] ✓ Model loaded successfully on {device}")
    print(f"[Startup] Model classes: {len(model.config.id2label)} diseases")
    MODEL_LOADED = True
except Exception as e:
    print(f"[Startup] ✗ Failed to load model: {e}")
    traceback.print_exc()
    MODEL_LOADED = False
    processor = None
    model = None


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def decode_image(image_data):
    """Decode image from bytes, file upload, or base64 string."""
    if isinstance(image_data, bytes):
        return Image.open(io.BytesIO(image_data)).convert("RGB")
    
    if isinstance(image_data, str):
        # Handle base64 data URLs
        if image_data.startswith('data:image'):
            image_data = image_data.split(',', 1)[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # Handle file upload
    return Image.open(image_data).convert("RGB")


def map_to_indian_context(predictions):
    """
    Map PlantVillage classes to Indian agricultural context.
    Add Indian-specific recommendations and severity levels.
    """
    indian_crop_mapping = {
        # Rice diseases
        "Rice_Leaf_Blight": {"crop": "Rice", "severity": "high", "common_in_india": True},
        "Rice_Blast": {"crop": "Rice", "severity": "high", "common_in_india": True},
        "Rice_Brown_Spot": {"crop": "Rice", "severity": "medium", "common_in_india": True},
        
        # Wheat diseases
        "Wheat_Rust": {"crop": "Wheat", "severity": "high", "common_in_india": True},
        "Wheat_Leaf_Blight": {"crop": "Wheat", "severity": "medium", "common_in_india": True},
        
        # Tomato diseases (common in India)
        "Tomato_Bacterial_spot": {"crop": "Tomato", "severity": "medium", "common_in_india": True},
        "Tomato_Early_blight": {"crop": "Tomato", "severity": "medium", "common_in_india": True},
        "Tomato_Late_blight": {"crop": "Tomato", "severity": "high", "common_in_india": True},
        "Tomato_Leaf_Mold": {"crop": "Tomato", "severity": "low", "common_in_india": True},
        "Tomato_Septoria_leaf_spot": {"crop": "Tomato", "severity": "medium", "common_in_india": True},
        "Tomato_Spider_mites": {"crop": "Tomato", "severity": "medium", "common_in_india": True},
        "Tomato_Target_Spot": {"crop": "Tomato", "severity": "medium", "common_in_india": True},
        "Tomato_Yellow_Leaf_Curl_Virus": {"crop": "Tomato", "severity": "high", "common_in_india": True},
        "Tomato_mosaic_virus": {"crop": "Tomato", "severity": "high", "common_in_india": True},
        "Tomato_healthy": {"crop": "Tomato", "severity": "none", "common_in_india": True},
        
        # Potato diseases
        "Potato_Early_blight": {"crop": "Potato", "severity": "medium", "common_in_india": True},
        "Potato_Late_blight": {"crop": "Potato", "severity": "high", "common_in_india": True},
        "Potato_healthy": {"crop": "Potato", "severity": "none", "common_in_india": True},
        
        # Other crops
        "Corn_(maize)": {"crop": "Corn", "severity": "medium", "common_in_india": True},
        "Pepper": {"crop": "Pepper", "severity": "medium", "common_in_india": True},
    }
    
    enriched_predictions = []
    for pred in predictions:
        label = pred["label"]
        confidence = pred["confidence"]
        
        # Extract crop and disease from label
        parts = label.replace("___", "_").split("_")
        crop_type = parts[0] if parts else "Unknown"
        condition = "_".join(parts[1:]) if len(parts) > 1 else label
        
        # Get Indian context
        context = indian_crop_mapping.get(label, {
            "crop": crop_type,
            "severity": "medium",
            "common_in_india": False
        })
        
        enriched_predictions.append({
            "class": label,
            "plant_type": context["crop"],
            "condition": condition,
            "confidence": confidence,
            "severity": context["severity"],
            "is_healthy": "healthy" in label.lower(),
            "common_in_india": context.get("common_in_india", False)
        })
    
    return enriched_predictions


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for deployment monitoring."""
    return jsonify({
        "status": "healthy" if MODEL_LOADED else "degraded",
        "model_loaded": MODEL_LOADED,
        "model_id": MODEL_ID,
        "timestamp": datetime.utcnow().isoformat()
    })


@app.route('/predict', methods=['POST'])
def predict_disease():
    """
    Main prediction endpoint.
    
    Accepts:
    - multipart/form-data with 'image' file
    - application/json with base64 'image' field
    
    Returns:
    - success: bool
    - predictions: list of top predictions with Indian context
    - top_prediction: highest confidence prediction
    - recommendations: treatment suggestions
    """
    try:
        if not MODEL_LOADED:
            return jsonify({
                "success": False,
                "error": "Model not loaded. Please check server logs."
            }), 503
        
        # Extract image from request
        image_data = None
        
        if 'image' in request.files:
            image_data = request.files['image']
        else:
            data = request.get_json(silent=True) or {}
            image_data = data.get('image')
        
        if not image_data:
            return jsonify({
                "success": False,
                "error": "No image provided. Send as file upload or base64 in JSON."
            }), 400
        
        # Decode and preprocess image
        image = decode_image(image_data)
        
        # Run inference with no gradient tracking (saves memory)
        with torch.no_grad():
            inputs = processor(images=image, return_tensors="pt").to(device)
            outputs = model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        
        # Convert to list of predictions
        top_k = min(5, len(model.config.id2label))
        top_probs, top_indices = torch.topk(predictions[0], top_k)
        
        raw_predictions = [
            {
                "label": model.config.id2label[idx.item()],
                "confidence": prob.item()
            }
            for prob, idx in zip(top_probs, top_indices)
        ]
        
        # Enrich with Indian context
        enriched_predictions = map_to_indian_context(raw_predictions)
        
        # Top prediction
        top_pred = enriched_predictions[0]
        
        # Generate recommendations based on top prediction
        recommendations = generate_recommendations(top_pred)
        
        return jsonify({
            "success": True,
            "prediction": {
                "plant_type": top_pred["plant_type"],
                "condition": top_pred["condition"],
                "confidence": top_pred["confidence"],
                "is_healthy": top_pred["is_healthy"],
                "severity": top_pred["severity"]
            },
            "top_predictions": enriched_predictions[:3],
            "all_predictions": enriched_predictions,
            "recommendations": recommendations,
            "model_info": {
                "model_id": MODEL_ID,
                "framework": "huggingface-transformers"
            }
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"Prediction failed: {str(e)}"
        }), 500


def generate_recommendations(prediction):
    """Generate Indian-specific treatment recommendations."""
    is_healthy = prediction.get("is_healthy", False)
    severity = prediction.get("severity", "medium")
    crop = prediction.get("plant_type", "Plant")
    
    if is_healthy:
        return {
            "immediate_actions": [],
            "treatment_options": [],
            "preventive_measures": [
                f"Continue regular monitoring of {crop} plants",
                "Maintain proper spacing for air circulation",
                "Ensure adequate nutrition and water management",
                "Practice crop rotation in next season"
            ]
        }
    
    # Disease-specific recommendations for Indian context
    immediate_actions = [
        "Isolate affected plants to prevent spread",
        "Remove and destroy severely infected leaves/parts",
        "Improve field drainage if moisture is excessive"
    ]
    
    treatment_options = [
        "Apply recommended fungicide/pesticide for this disease",
        "Use bio-pesticides like neem oil or Trichoderma",
        "Consult local agricultural extension officer for treatment",
        "Consider organic treatments: copper sulfate, bordeaux mixture"
    ]
    
    preventive_measures = [
        "Use disease-resistant varieties in next planting",
        "Practice crop rotation with non-host crops",
        "Ensure proper plant spacing (avoid overcrowding)",
        "Apply balanced NPK fertilizer to boost plant immunity",
        "Monitor weather - increase vigilance during humid periods",
        "Clean farm equipment to prevent disease spread"
    ]
    
    if severity == "high":
        immediate_actions.insert(0, "⚠️ URGENT: This is a severe disease - consult agri-expert immediately")
    
    return {
        "immediate_actions": immediate_actions,
        "treatment_options": treatment_options,
        "preventive_measures": preventive_measures
    }


@app.route('/model-info', methods=['GET'])
def model_info():
    """Return information about the loaded model."""
    if not MODEL_LOADED:
        return jsonify({"error": "Model not loaded"}), 503
    
    return jsonify({
        "model_id": MODEL_ID,
        "framework": "huggingface-transformers",
        "num_classes": len(model.config.id2label),
        "supported_diseases": list(model.config.id2label.values()),
        "input_size": "224x224",
        "device": str(device),
        "optimized_for": "Indian crops - Rice, Wheat, Tomato, Potato, etc."
    })


# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    print(f"[Server] Starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
