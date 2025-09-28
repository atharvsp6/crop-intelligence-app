# Production Dockerfile for the Crop Intelligence backend
FROM python:3.11-slim

# Prevents Python from writing .pyc files and enables stdout/stderr flushing
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libglib2.0-0 \
        libsm6 \
        libxrender1 \
        libxext6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Expose the port used by Gunicorn / Cloud Run
ENV PORT=8080
EXPOSE 8080

# Default command for Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app_integrated:app"]
