# ========================================
# TEMPLE MANAGEMENT SYSTEM - ONE COMMAND START
# Development Environment with Docker
# ========================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " TEMPLE MANAGEMENT SYSTEM - STARTUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check Docker
Write-Host "[1/5] Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not found"
    }
    Write-Host "   ✓ Docker installed: $dockerVersion" -ForegroundColor Green
}
catch {
    Write-Host "   ✗ ERROR: Docker not found!" -ForegroundColor Red
    Write-Host "`n   Please install Docker Desktop:" -ForegroundColor Yellow
    Write-Host "   https://www.docker.com/products/docker-desktop`n" -ForegroundColor Cyan
    exit 1
}

# Check if Docker is running
Write-Host "[2/5] Checking if Docker is running..." -ForegroundColor Yellow
try {
    docker ps 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
    Write-Host "   ✓ Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "   ! Docker is not running" -ForegroundColor Yellow
    Write-Host "   Attempting to start Docker Desktop..." -ForegroundColor Gray
    
    # Try common Docker Desktop paths
    $dockerPaths = @(
        "C:\Program Files\Docker\Docker\Docker Desktop.exe",
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe"
    )
    
    $dockerStarted = $false
    foreach ($path in $dockerPaths) {
        if (Test-Path $path) {
            Start-Process $path -ErrorAction SilentlyContinue
            $dockerStarted = $true
            break
        }
    }
    
    if ($dockerStarted) {
        Write-Host "   Waiting for Docker to start (30 seconds)..." -ForegroundColor Gray
        Start-Sleep -Seconds 30
        
        # Check again
        try {
            docker ps 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✓ Docker started successfully" -ForegroundColor Green
            }
            else {
                throw "Docker failed to start"
            }
        }
        catch {
            Write-Host "   ✗ ERROR: Could not verify Docker is running" -ForegroundColor Red
            Write-Host "`n   Please:" -ForegroundColor Yellow
            Write-Host "   1. Open Docker Desktop manually" -ForegroundColor White
            Write-Host "   2. Wait for it to fully start (whale icon in system tray)" -ForegroundColor White
            Write-Host "   3. Run this script again`n" -ForegroundColor White
            exit 1
        }
    }
    else {
        Write-Host "   ✗ ERROR: Could not find Docker Desktop" -ForegroundColor Red
        Write-Host "`n   Please:" -ForegroundColor Yellow
        Write-Host "   1. Start Docker Desktop manually" -ForegroundColor White
        Write-Host "   2. Wait for it to fully start" -ForegroundColor White
        Write-Host "   3. Run this script again`n" -ForegroundColor White
        exit 1
    }
}

# Check for .env file (optional but informative)
Write-Host "[3/5] Checking configuration..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "   ✓ Custom .env file found (will be overridden by Docker)" -ForegroundColor Green
}
else {
    Write-Host "   ✓ Using Docker default configuration" -ForegroundColor Green
}

# Stop any existing containers to avoid conflicts
Write-Host "[4/5] Cleaning up old containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down -v 2>&1 | Out-Null
Write-Host "   ✓ Cleanup complete" -ForegroundColor Green

# Start all services
Write-Host "[5/5] Starting all services..." -ForegroundColor Yellow
Write-Host "   This will:" -ForegroundColor Gray
Write-Host "   • Start MongoDB (with health checks)" -ForegroundColor Gray
Write-Host "   • Start Redis (with health checks)" -ForegroundColor Gray
Write-Host "   • Start Backend API (after dependencies ready)" -ForegroundColor Gray
Write-Host "" 

docker-compose -f docker-compose.dev.yml up -d --build 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host " ✓ SUCCESS! SERVICES STARTING" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "Waiting for health checks (30 seconds)..." -ForegroundColor Yellow
    Write-Host "" 
    
    # Progress bar
    for ($i = 1; $i -le 30; $i++) {
        $percent = ($i / 30) * 100
        Write-Progress -Activity "Starting Services" -Status "$i/30 seconds" -PercentComplete $percent
        Start-Sleep -Seconds 1
    }
    Write-Progress -Activity "Starting Services" -Completed
    
    # Check container status
    Write-Host "`nChecking container status..." -ForegroundColor Cyan
    $containers = docker ps --filter "name=temple" --format "{{.Names}}: {{.Status}}"
    $containers | ForEach-Object {
        if ($_ -match "healthy") {
            Write-Host "   ✓ $_" -ForegroundColor Green
        }
        elseif ($_ -match "starting") {
            Write-Host "   ⧗ $_" -ForegroundColor Yellow
        }
        else {
            Write-Host "   • $_" -ForegroundColor White
        }
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " SYSTEM READY!" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "Service URLs:" -ForegroundColor White
    Write-Host "  • Backend API: " -NoNewline -ForegroundColor Gray
    Write-Host "http://localhost:5000" -ForegroundColor Cyan
    Write-Host "  • MongoDB:     " -NoNewline -ForegroundColor Gray
    Write-Host "mongodb://localhost:27017" -ForegroundColor Cyan
    Write-Host "  • Redis:       " -NoNewline -ForegroundColor Gray
    Write-Host "redis://localhost:6379" -ForegroundColor Cyan
    
    Write-Host "`nNext Steps:" -ForegroundColor White
    Write-Host "  1. Test system:  " -NoNewline -ForegroundColor Gray
    Write-Host ".\verify-system.ps1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  2. View logs:    " -NoNewline -ForegroundColor Gray
    Write-Host "docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  3. Stop system:  " -NoNewline -ForegroundColor Gray
    Write-Host ".\scripts\stop.ps1" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Need help? Check QUICK_START.md" -ForegroundColor Gray
    Write-Host ""
}
else {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host " ✗ ERROR: Failed to start services" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check if ports are in use:" -ForegroundColor White
    Write-Host "     netstat -ano | findstr :5000" -ForegroundColor Gray
    Write-Host "     netstat -ano | findst r :27017" -ForegroundColor Gray
    Write-Host "     netstat -ano | findstr :6379" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. View error logs:" -ForegroundColor White
    Write-Host "     docker-compose -f docker-compose.dev.yml logs" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Stop conflicting containers:" -ForegroundColor White
    Write-Host "     docker stop `$(docker ps -aq)" -ForegroundColor Gray
    Write-Host "     .\scripts\start.ps1" -ForegroundColor Gray
    Write-Host ""
    
    exit 1
}
