# Stop All Services Gracefully
# Ensures data is saved before shutdown
#
# USAGE:
# powershell -ExecutionPolicy Bypass -File .\stop.ps1

$ErrorActionPreference = "Continue"

function Write-Pass { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Yellow }

Write-Host "`n=== STOPPING TEMPLE CROWD MANAGEMENT ===" -ForegroundColor Cyan
Write-Host "Started at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# Graceful shutdown
Write-Info "Sending SIGTERM to containers (graceful shutdown)..."
docker-compose stop

Write-Info "Removing containers (data volumes preserved)..."
docker-compose down --remove-orphans

# Verify data volumes still exist
Write-Host "`nVerifying data volumes:" -ForegroundColor Cyan
$mongoVolume = docker volume inspect temple-mongo-data 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Pass "MongoDB data volume: PRESERVED"
}
else {
    Write-Info "MongoDB data volume not found (will be created on next start)"
}

$redisVolume = docker volume inspect temple-redis-data 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Pass "Redis data volume: PRESERVED"
}
else {
    Write-Info "Redis data volume not found (will be created on next start)"
}

Write-Host "`nAll services stopped gracefully!" -ForegroundColor Green
Write-Host "Your data is safe in Docker volumes." -ForegroundColor Gray
Write-Host "Run './start.ps1' to restart." -ForegroundColor Gray
