"""
Test script for the disease detection microservice
"""

import requests
import base64
import json
from pathlib import Path

# Service URL (update based on deployment)
SERVICE_URL = "http://localhost:5002"

def test_health():
    """Test health check endpoint."""
    print("Testing /health endpoint...")
    response = requests.get(f"{SERVICE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def test_model_info():
    """Test model info endpoint."""
    print("Testing /model-info endpoint...")
    response = requests.get(f"{SERVICE_URL}/model-info")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Model: {data['model_id']}")
        print(f"Classes: {data['num_classes']}")
        print(f"Diseases (first 5): {data['supported_diseases'][:5]}\n")

def test_predict_with_file(image_path):
    """Test prediction with file upload."""
    print(f"Testing /predict with file: {image_path}")
    
    if not Path(image_path).exists():
        print(f"⚠️  Image file not found: {image_path}\n")
        return
    
    with open(image_path, 'rb') as f:
        files = {"image": f}
        response = requests.post(f"{SERVICE_URL}/predict", files=files)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Success: {data['success']}")
        if data['success']:
            pred = data['prediction']
            print(f"Plant: {pred['plant_type']}")
            print(f"Condition: {pred['condition']}")
            print(f"Confidence: {pred['confidence']:.2%}")
            print(f"Healthy: {pred['is_healthy']}")
            print(f"Severity: {pred['severity']}")
            print(f"\nTop 3 Predictions:")
            for p in data['top_predictions'][:3]:
                print(f"  - {p['plant_type']}: {p['condition']} ({p['confidence']:.2%})")
    else:
        print(f"Error: {response.text}\n")

def test_predict_with_base64(image_path):
    """Test prediction with base64 JSON."""
    print(f"Testing /predict with base64 JSON")
    
    if not Path(image_path).exists():
        print(f"⚠️  Image file not found: {image_path}\n")
        return
    
    # Encode image to base64
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
        data_url = f"data:image/jpeg;base64,{image_data}"
    
    payload = {"image": data_url}
    response = requests.post(
        f"{SERVICE_URL}/predict",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Success: {data['success']}")
        if data['success']:
            pred = data['prediction']
            print(f"Detected: {pred['plant_type']} - {pred['condition']}")
    else:
        print(f"Error: {response.text}\n")

if __name__ == "__main__":
    print("=" * 60)
    print("Disease Detection Microservice Test Suite")
    print("=" * 60)
    print()
    
    # Test health
    try:
        test_health()
    except Exception as e:
        print(f"❌ Health check failed: {e}\n")
    
    # Test model info
    try:
        test_model_info()
    except Exception as e:
        print(f"❌ Model info failed: {e}\n")
    
    # Test prediction (replace with actual test image path)
    test_image = "test_image.jpg"
    
    if Path(test_image).exists():
        try:
            test_predict_with_file(test_image)
        except Exception as e:
            print(f"❌ File prediction failed: {e}\n")
        
        try:
            test_predict_with_base64(test_image)
        except Exception as e:
            print(f"❌ Base64 prediction failed: {e}\n")
    else:
        print(f"💡 To test predictions, place a test image at '{test_image}'")
    
    print("=" * 60)
    print("Tests completed")
    print("=" * 60)
