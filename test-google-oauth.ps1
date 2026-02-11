# Test Google OAuth endpoint deployment

Write-Host "Testing Google OAuth API Endpoint..." -ForegroundColor Green
Write-Host ""

$testUrl = "https://crop-intelligence-api.azurewebsites.net/api/auth/google-login"

Write-Host "Testing: $testUrl" -ForegroundColor Cyan

$statusCode = $null
try {
    $response = Invoke-WebRequest -Uri $testUrl -Method POST -ContentType "application/json" -Body '{"idToken":"test"}' -TimeoutSec 10
    $statusCode = $response.StatusCode
    Write-Host "Endpoint responded: $statusCode" -ForegroundColor Green
}
catch {
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        Write-Host "Endpoint returned: $statusCode" -ForegroundColor Yellow
    } else {
        Write-Host "Error: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

if ($statusCode -eq 404) {
    Write-Host "NOT DEPLOYED YET - Endpoint returned 404" -ForegroundColor Red
    Write-Host ""
    Write-Host "Wait a few minutes for GitHub Actions to deploy..." -ForegroundColor Yellow
}
elseif ($statusCode -eq 400 -or $statusCode -eq 401) {
    Write-Host "SUCCESS - Endpoint is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Clear cache and refresh https://crop-intelligence-app.vercel.app" -ForegroundColor Cyan
}
else {
    Write-Host "Status: $statusCode" -ForegroundColor Yellow
}
