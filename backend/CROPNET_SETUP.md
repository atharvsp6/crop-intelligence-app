# CropNet Disease Detection Setup

The disease detection feature uses Google's CropNet model for cassava leaf disease classification.

## Quick Setup

### 1. Download the Model (One-Time Setup)

Run the download script to fetch the model from TensorFlow Hub and save it locally:

```bash
# From backend directory
python download_cropnet_model.py
```

This will:
- Download the CropNet model (~200MB)
- Save it to `backend/cropnet_model/` folder
- Allow the app to load the model offline

### 2. Start the Backend

After the model is downloaded, start the backend normally:

```bash
python app_integrated.py
```

The model will be loaded automatically at startup from the local folder.

## Alternative: Deploy Separately

If you want to deploy the disease detection as a separate service:

### Option 1: Separate Model Server

1. **Download the model** on your model server:
   ```bash
   python download_cropnet_model.py
   ```

2. **Set environment variable** to point to the model location:
   ```bash
   export CROP_NET_MODEL_DIR=/path/to/cropnet_model
   ```

3. **Start the backend** - it will load from that location

### Option 2: Use TensorFlow Serving

1. **Download the model** using the script above

2. **Deploy with TensorFlow Serving**:
   ```bash
   docker run -p 8501:8501 \
     --mount type=bind,source=/path/to/cropnet_model,target=/models/cropnet \
     -e MODEL_NAME=cropnet \
     tensorflow/serving
   ```

3. **Update backend** to call the TF Serving endpoint instead of loading locally

## Supported Plant Types

Currently, the model only supports **Cassava** plants with these conditions:
- Cassava Bacterial Blight (CBB)
- Cassava Brown Streak Disease (CBSD)
- Cassava Green Mottle (CGM)
- Cassava Mosaic Disease (CMD)
- Healthy

## Troubleshooting

### "CropNet model is not loaded" Error

**Solution**: Run the download script first:
```bash
python download_cropnet_model.py
```

### Model Download Fails

**Common causes**:
- Network connection issues
- Insufficient disk space (~200MB needed)
- TensorFlow Hub access blocked

**Solution**: 
1. Check internet connection
2. Try downloading with a VPN if TF Hub is blocked
3. Ensure you have tensorflow>=2.15.0 and tensorflow-hub>=0.15.0 installed

### Memory Issues

The CropNet model requires ~200MB RAM when loaded. If running on limited memory:

1. **Enable DEMO_MODE** for testing without the model:
   ```bash
   export DEMO_MODE=true
   ```

2. **Deploy separately** to a dedicated service with more resources

## Model Information

- **Source**: TensorFlow Hub - Google CropNet
- **Model URL**: https://tfhub.dev/google/cropnet/classifier/cassava_leaf_disease_V1/3
- **Input Size**: 224x224 RGB images
- **Output**: 5-class classification (4 diseases + healthy)
- **Framework**: TensorFlow 2.x
