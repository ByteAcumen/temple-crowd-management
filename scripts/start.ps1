# ========================================
# TEMPLE MANAGEMENT SYSTEM - ONE COMMAND START
# Development Environment with Docker
# ========================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " TEMPLE MANAGEMENT SYSTEM - STARTUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check Docker
Write-Host "[1/4] Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   Docker installed: $dockerVersion" -ForegroundColor Green
}
catch {
    Write-Host "   ERROR: Docker not found!" -ForegroundColor Red
    Write-Host "   Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
Write-Host "[2/4] Checking if Docker is running..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "   Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "   Docker is not running. Starting Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
    Write-Host "   Waiting for Docker to start (30 seconds)..." -ForegroundColor Gray
    Start-Sleep -Seconds 30
    
    # Check again
    try {
        docker ps | Out-Null
        Write-Host "   Docker started successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "   ERROR: Could not start Docker" -ForegroundColor Red
        Write-Host "   Please start Docker Desktop manually and run this script again" -ForegroundColor Yellow
        exit 1
    }
}

# Stop any existing containers
Write-Host "[3/4] Cleaning up old containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down -v 2>$null
Write-Host "   Cleanup complete" -ForegroundColor Green

# Start all services
Write-Host "[4/4] Starting all services..." -ForegroundColor Yellow
Write-Host "   This will:" -ForegroundColor Gray
Write-Host "   - Start MongoDB (with health checks)" -ForegroundColor Gray
Write-Host "   - Start Redis (with health checks)" -ForegroundColor Gray
Write-Host "   - Start Backend API (after DB ready)" -ForegroundColor Gray
Write-Host "" 

docker-compose -f docker-compose.dev.yml up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host " SUCCESS! SERVICES STARTED" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "Waiting for health checks (30 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    Write-Host "`nService URLs:" -ForegroundColor Cyan
    Write-Host "  Backend API: http://localhost:5000" -ForegroundColor White
    Write-Host "  MongoDB: mongodb://localhost:27017" -ForegroundColor White
    Write-Host "  Redis: redis://localhost:6379" -ForegroundColor White
    
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "  1. Test system:" -ForegroundColor White
    Write-Host "     .\verify-system.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. View logs:" -ForegroundColor White
    Write-Host "     docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Stop services:" -ForegroundColor White
    Write-Host "     .\scripts\stop.ps1" -ForegroundColor Gray
    Write-Host ""
}
else {
    Write-Host "`nERROR: Failed to start services" -ForegroundColor Red
    Write-Host "Run 'docker-compose -f docker-compose.dev.yml logs' to see errors" -ForegroundColor Yellow
    exit 1
}
