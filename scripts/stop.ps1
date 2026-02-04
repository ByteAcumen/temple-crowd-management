# ========================================
# TEMPLE MANAGEMENT SYSTEM - STOP SERVICES
# ========================================

Write-Host "`nStopping Temple Management System..." -ForegroundColor Yellow

# Stop Docker services
docker-compose -f docker-compose.dev.yml down -v

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nAll services stopped successfully!" -ForegroundColor Green
    Write-Host "Containers removed and volumes cleaned." -ForegroundColor Gray
}
else {
    Write-Host "`nERROR: Failed to stop some services" -ForegroundColor Red
    Write-Host "Try: docker-compose -f docker-compose.dev.yml down --remove-orphans" -ForegroundColor Yellow
}
