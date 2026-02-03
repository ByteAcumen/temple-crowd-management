# Quick Temple Test Script
# Simplified version without Docker

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " Temple Management - Quick Test" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api/v1"

# Start backend manually first
Write-Host "Make sure backend is running:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor Gray
Write-Host "  node src\server.js" -ForegroundColor Gray
Write-Host ""

Write-Host "Press Enter when backend is ready..." -ForegroundColor Yellow
Read-Host

# Test Health
Write-Host "[TEST] Backend Health..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000" -Method Get
    Write-Host "✅ Backend is running!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backend not responding. Start it first!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Backend is ready! Run full tests with:" -ForegroundColor Green
Write-Host "  .\test-temples.ps1" -ForegroundColor Gray
