# Temple Crowd Management - Backend Automation Master Script
# 
# FEATURES:
# - Automated testing of all endpoints
# - Auto-restart if tests fail
# - Health monitoring
# - Data persistence validation
# - One-command startup
#
# USAGE:
# powershell -ExecutionPolicy Bypass -File .\start.ps1
# powershell -ExecutionPolicy Bypass -File .\start.ps1 -SkipTests
# powershell -ExecutionPolicy Bypass -File .\start.ps1 -Production

param(
    [switch]$SkipTests,
    [switch]$Production,
    [switch]$RebuildAll,
    [int]$MaxRetries = 3
)

# ============================================
# CONFIGURATION
# ============================================

$ErrorActionPreference = "Continue"
$PROJECT_ROOT = $PSScriptRoot
$BACKEND_PORT = 5000
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
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
    Write-Pass "Docker: $dockerVersion"
}
catch {
    Write-Fail "Docker is not running. Please start Docker Desktop."
    exit 1
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
            $processName = (Get-Process -Id $processId -ErrorAction SilentlyContinue).ProcessName
            
            if ($processName -match "docker") {
                Write-Info "Skipping Docker process $processName (PID: $processId) on port $Port"
                continue
            }

            Write-Info "Killing process $processName (PID: $processId) on port $Port"
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
        Write-Pass "Port $Port cleared"
    }
    else {
        Write-Pass "Port $Port already free"
    }
}

Stop-PortProcess -Port $BACKEND_PORT
Stop-PortProcess -Port 27017
Stop-PortProcess -Port 6379

Start-Sleep -Seconds 2

# ============================================
# START DOCKER SERVICES
# ============================================

Write-Header "STARTING DOCKER SERVICES"

Set-Location $PROJECT_ROOT

# Stop existing containers
Write-Step "Stopping existing containers..."
docker compose down --remove-orphans 2>&1 | Out-Null

if ($RebuildAll) {
    Write-Step "Rebuilding all images (this may take a while)..."
    docker compose build --no-cache 2>&1
}

