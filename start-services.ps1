# Crop Intelligence Platform - Service Startup Script
# Run this script to start all services

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Crop Intelligence Platform Launcher" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$baseDir = "c:\Users\athar\OneDrive\Desktop\crop-intelligence-app"

# Start Disease Detection Service
Write-Host "[1/3] Starting Disease Detection Service (Port 8001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\ai-services\disease-detection-service'; .\venv\Scripts\Activate.ps1; python -m uvicorn main:app --host 0.0.0.0 --port 8001"

Start-Sleep -Seconds 3

# Start Crop Yield Service
Write-Host "[2/3] Starting Crop Yield Service (Port 8002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\ai-services\crop-yield-service'; .\venv\Scripts\Activate.ps1; python -m uvicorn main:app --host 0.0.0.0 --port 8002"

Start-Sleep -Seconds 3

# Start Main Backend
Write-Host "[3/3] Starting Main Backend API (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\backend-fastapi'; .\venv\Scripts\Activate.ps1; python -m uvicorn main:app --host 0.0.0.0 --port 8000"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  All Services Starting!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Wait 20-30 seconds for models to load, then access:" -ForegroundColor White
Write-Host ""
Write-Host "  API Docs:     http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  Health:       http://localhost:8000/health" -ForegroundColor Cyan
Write-Host "  Disease AI:   http://localhost:8001/docs" -ForegroundColor Cyan
Write-Host "  Yield AI:     http://localhost:8002/docs" -ForegroundColor Cyan
Write-Host ""
