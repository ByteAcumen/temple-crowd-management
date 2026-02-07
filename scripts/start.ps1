# Simple One-Command Start - Temple Management System
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " STARTING TEMPLE MANAGEMENT SYSTEM" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Clean up old containers
Write-Host "[1/2] Cleaning up old containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down 2>&1 | Out-Null
Write-Host "   Done!" -ForegroundColor Green

# Start all services
Write-Host "[2/2] Starting all services..." -ForegroundColor Yellow
Write-Host "   - MongoDB (with health checks)" -ForegroundColor Gray
Write-Host "   - Redis (with health checks)" -ForegroundColor Gray
Write-Host "   - Backend API`n" -ForegroundColor Gray

docker-compose -f docker-compose.dev.yml up -d --build

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " SERVICES STARTED!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Waiting for services to become healthy - about 30 seconds...`n" -ForegroundColor Yellow

# Simple wait
Start-Sleep -Seconds 30

# Show status
Write-Host "Container Status:" -ForegroundColor Cyan
docker ps --filter "name=temple" --format "  {{.Names}}: {{.Status}}"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " SYSTEM READY!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Service URLs:" -ForegroundColor White
Write-Host "  Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "  MongoDB: mongodb://localhost:27017" -ForegroundColor Cyan
Write-Host "  Redis:   redis://localhost:6379`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor White
Write-Host  "  1. Test: .\verify-system.ps1" -ForegroundColor Yellow
Write-Host "  2. Logs: docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor Yellow
Write-Host "  3. Stop: .\scripts\stop.ps1`n" -ForegroundColor Yellow
