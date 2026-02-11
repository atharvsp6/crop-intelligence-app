# Simple Azure deployment script
Write-Host "Deploying backend to Azure..."

$ResourceGroup = "crop-intelligence-rg"
$AppName = "crop-intelligence-api"

# Create zip
Write-Host "Creating zip file..."
cd backend
if (Test-Path ..\backend-deploy.zip) { Remove-Item ..\backend-deploy.zip -Force }
Compress-Archive -Path * -DestinationPath ..\backend-deploy.zip -Force
cd ..

# Deploy
Write-Host "Deploying to Azure..."
az webapp deployment source config-zip --resource-group $ResourceGroup --name $AppName --src backend-deploy.zip

# Wait and restart
Write-Host "Waiting 90 seconds..."
Start-Sleep -Seconds 90
az webapp restart --name $AppName --resource-group $ResourceGroup
Write-Host "Waiting 45 seconds for warmup..."
Start-Sleep -Seconds 45

# Test
Write-Host "Testing endpoints..."
$url = "https://$AppName.azurewebsites.net/api/auth/google-login"
Write-Host "Testing: $url"
$statusCode = $null
try {
    Invoke-WebRequest -Uri $url -Method POST -Body '{"idToken":"test"}' -ContentType "application/json" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop | Out-Null
    Write-Host "Response: Success" -ForegroundColor Green
} catch {
    if ($_.Exception.Response -ne $null) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "Response: HTTP $statusCode" -ForegroundColor Cyan
    } else {
        Write-Host "Response: $($_)" -ForegroundColor Yellow
    }
}
