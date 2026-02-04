# ========================================
# Temple Management System - Complete Automation Script
# One command to run everything!
# ========================================

param(
    [string]$Action = "all",  # all, start, test, stop, restart, clean
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

# Colors
function Write-Step { param([string]$msg) Write-Host "`n[$((Get-Date).ToString('HH:mm:ss'))] $msg" -ForegroundColor Cyan }
function Write-Success { param([string]$msg) Write-Host "`n✅ $msg" -ForegroundColor Green }
function Write-Error { param([string]$msg) Write-Host "`n❌ $msg" -ForegroundColor Red }
function Write-Info { param([string]$msg) Write-Host "   $msg" -ForegroundColor Gray }

# ==========================================
# Helper Functions
# ==========================================

function Test-DockerRunning {
    try {
        docker info 2>&1 | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Start-DockerDesktop {
    Write-Step "Starting Docker Desktop..."
    Start-Process "Docker Desktop" -ErrorAction SilentlyContinue
    
    $maxWait = 60
    $waited = 0
    while (-not (Test-DockerRunning) -and $waited -lt $maxWait) {
        Start-Sleep -Seconds 2
        $waited += 2
        Write-Host "." -NoNewline
    }
    
    if (Test-DockerRunning) {
        Write-Success "Docker is running"
        return $true
    }
    else {
        Write-Error "Docker failed to start"
        return $false
    }
}

function Wait-ForService {
    param(
        [string]$Url,
        [int]$MaxWaitSeconds = 60
    )
    
    $waited = 0
    while ($waited -lt $MaxWaitSeconds) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                return $true
            }
        }
        catch { }
        Start-Sleep -Seconds 2
        $waited += 2
        Write-Host "." -NoNewline
    }
    return $false
}

# ==========================================
# Action: Start Services
# ==========================================
function Start-Services {
    Write-Step "🚀 Starting Temple Management System"
    
    # Check Docker
    if (-not (Test-DockerRunning)) {
        if (-not (Start-DockerDesktop)) {
            Write-Error "Docker is not running and could not be started"
            return $false
        }
    }
    
    # Clean up old containers
    Write-Info "Cleaning up old containers..."
    docker-compose -f docker-compose.dev.yml down -v 2>&1 | Out-Null
    
    # Start services
    Write-Info "Starting MongoDB, Redis, and Backend..."
    docker-compose -f docker-compose.dev.yml up -d --build
    
    Write-Info "Waiting for services to be healthy..."
    if (Wait-ForService -Url "http://localhost:5000" -MaxWaitSeconds 60) {
        Write-Success "All services are running!"
        
        Write-Host "`n📍 Service URLs:" -ForegroundColor Yellow
        Write-Host "   Backend: http://localhost:5000" -ForegroundColor White
        Write-Host "   MongoDB: mongodb://localhost:27017" -ForegroundColor White
        Write-Host "   Redis:   redis://localhost:6379" -ForegroundColor White
        return $true
    }
    else {
        Write-Error "Services failed to start"
        return $false
    }
}

# ==========================================
# Action: Run Tests
# ==========================================
function Run-Tests {
    Write-Step "🧪 Running Comprehensive Tests"
    
    # Check if backend is running
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:5000" -UseBasicParsing
    }
    catch {
        Write-Error "Backend is not running! Run: .\scripts\automate.ps1 -Action start"
        return $false
    }
    
    # Run verification script
    Write-Info "Executing verify-system.ps1..."
    & .\verify-system.ps1
    
    return $LASTEXITCODE -eq 0
}

# ==========================================
# Action: Stop Services
# ==========================================
function Stop-Services {
    Write-Step "🛑 Stopping all services"
    docker-compose -f docker-compose.dev.yml down
    Write-Success "All services stopped"
}

# ==========================================
# Action: Clean Everything
# ==========================================
function Clean-All {
    Write-Step "🧹 Cleaning all containers and volumes"
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f 2>&1 | Out-Null
    Write-Success "Clean complete"
}

# ==========================================
# Action: Full Automation (start + test)
# ==========================================
function Run-Full {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " TEMPLE MANAGEMENT - FULL AUTOMATION" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    # Step 1: Start services
    if (-not (Start-Services)) {
        Write-Error "Failed to start services"
        return
    }
    
    # Step 2: Run tests
    Write-Host ""
    Run-Tests
    
    # Summary
    $duration = (Get-Date) - $startTime
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host " AUTOMATION COMPLETE" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Duration: $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor White
    Write-Host ""
}

# ==========================================
# Main Execution
# ==========================================
switch ($Action.ToLower()) {
    "start" { Start-Services }
    "test" { Run-Tests }
    "stop" { Stop-Services }
    "restart" { Stop-Services; Start-Sleep -Seconds 2; Start-Services }
    "clean" { Clean-All }
    "all" { Run-Full }
    default { 
        Write-Host "Usage: .\automate.ps1 -Action [all|start|test|stop|restart|clean]"
        Write-Host ""
        Write-Host "Actions:"
        Write-Host "  all     - Start services and run all tests (default)"
        Write-Host "  start   - Start all Docker services"
        Write-Host "  test    - Run verification tests"
        Write-Host "  stop    - Stop all services"
        Write-Host "  restart - Stop and start services"
        Write-Host "  clean   - Remove all containers and volumes"
    }
}
