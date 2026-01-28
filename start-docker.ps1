# START WITH DOCKER COMPOSE - Complete Stack

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " Starting Complete Stack with Docker" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "[1/2] Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed!" -ForegroundColor Red
    Write-Host "   Please install Docker Desktop" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Start Docker Compose
Write-Host "[2/2] Starting all services with Docker Compose..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes on first run (building images)..." -ForegroundColor Gray
Write-Host ""

Set-Location $PSScriptRoot

try {
    docker-compose up -d
    Write-Host ""
    Write-Host "✅ All services started!" -ForegroundColor Green
    Write-Host ""
    
    # Wait for services
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Check services
    Write-Host ""
    Write-Host "📊 Service Status:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host " Services Running!" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 Access Points:" -ForegroundColor Green
    Write-Host "   • Backend API:    http://localhost:5000" -ForegroundColor Gray
    Write-Host "   • MongoDB:        mongodb://localhost:27017" -ForegroundColor Gray
    Write-Host "   • Redis:          redis://localhost:6380" -ForegroundColor Gray
    Write-Host "   • AI Service:     http://localhost:8002" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📝 Commands:" -ForegroundColor Yellow
    Write-Host "   • View logs:      docker-compose logs -f" -ForegroundColor Gray
    Write-Host "   • Stop all:       docker-compose down" -ForegroundColor Gray
    Write-Host "   • Restart:        docker-compose restart" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "❌ Failed to start services!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Try:" -ForegroundColor Yellow
    Write-Host "   1. Make sure Docker Desktop is running" -ForegroundColor Gray
    Write-Host "   2. Run: docker-compose down" -ForegroundColor Gray
    Write-Host "   3. Run this script again" -ForegroundColor Gray
    Write-Host ""
}
