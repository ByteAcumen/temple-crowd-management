# START EVERYTHING - Temple Crowd Management System
# This script starts all services needed for development

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " Temple Crowd Management - Start All" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "[1/4] Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker is not installed!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Start MongoDB
Write-Host "[2/4] Starting MongoDB..." -ForegroundColor Yellow
$mongoRunning = docker ps --filter name=temple-mongo --format "{{.Names}}"
if ($mongoRunning) {
    Write-Host "MongoDB is already running" -ForegroundColor Green
} else {
    $mongoExists = docker ps -a --filter name=temple-mongo --format "{{.Names}}"
    if ($mongoExists) {
        Write-Host "Starting existing MongoDB container..." -ForegroundColor Gray
        docker start temple-mongo | Out-Null
    } else {
        Write-Host "Creating new MongoDB container..." -ForegroundColor Gray
        docker run -d --name temple-mongo -p 27017:27017 mongo:latest | Out-Null
    }
    Start-Sleep -Seconds 3
    Write-Host "MongoDB started on port 27017" -ForegroundColor Green
}
Write-Host ""

# Start Redis
Write-Host "[3/4] Starting Redis..." -ForegroundColor Yellow
$redisRunning = docker ps --filter name=temple-redis --format "{{.Names}}"
if ($redisRunning) {
    Write-Host "Redis is already running" -ForegroundColor Green
} else {
    $redisExists = docker ps -a --filter name=temple-redis --format "{{.Names}}"
    if ($redisExists) {
        Write-Host "Starting existing Redis container..." -ForegroundColor Gray
        docker start temple-redis | Out-Null
    } else {
        Write-Host "Creating new Redis container..." -ForegroundColor Gray
        docker run -d --name temple-redis -p 6379:6379 redis:alpine | Out-Null
    }
    Start-Sleep -Seconds 2
    Write-Host "Redis started on port 6379" -ForegroundColor Green
}
Write-Host ""

# Start Backend
Write-Host "[4/4] Starting Backend Server..." -ForegroundColor Yellow
Write-Host "Backend will run in a new terminal window" -ForegroundColor Gray
Write-Host ""

# Start backend in new window
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server' -ForegroundColor Cyan; Write-Host ''; node .\src\server.js"

Start-Sleep -Seconds 5

# Check if backend started
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000" -Method Get -TimeoutSec 5
    Write-Host "Backend started successfully!" -ForegroundColor Green
} catch {
    Write-Host "Backend is starting... (may take a few seconds)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " All Services Started!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services Running:" -ForegroundColor Green
Write-Host "   MongoDB:  http://localhost:27017" -ForegroundColor Gray
Write-Host "   Redis:    http://localhost:6379" -ForegroundColor Gray
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test the API:  .\test-api.ps1" -ForegroundColor Gray
Write-Host "   2. View docs:     http://localhost:5000/api/v1" -ForegroundColor Gray
Write-Host "   3. Stop all:      .\stop-all.ps1" -ForegroundColor Gray
Write-Host ""
