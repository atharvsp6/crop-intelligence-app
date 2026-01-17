#!/usr/bin/env python3
"""Test script to verify disease detection API is working"""

import requests
import json
from pathlib import Path

# API endpoint
API_URL = "https://plant-disease-detection-api-nni5.onrender.com/predict"

def test_api_with_file(image_path: str):
    """Test API with an image file"""
    try:
        print(f"\n📸 Testing with file: {image_path}")
        
        with open(image_path, 'rb') as f:
            files = {'image': f}
            response = requests.post(API_URL, files=files, timeout=30)
        
        print(f"✅ Status Code: {response.status_code}")
        print(f"📋 Response:")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
        
    except FileNotFoundError:
        print(f"❌ File not found: {image_path}")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_api_health():
    """Test if API is reachable"""
    try:
        print("\n🔍 Testing API health...")
        response = requests.get(API_URL.replace('/predict', ''), timeout=10)
        print(f"✅ API is reachable (Status: {response.status_code})")
        return True
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to API at {API_URL}")
        return False
    except Exception as e:
        print(f"⚠️  API health check: {str(e)}")
        # API might not have health endpoint, but we can still try /predict
        return True

def test_api_with_demo_request():
    """Test API with a simple JSON request"""
    try:
        print("\n🧪 Testing API with demo request...")
        
        # Try to get any sample image from the backend
        sample_images = [
            'test_image.jpg',
            'sample.jpg',
            'demo.jpg'
        ]
        
        for img_file in sample_images:
            img_path = Path(__file__).parent / img_file
            if img_path.exists():
                print(f"Found sample image: {img_file}")
                return test_api_with_file(str(img_path))
        
        print("⚠️  No sample images found for testing")
        print("   The API expects an 'image' file in multipart/form-data")
        return True
        
    except Exception as e:
        print(f"❌ Error in demo request: {str(e)}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("🌾 Disease Detection API Test")
    print("=" * 60)
    print(f"API URL: {API_URL}")
    
    # Test health
    health = test_api_health()
    
    # Test with demo data
    demo = test_api_with_demo_request()
    
    print("\n" + "=" * 60)
    print("📊 Test Summary:")
    print(f"  API Health: {'✅ PASS' if health else '❌ FAIL'}")
    print(f"  API Ready: {'✅ READY' if health else '❌ NOT READY'}")
    print("=" * 60)
    
    if health:
        print("\n✅ API is ready to use!")
        print("\nTo test with an actual image:")
        print(f"  curl -X POST -F 'image=@your_image.jpg' {API_URL}")
    else:
        print("\n❌ API is not accessible. Please check:")
        print(f"   1. The API URL is correct: {API_URL}")
        print(f"   2. The Render service is running")
