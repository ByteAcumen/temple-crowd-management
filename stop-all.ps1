# STOP ALL SERVICES - Temple Crowd Management System

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " Stopping All Services" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Stop Backend
Write-Host "[1/3] Stopping Backend..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "✅ Backend stopped" -ForegroundColor Green
Write-Host ""

# Stop Redis
Write-Host "[2/3] Stopping Redis..." -ForegroundColor Yellow
docker stop temple-redis 2>$null | Out-Null
Write-Host "✅ Redis stopped" -ForegroundColor Green
Write-Host ""

# Stop MongoDB
Write-Host "[3/3] Stopping MongoDB..." -ForegroundColor Yellow
docker stop temple-mongo 2>$null | Out-Null
Write-Host "✅ MongoDB stopped" -ForegroundColor Green
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " All Services Stopped!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