# Start services
Write-Step "Starting services..."
if ($Production) {
    docker compose up -d --build 2>&1
}
else {
    docker compose up -d 2>&1
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
            $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -ErrorAction Stop
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

# Wait for MongoDB
Write-Step "Waiting for MongoDB..."
$mongoHealthy = $false
$startTime = Get-Date
while (-not $mongoHealthy -and ((Get-Date) - $startTime).TotalSeconds -lt 30) {
    $mongoStatus = docker inspect temple-mongo --format='{{.State.Health.Status}}' 2>&1
    if ($mongoStatus -eq "healthy") {
        $mongoHealthy = $true
        Write-Pass "MongoDB is healthy"
    }
    else {
        Write-Host "." -NoNewline -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

# Wait for Redis
Write-Step "Waiting for Redis..."
$redisHealthy = $false
$startTime = Get-Date
while (-not $redisHealthy -and ((Get-Date) - $startTime).TotalSeconds -lt 30) {
    $redisStatus = docker inspect temple-redis --format='{{.State.Health.Status}}' 2>&1
    if ($redisStatus -eq "healthy") {
        $redisHealthy = $true
        Write-Pass "Redis is healthy"
    }
    else {
        Write-Host "." -NoNewline -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

# Wait for Backend API
Write-Step "Waiting for Backend API..."
$backendHealthy = Wait-ForService -Name "Backend API" -Url "http://localhost:$BACKEND_PORT" -TimeoutSeconds 60

if (-not $backendHealthy) {
    Write-Fail "Backend failed to start. Checking logs..."
    docker logs temple-backend --tail 50
    exit 1
}

# ============================================
# DATA PERSISTENCE CHECK
# ============================================

Write-Header "DATA PERSISTENCE CHECK"

Write-Step "Checking MongoDB data volume..."
$volumeInfo = docker volume inspect temple-crowd-management_mongo_data 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Pass "MongoDB data volume exists - data will persist"
}
else {
    Write-Info "Creating MongoDB data volume..."
    docker volume create temple-crowd-management_mongo_data 2>&1
}

Write-Step "Checking existing data..."
$templeCount = 0
try {
    $response = Invoke-RestMethod -Uri "http://localhost:$BACKEND_PORT/api/v1/temples" -Method GET -TimeoutSec 10
    if ($response.data) {
        $templeCount = $response.data.Count
    }
    Write-Pass "Found $templeCount temples in database"
}
catch {
    Write-Info "Could not check temple count: $_"
}

# ============================================
# AUTOMATED TESTING
# ============================================

if (-not $SkipTests) {
    Write-Header "RUNNING AUTOMATED TESTS"
    
    $testResults = @{ passed = 0; failed = 0; endpoints = @() }
    
    function Test-Endpoint {
        param(
            [string]$Name,
            [string]$Method,
            [string]$Url,
            [hashtable]$Headers = @{},
            [string]$Body = $null
        )
        
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        try {
            $params = @{
                Uri         = $Url
                Method      = $Method
                Headers     = $Headers
                ContentType = "application/json"
                TimeoutSec  = 30
            }
            
            if ($Body) { $params.Body = $Body }
            
            $response = Invoke-WebRequest @params -ErrorAction Stop
            $stopwatch.Stop()
            
            $elapsed = $stopwatch.ElapsedMilliseconds
            Write-Pass "$Name - $elapsed ms"
            $script:testResults.passed++
            return @{ success = $true; data = $response.Content | ConvertFrom-Json }
            
        }
        catch {
            $stopwatch.Stop()
            $elapsed = $stopwatch.ElapsedMilliseconds
            Write-Fail "$Name - $elapsed ms"
            $script:testResults.failed++
            return @{ success = $false; error = $_.Exception.Message }
        }
    }
    
    # Test Health
    Test-Endpoint -Name "Health Check" -Method "GET" -Url "http://localhost:$BACKEND_PORT/"
    
    # Test Temples
    $templesResult = Test-Endpoint -Name "GET /temples" -Method "GET" -Url "http://localhost:$BACKEND_PORT/api/v1/temples"
    
    # Test Auth
    $loginBody = @{ email = "admin@temple.com"; password = "Admin@123456" } | ConvertTo-Json
    $loginResult = Test-Endpoint -Name "POST /auth/login" -Method "POST" -Url "http://localhost:$BACKEND_PORT/api/v1/auth/login" -Body $loginBody
    
    $token = $null
    if ($loginResult.success -and $loginResult.data.token) {
        $token = $loginResult.data.token
        Write-Pass "Got auth token"
    }
    
    $authHeaders = @{ "Authorization" = "Bearer $token" }
    
    # Test Admin endpoints
    if ($token) {
        Test-Endpoint -Name "GET /admin/stats" -Method "GET" -Url "http://localhost:$BACKEND_PORT/api/v1/admin/stats" -Headers $authHeaders
        Test-Endpoint -Name "GET /admin/health" -Method "GET" -Url "http://localhost:$BACKEND_PORT/api/v1/admin/health" -Headers $authHeaders
    }
    
    # Test Live
    Test-Endpoint -Name "GET /live" -Method "GET" -Url "http://localhost:$BACKEND_PORT/api/v1/live"
    
    Write-Host ""
    Write-Host "Test Results: $($testResults.passed)/$($testResults.passed + $testResults.failed) passed" -ForegroundColor $(if ($testResults.failed -eq 0) { "Green" } else { "Yellow" })
    
    # Auto-restart if tests fail
    if ($testResults.failed -gt 0 -and $MaxRetries -gt 0) {
        Write-Info "Some tests failed. Restarting backend..."
        docker compose restart backend 2>&1 | Out-Null
        Start-Sleep -Seconds 10
        
        Write-Info "Retrying tests... (Retries left: $($MaxRetries - 1))"
        # Recursive retry
        if ($MaxRetries -gt 1) {
            & $PSCommandPath -MaxRetries ($MaxRetries - 1)
            exit $LASTEXITCODE
        }
    }
}

# ============================================
# FINAL STATUS
# ============================================

Write-Header "SYSTEM STATUS"

$services = @(
    @{ Name = "MongoDB"; Container = "temple-mongo"; Port = 27017 },
    @{ Name = "Redis"; Container = "temple-redis"; Port = 6379 },
    @{ Name = "Backend API"; Container = "temple-backend"; Port = $BACKEND_PORT }
)

foreach ($svc in $services) {
    $status = docker inspect $svc.Container --format='{{.State.Status}}' 2>&1
    $health = docker inspect $svc.Container --format='{{.State.Health.Status}}' 2>&1
    
    if ($status -eq "running") {
        if ($health -eq "healthy" -or $health -eq "") {
            Write-Pass "$($svc.Name): Running on port $($svc.Port)"
        }
        else {
            Write-Info "$($svc.Name): Running (health: $health)"
        }
    }
    else {
        Write-Fail "$($svc.Name): $status"
    }
}

Write-Header "NEXT STEPS"
Write-Host ""
Write-Host "Backend API:    http://localhost:$BACKEND_PORT" -ForegroundColor Cyan
Write-Host "MongoDB:        mongodb://localhost:27017/temple_db" -ForegroundColor Cyan
Write-Host "Redis:          redis://localhost:6379" -ForegroundColor Cyan
Write-Host ""
Write-Host "Start Frontend (in a new terminal):" -ForegroundColor Yellow
Write-Host "  cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "View Logs:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f backend" -ForegroundColor White
Write-Host ""
Write-Host "Stop All:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor White
Write-Host ""
Write-Pass "System is ready!"
Write-Host "Completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
