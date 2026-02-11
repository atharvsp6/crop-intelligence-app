# Force immediate deployment to Azure without waiting for GitHub Actions

Write-Host "Force Deploy to Azure using Zip Deploy" -ForegroundColor Green
Write-Host ""

$appName = "crop-intelligence-api"
$resourceGroup = "crop-intelligence-rg"
$publishProfile = "."

# Get publish profile (publish profile as XML)
Write-Host "Getting publish profile..." -ForegroundColor Yellow
$profile = az webapp deployment list-publishing-profiles --name $appName --resource-group $resourceGroup --xml --query "[0]"

if (-not $profile) {
    Write-Host "ERROR: Could not get publish profile. Try manual approach:" -ForegroundColor Red
    Write-Host ""
    Write-Host "Option 1: Wait 2-3 minutes and refresh browser" -ForegroundColor Cyan
    Write-Host "Option 2: Check GitHub Actions at: https://github.com/YOUR_USERNAME/crop-intelligence-app/actions" -ForegroundColor Cyan
    exit 1
}

# Create zip of backend folder
Write-Host ""
Write-Host "Creating zip file..." -ForegroundColor Yellow
$zipFile = "backend-deploy.zip"

if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory("$(Get-Location)\backend", $zipFile)

Write-Host "✓ Created: $zipFile ($(  (Get-Item $zipFile).Length / 1MB | [math]::Round({}, 2)) MB)" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "Deploying to Azure..." -ForegroundColor Yellow

try {
    az webapp deployment source config-zip --resource-group $resourceGroup --name $appName --src $zipFile
    
    Write-Host ""
    Write-Host "✓ Deployment initiated" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Waiting 20 seconds for app to restart..." -ForegroundColor Yellow
    Start-Sleep -Seconds 20

    Write-Host ""
    Write-Host "Testing endpoint..." -ForegroundColor Cyan
    & .\test-google-oauth.ps1
    
    Write-Host ""
    Write-Host "If still 404, wait another minute and refresh browser at:" -ForegroundColor Yellow
    Write-Host "https://crop-intelligence-app.vercel.app" -ForegroundColor Cyan
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
finally {
    # Cleanup
    if (Test-Path $zipFile) {
        Remove-Item $zipFile -Force
    }
}
