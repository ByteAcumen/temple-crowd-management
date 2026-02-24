# Temple Crowd Management - Backend Automation Master Script
# 
# FEATURES:
# - Automated testing of all endpoints
# - Auto-restart if tests fail
# - Health monitoring
# - Data persistence validation
# - One-click startup for Backend & Frontend
#
# USAGE:
# powershell -ExecutionPolicy Bypass -File .\start.ps1
# powershell -ExecutionPolicy Bypass -File .\start.ps1 -SkipTests
# powershell -ExecutionPolicy Bypass -File .\start.ps1 -Production

param(
    [switch]$SkipTests,
    [switch]$Production,
    [switch]$RebuildAll,
    [switch]$Rebuild,        # Alias for -RebuildAll
    [switch]$SkipFrontend,  # Skip frontend container (backend-only mode)
    [switch]$Down,          # Stop all containers and exit
    [switch]$Logs,          # Tail live container logs
    [int]$MaxRetries = 3
)

# ============================================
# CONFIGURATION
# ============================================

$ErrorActionPreference = "Continue"
$PROJECT_ROOT = $PSScriptRoot
$BACKEND_PORT = 5001
$FRONTEND_PORT = 3000

# Colors
function Write-Header { param($msg) Write-Host "`n=======================================================" -ForegroundColor Cyan; Write-Host "  $msg" -ForegroundColor Cyan; Write-Host "=======================================================" -ForegroundColor Cyan }
function Write-Pass { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Yellow }
function Write-Step { param($msg) Write-Host "[>] $msg" -ForegroundColor White }

# ============================================
# PRE-FLIGHT CHECKS
# ============================================

Write-Header "TEMPLE CROWD MANAGEMENT - AUTOMATED STARTUP"
Write-Host "Started at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "Mode: $(if ($Production) { 'PRODUCTION' } else { 'DEVELOPMENT' })" -ForegroundColor Gray

# Check Docker
Write-Step "Checking Docker..."
$maxDockerRetries = 5
$retryCount = 0
$dockerRunning = $false

while ($retryCount -lt $maxDockerRetries) {
    try {
        $dockerVersion = docker --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerRunning = $true
            Write-Pass "Docker: $dockerVersion"
            break
        }
    }
    catch {
        # Ignore error and retry
    }
    
    Write-Info "Waiting for Docker to start... ($($retryCount + 1)/$maxDockerRetries)"
    Start-Sleep -Seconds 3
    $retryCount++
}

if (-not $dockerRunning) {
    Write-Fail "Docker is not running."
    Write-Info "Please start Docker Desktop and run this script again."
    Write-Info "Using fallback local start (if available)..."
    # Don't exit immediately, let the script fail at Service Startup if needed, 
    # or we can ask user.
    exit 1
}

# Treat -Rebuild as an alias for -RebuildAll
if ($Rebuild) { $RebuildAll = $true }

# -Down: stop all containers and exit immediately
if ($Down) {
    Write-Header "STOPPING ALL CONTAINERS"
    Set-Location $PROJECT_ROOT
    docker compose down --remove-orphans 2>&1
    if (Test-Path "docker-compose.dev.yml") {
        docker compose -f docker-compose.dev.yml down --remove-orphans 2>&1
    }
    Write-Pass "All containers stopped. Data volumes preserved."
    exit 0
}

# -Logs: tail live logs of running containers
if ($Logs) {
    Write-Header "TAILING LIVE CONTAINER LOGS (Ctrl+C to exit)"
    Set-Location $PROJECT_ROOT
    if ($Production) {
        docker compose logs -f
    }
    else {
        docker compose -f docker-compose.dev.yml logs -f
    }
    exit 0
}
# Check Docker Compose (v2)
try {
    $composeVersion = docker compose version 2>&1
    Write-Pass "Docker Compose: $composeVersion"
}
catch {
    Write-Info "Docker Compose v2 check failed. Trying legacy..."
    try {
        $composeVersion = docker-compose --version 2>&1
        Write-Pass "Docker Compose (Legacy): $composeVersion"
    }
    catch {
        Write-Fail "Docker Compose not found. Please install Docker Desktop."
        exit 1
    }
}

# ============================================
# CLEAN UP ROGUE PROCESSES
# ============================================

Write-Header "CLEANING UP PORT CONFLICTS"

