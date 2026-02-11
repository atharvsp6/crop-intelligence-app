param([string]$Endpoint = "https://crop-intelligence-api.azurewebsites.net/api/auth/google-login")

Write-Host "Testing endpoint: $Endpoint"

$retries = 0
$maxRetries = 3

while ($retries -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri $Endpoint -Method POST `
            -ContentType "application/json" `
            -Body '{"idToken":"test.token.format"}' `
            -TimeoutSec 20 `
            -UseBasicParsing `
            -ErrorAction Stop
        
        Write-Host "SUCCESS: Status $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Cyan
        exit 0
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        $message = $_.Exception.Message
        
        if ($statusCode) {
            Write-Host "Response Status: $statusCode" -ForegroundColor Yellow
        }
        
        if ($statusCode -eq 400) {
            Write-Host "Got 400 Bad Request - endpoint is responding! (token validation issue)" -ForegroundColor Green
            Write-Host "Message: $message" -ForegroundColor Cyan
            exit 0
        }
        
        $retries++
        if ($retries -lt $maxRetries) {
            Write-Host "Timeout/Error: $message. Retrying in 10s..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
        }
    }
}

Write-Host "ERROR: Endpoint did not respond after $maxRetries attempts" -ForegroundColor Red
exit 1
