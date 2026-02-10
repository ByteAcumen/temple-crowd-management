$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n---> $Message" -ForegroundColor Cyan
}

function Write-Error-Exit {
    param([string]$Message)
    Write-Host "FAIL: $Message" -ForegroundColor Red
    exit 1
}

# Run Verification Suite
Write-Step "Running System Verification Test..."
Start-Sleep -Seconds 2 # Small buffer

try {
    ./verify-system.ps1
}
catch {
    Write-Error-Exit "Verification script failed unexpectedly: $_"
}
