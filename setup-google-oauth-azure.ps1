# Setup Google OAuth on Azure App Service
# Run this script to add the Google Client ID to your Azure App Service

param(
    [Parameter(Mandatory=$true)]
    [string]$GoogleClientId,
    
    [string]$ResourceGroup = "crop-intelligence-rg",
    [string]$AppServiceName = "crop-intelligence-api"
)

Write-Host "Setting up Google OAuth for Azure App Service..." -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Cyan
Write-Host "App Service: $AppServiceName" -ForegroundColor Cyan
Write-Host "Google Client ID: $($GoogleClientId.Substring(0, 10))..." -ForegroundColor Cyan
Write-Host ""

try {
    # Add the environment variable
    Write-Host "Adding GOOGLE_CLIENT_ID to App Service configuration..." -ForegroundColor Yellow
    az webapp config appsettings set `
        --resource-group $ResourceGroup `
        --name $AppServiceName `
        --settings GOOGLE_CLIENT_ID=$GoogleClientId
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully set GOOGLE_CLIENT_ID" -ForegroundColor Green
        Write-Host ""
        Write-Host "The App Service will restart automatically." -ForegroundColor Cyan
        Write-Host "Waiting for 30 seconds for it to restart..." -ForegroundColor Cyan
        Start-Sleep -Seconds 30
        
        Write-Host ""
        Write-Host "✓ Setup complete! Google OAuth should now work on your production app." -ForegroundColor Green
        Write-Host ""
        Write-Host "Test by visiting: https://crop-intelligence-app.vercel.app" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Failed to set GOOGLE_CLIENT_ID" -ForegroundColor Red
        Write-Host "Please check your Azure credentials and resource group/app service name." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