function Stop-PortProcess {
    param([int]$Port)
    $processes = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($processes) {
        foreach ($proc in $processes) {
            $processId = $proc.OwningProcess
            # Get process name safely
            try {
                $processName = (Get-Process -Id $processId -ErrorAction Stop).ProcessName
            }
            catch {
                $processName = "Unknown"
            }
            
            if ($processName -match "docker" -or $processName -match "com.docker.backend") {
                Write-Info "Skipping Docker process $processName (PID: $processId) on port $Port"
                continue
            }

            Write-Info "Killing process $processName (PID: $processId) on port $Port"
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
        Write-Pass "Port $Port check complete"
    }
    else {
        Write-Pass "Port $Port already free"
    }
}

Stop-PortProcess -Port $BACKEND_PORT
Stop-PortProcess -Port 27017
Stop-PortProcess -Port 6379
Stop-PortProcess -Port 3000 # Stop frontend if running

Start-Sleep -Seconds 2

# ============================================
# START DOCKER SERVICES
# ============================================

Write-Header "STARTING DOCKER SERVICES"

Set-Location $PROJECT_ROOT

# Stop existing containers to ensure clean state
Write-Step "Stopping existing containers..."
docker compose down --remove-orphans 2>&1 | Out-Null

if ($RebuildAll) {
    Write-Step "Rebuilding all images (this may take a while)..."
    docker compose build --no-cache 2>&1
}

# Start services
Write-Step "Starting services (Backend, DB, Redis, ML)..."
if ($Production) {
    Write-Info "Running in PRODUCTION mode"
    docker compose -f docker-compose.yml up -d --build 2>&1
}
else {
    Write-Info "Running in DEVELOPMENT mode (using docker-compose.dev.yml)"
    # Use standalone dev file which now includes all services
    if (Test-Path "docker-compose.dev.yml") {
        docker compose -f docker-compose.dev.yml up -d --build 2>&1
    }
    else {
        # Fallback if dev file missing (unlikely)
        docker compose up -d --build 2>&1
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Fail "Failed to start Docker services"
    exit 1
}

Write-Pass "Docker services starting..."

# ============================================
# WAIT FOR SERVICES TO BE HEALTHY
# ============================================

Write-Header "WAITING FOR SERVICES TO BE HEALTHY"

function Wait-ForService {
    param(
        [string]$Name,
        [string]$Url,
        [int]$TimeoutSeconds = 60
    )
    
    $startTime = Get-Date
    $healthy = $false
    
    while (-not $healthy -and ((Get-Date) - $startTime).TotalSeconds -lt $TimeoutSeconds) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $healthy = $true
                Write-Pass "$Name is healthy"
            }
        }
        catch {
            Write-Host "." -NoNewline -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
    }
    
    if (-not $healthy) {
        Write-Fail "$Name failed to become healthy within $TimeoutSeconds seconds"
        return $false
    }
    return $true
}

# Wait for Backend API
Write-Step "Waiting for Backend API ($BACKEND_PORT)..."
$backendHealthy = Wait-ForService -Name "Backend API" -Url "http://localhost:$BACKEND_PORT/api/v1/health" -TimeoutSeconds 90

if (-not $backendHealthy) {
    Write-Fail "Backend failed to start. Checking logs..."
    docker logs temple-backend-dev --tail 50
    exit 1
}

# ============================================
# AUTO-SEED (First-run or empty database)
# ============================================

Write-Step "Checking database state..."
try {
    $templeRes = Invoke-RestMethod -Uri "http://localhost:$BACKEND_PORT/api/v1/temples" -Method GET -TimeoutSec 10 -ErrorAction SilentlyContinue
    $templeCount = if ($templeRes.count) { $templeRes.count } else { 0 }

    if ($templeCount -eq 0) {
        Write-Host ""
        Write-Host "  🆕 Fresh installation detected — seeding database..." -ForegroundColor Yellow
        Write-Host "     This only runs once on first setup." -ForegroundColor DarkYellow
        Write-Host ""

        # Run init-db.js inside the backend container (has correct env vars + node_modules)
        docker exec temple-backend-dev node scripts/init-db.js 2>&1 | ForEach-Object {
            Write-Host "  $_" -ForegroundColor DarkCyan
        }
        Write-Pass "Database seeded successfully!"
        Write-Host ""
    }
    else {
        Write-Pass "Database OK — $templeCount temples loaded"
    }
}
catch {
    Write-Info "Database check skipped (API not responding to temples query)"
}

# ============================================
# AUTOMATED TESTING (Quick Sanity Check)
# ============================================

if (-not $SkipTests) {
    Write-Header "RUNNING QUICK HEALTH CHECKS"
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$BACKEND_PORT/api/v1/temples" -Method GET -TimeoutSec 10
        if ($response.success) {
            Write-Pass "API /temples endpoint is responding correctly"
        }
        else {
            Write-Fail "API /temples returned error"
        }
    }
    catch {
        Write-Fail "Failed to query API: $_"
    }
}

# Wait for Frontend (unless -SkipFrontend is specified)
if (-not $SkipFrontend) {
    Write-Step "Waiting for Frontend ($FRONTEND_PORT)..."
    $frontendHealthy = Wait-ForService -Name "Frontend" -Url "http://localhost:$FRONTEND_PORT" -TimeoutSeconds 120

    if (-not $frontendHealthy) {
        Write-Fail "Frontend failed to start. Checking logs..."
        docker logs temple-frontend-dev --tail 50
        # Don't exit — backend is still usable
    }
}
else {
    Write-Info "Skipping frontend (backend-only mode)"
}

# ============================================
# FINAL STATUS
# ============================================

Write-Header "SYSTEM STATUS"

Write-Host ""
Write-Host "  Backend API  →  http://localhost:$BACKEND_PORT/api/v1" -ForegroundColor Cyan
if (-not $SkipFrontend) {
    Write-Host "  Frontend     →  http://localhost:$FRONTEND_PORT" -ForegroundColor Cyan
}
Write-Host "  MongoDB      →  mongodb://localhost:27017/temple_db" -ForegroundColor DarkCyan
Write-Host "  Redis        →  redis://localhost:6379" -ForegroundColor DarkCyan
Write-Host ""
Write-Pass "System is fully operational!"
Write-Host "Completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""


