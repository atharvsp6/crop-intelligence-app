# Plant Disease Detection Microservice (Hugging Face)

Lightweight Flask microservice for plant disease detection optimized for Indian crops using Hugging Face transformers.

## Features

- **Lightweight Model**: MobileNetV2 (14M params) - fits in 512MB RAM
- **High Accuracy**: 99.48% on PlantVillage dataset
- **Indian Crops Support**: Rice, Wheat, Tomato, Potato, Corn, Pepper, and more
- **38 Disease Classes**: Covers major plant diseases common in India
- **Microservice Architecture**: Deploy independently from main app
- **REST API**: Simple HTTP endpoints for integration

## Model Information

**Default Model**: `linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification`

- Architecture: MobileNetV2
- Parameters: 14M (lightweight)
- Input Size: 224x224 RGB
- Classes: 38 plant-disease combinations
- Accuracy: 99.48%

### Supported Crops & Diseases

**Indian Staples**:
- **Rice**: Leaf Blight, Blast, Brown Spot
- **Wheat**: Rust, Leaf Blight
- **Potato**: Early Blight, Late Blight
- **Tomato**: Bacterial Spot, Early/Late Blight, Leaf Mold, Septoria, Mosaic Virus, etc.
- **Corn (Maize)**: Common Rust, Northern Leaf Blight, Cercospora
- **Pepper**: Bacterial Spot

## Quick Start

### Local Development

1. **Install Dependencies**:
   ```bash
   cd models/disease_hf
   pip install -r requirements.txt
   ```

2. **Run the Service**:
   ```bash
   python app.py
   ```
   Service starts on `http://localhost:5002`

3. **Test with cURL**:
   ```bash
   curl -X POST http://localhost:5002/predict \
     -F "image=@path/to/plant_image.jpg"
   ```

### Docker Deployment

```bash
docker build -t disease-hf-service .
docker run -p 5002:5002 disease-hf-service
```

## API Endpoints

### 1. Health Check
```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_id": "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
  "timestamp": "2026-01-12T00:30:00.000Z"
}
```

### 2. Predict Disease
```http
POST /predict
Content-Type: multipart/form-data
```

**Request (File Upload)**:
```bash
curl -X POST http://localhost:5002/predict \
  -F "image=@tomato_leaf.jpg"
```

**Request (JSON + Base64)**:
```bash
curl -X POST http://localhost:5002/predict \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,/9j/4AAQ..."}'
```

**Response**:
```json
{
  "success": true,
  "prediction": {
    "plant_type": "Tomato",
    "condition": "Late_blight",
    "confidence": 0.9823,
    "is_healthy": false,
    "severity": "high"
  },
  "top_predictions": [
    {
      "class": "Tomato_Late_blight",
      "plant_type": "Tomato",
      "condition": "Late_blight",
      "confidence": 0.9823,
      "severity": "high",
      "is_healthy": false,
      "common_in_india": true
    },
    {
      "class": "Tomato_Early_blight",
      "plant_type": "Tomato",
      "condition": "Early_blight",
      "confidence": 0.0145,
      "severity": "medium",
      "is_healthy": false,
      "common_in_india": true
    }
  ],
  "recommendations": {
    "immediate_actions": [
      "⚠️ URGENT: This is a severe disease - consult agri-expert immediately",
      "Isolate affected plants to prevent spread",
      "Remove and destroy severely infected leaves/parts"
    ],
    "treatment_options": [
      "Apply recommended fungicide for Late Blight",
      "Use bio-pesticides like neem oil or Trichoderma",
      "Consult local agricultural extension officer"
    ],
    "preventive_measures": [
      "Use disease-resistant varieties in next planting",
      "Practice crop rotation with non-host crops",
      "Monitor weather - increase vigilance during humid periods"
    ]
  }
}
```

### 3. Model Information
```http
GET /model-info
```

**Response**:
```json
{
  "model_id": "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
  "framework": "huggingface-transformers",
  "num_classes": 38,
  "supported_diseases": ["Tomato_Late_blight", "Rice_Blast", ...],
  "input_size": "224x224",
  "device": "cpu",
  "optimized_for": "Indian crops - Rice, Wheat, Tomato, Potato, etc."
}
```

## Deployment

### Render.com (Free Tier - 512MB RAM)

1. **Create New Web Service** on Render
2. **Connect Repository** and select `models/disease_hf` as root
3. **Configure**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn --workers 1 --threads 1 --timeout 120 app:app`
   - Environment: Python 3.11.9
4. **Deploy** - URL will be `https://your-service.onrender.com`

### Railway.app

1. **New Project** → Deploy from GitHub
2. **Root Directory**: `models/disease_hf`
3. **Auto-detects** Procfile and runtime.txt
4. **Deploy**

### Environment Variables (Optional)

- `HF_MODEL_ID`: Override default model (e.g., for experiments)
- `PORT`: Service port (auto-set by most platforms)

## Integration with Main App

Update `backend/app_integrated.py`:

```python
import requests
from flask import request, jsonify

# Service URL (update after deployment)
DISEASE_SERVICE_URL = os.environ.get(
    "DISEASE_SERVICE_URL",
    "http://localhost:5002/predict"  # Fallback to local
)

@app.route('/api/detect-disease', methods=['POST'])
@jwt_required()
def detect_plant_disease():
    """Proxy to HF disease detection microservice."""
    try:
        # Extract image from request
        if 'image' in request.files:
            image_file = request.files['image']
            files = {"image": (image_file.filename, image_file.read(), image_file.content_type)}
            response = requests.post(DISEASE_SERVICE_URL, files=files, timeout=30)
        else:
            # JSON + base64
            data = request.get_json()
            response = requests.post(DISEASE_SERVICE_URL, json=data, timeout=30)
        
        return jsonify(response.json()), response.status_code
    
    except requests.RequestException as e:
        return jsonify({
            "success": false,
            "error": f"Disease service unavailable: {str(e)}"
        }), 503
```

## Performance

- **Cold Start**: ~10-15s (model loading)
- **Inference**: ~200-500ms per image
- **Memory**: ~250-350MB (fits Render free tier)
- **Concurrent Requests**: 1 worker handles sequential requests

## Alternative Models

If you need different coverage, try these in `.env`:

```bash
# For beans diseases (smaller, 86M params)
HF_MODEL_ID=nateraw/vit-base-beans

# For object detection (heavier, 41M params)
HF_MODEL_ID=susnato/detr-resnet-50-plant-disease-detection
```

## Troubleshooting

### Model Download Fails
- **Issue**: Hugging Face downloads timeout
- **Solution**: Pre-download model locally and include in repo (not recommended for Git), or deploy with longer timeout

### Out of Memory (512MB limit)
- **Issue**: Model too large for Render free tier
- **Solution**: Switch to even smaller model or upgrade to paid tier

### Slow Inference
- **Issue**: >5s per prediction
- **Solution**: Using CPU is expected; GPU would be faster but not available on free tier

## License

This service uses models from Hugging Face Hub. Check individual model licenses:
- MobileNetV2 model: Apache 2.0

## Support

For issues specific to:
- **Model accuracy**: Try different HF models from `/models?search=plant+disease`
- **Deployment**: Check Render/Railway logs
- **Integration**: See main app documentation
