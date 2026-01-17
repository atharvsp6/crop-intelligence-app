#!/usr/bin/env python3
"""
Download CropNet model from TensorFlow Hub and save it locally as a SavedModel.
Run this once to prepare the model for offline use.

Usage:
    python download_cropnet_model.py
"""

import os
import sys
import tensorflow as tf
import tensorflow_hub as hub

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_URL = "https://tfhub.dev/google/cropnet/classifier/cassava_leaf_disease_V1/3"
OUTPUT_DIR = os.path.join(CURRENT_DIR, "cropnet_model")


def download_and_save_model():
    """Download CropNet from TF Hub and save as a local SavedModel."""
    print(f"[Download] Downloading CropNet model from {MODEL_URL} ...")
    print("[Download] This may take a few minutes on first run...")
    
    try:
        # Load the model from TensorFlow Hub
        model = hub.load(MODEL_URL)
        print("[Download] Model loaded from TF Hub successfully")
        
        # Create output directory if it doesn't exist
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        # Save as a SavedModel
        print(f"[Download] Saving model to {OUTPUT_DIR} ...")
        tf.saved_model.save(model, OUTPUT_DIR)
        print(f"[Download] ✓ Model saved successfully to {OUTPUT_DIR}")
        print(f"[Download] You can now start the backend - it will load from this local folder")
        
        return True
        
    except Exception as e:
        print(f"[Download] ✗ Failed to download/save model: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("CropNet Model Downloader")
    print("=" * 60)
    
    if os.path.isdir(OUTPUT_DIR) and os.listdir(OUTPUT_DIR):
        print(f"[Download] Model folder already exists at {OUTPUT_DIR}")
        response = input("Do you want to re-download? (y/N): ").strip().lower()
        if response != 'y':
            print("[Download] Skipping download. Existing model will be used.")
            sys.exit(0)
    
    success = download_and_save_model()
    sys.exit(0 if success else 1)
