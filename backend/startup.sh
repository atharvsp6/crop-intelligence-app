#!/bin/bash
# Azure App Service startup script for Python Flask backend

# Set environment variables if not already set
export PYTHONUNBUFFERED=1
export PORT=${PORT:-8000}

# Ensure proper directory
cd /home/site/wwwroot

# Create necessary directories
mkdir -p .tfhub_cache
mkdir -p logs

# Run database migrations or setup if needed
# python -c "from database import init_db; init_db()" || true

# Start Gunicorn with optimized settings for Azure
gunicorn --bind=0.0.0.0:$PORT \
    --workers=2 \
    --threads=4 \
    --timeout=300 \
    --max-requests=1000 \
    --max-requests-jitter=100 \
    --worker-class=sync \
    --access-logfile=- \
    --error-logfile=- \
    --log-level=info \
    app:app
