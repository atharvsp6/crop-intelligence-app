param(
    [string]$ResourceGroup = "crop-intelligence-rg",
    [string]$AppName = "crop-intelligence-api"
)

Write-Host "=== Azure Flask App Deployment ===" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroup"
Write-Host "App Name: $AppName"
Write-Host ""

# Step 1: Prepare zip
Write-Host "Step 1: Creating deployment package..." -ForegroundColor Yellow
Push-Location backend
if (Test-Path ..\backend-deploy.zip) {
    Remove-Item ..\backend-deploy.zip -Force
}
Compress-Archive -Path * -DestinationPath ..\backend-deploy.zip -Force
Pop-Location
Write-Host "✓ Zip file created successfully" -ForegroundColor Green

# Step 2: Deploy
Write-Host ""
Write-Host "Step 2: Deploying to Azure..." -ForegroundColor Yellow
$zipPath = "$pwd\backend-deploy.zip"
$deployOutput = az webapp deployment source config-zip --resource-group $ResourceGroup --name $AppName --src $zipPath 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Deployment initiated successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Deployment failed:" -ForegroundColor Red
    Write-Host $deployOutput
    exit 1
}

# Step 3: Wait for deployment
Write-Host ""
Write-Host "Step 3: Waiting for deployment (120 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 120

# Step 4: Restart app
Write-Host ""
Write-Host "Step 4: Restarting app service..." -ForegroundColor Yellow
az webapp restart --name $AppName --resource-group $ResourceGroup
Write-Host "✓ App restart initiated" -ForegroundColor Green

# Step 5: Wait for warmup
Write-Host ""
Write-Host "Step 5: Waiting for app to warm up..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Step 6: Test
Write-Host ""
Write-Host "Step 6: Testing endpoints..." -ForegroundColor Yellow

$baseUrl = "https://$AppName.azurewebsites.net"
$endpoints = @(
    @{url = "$baseUrl/"; name = "Root" },
    @{url = "$baseUrl/api/auth/google-login"; name = "Google Login (should respond)" }
)

foreach ($test in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $test.url -Method POST -ContentType "application/json" -Body '{"idToken":"test"}' -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Write-Host "OK: $($test.name): Status $($response.StatusCode)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if ($statusCode -eq 400) {
            Write-Host "OK: $($test.name): Status 400 - endpoint responding" -ForegroundColor Green
        } elseif ($statusCode) {
            Write-Host "WARN: $($test.name): Status $statusCode" -ForegroundColor Yellow
        } else {
            Write-Host "ERROR: $($test.name): Connection failed" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host "App URL: $baseUrl"
