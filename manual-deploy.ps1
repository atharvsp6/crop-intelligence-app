# Direct deployment to Azure when GitHub Actions is slow

Write-Host "Direct Deploy to Azure App Service" -ForegroundColor Green
Write-Host ""

# Check if Azure CLI is installed
$azExists = Get-Command az -ErrorAction SilentlyContinue
if (-not $azExists) {
    Write-Host "ERROR: Azure CLI not installed. Install from: https://aka.ms/azure-cli" -ForegroundColor Red
    exit 1
}

# Configuration
$resourceGroup = "crop-intelligence-rg"
$appName = "crop-intelligence-api"
$backendPath = "backend"

Write-Host "Preparing deployment..." -ForegroundColor Yellow
Write-Host "App Name: $appName" -ForegroundColor Cyan
Write-Host "Resource Group: $resourceGroup" -ForegroundColor Cyan
Write-Host ""

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
$deploymentPath = "$backendPath"

# Deploy using zip deploy
Write-Host "Uploading to Azure..." -ForegroundColor Yellow
Write-Host ""

try {
    # Deploy directly from backend folder
    az webapp up `
        --name $appName `
        --resource-group $resourceGroup `
        --runtime python:3.11 `
        --runtime-version 3.11 `
        --deployment-user-name $env:USERNAME `
        --plan crop-intelligence-plan 2>&1 | Select-String "Creating" -ErrorAction SilentlyContinue

    Write-Host "✓ Deployment started" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Waiting for app to restart..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10

    Write-Host ""
    Write-Host "Restarting app service to activate changes..." -ForegroundColor Yellow
    az webapp restart --name $appName --resource-group $resourceGroup

    Write-Host ""
    Write-Host "✓ Deployment complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testing endpoint in 15 seconds..." -ForegroundColor Cyan
    Start-Sleep -Seconds 15

    Write-Host ""
    & .\test-google-oauth.ps1

}
catch {
    Write-Host "❌ Error during deployment: $_" -ForegroundColor Red
}
