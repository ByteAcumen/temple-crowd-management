# TEST-ALL.PS1
# ONE-COMMAND AUTOMATED TESTING
# Starts services, waits for them to be ready, runs all tests

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " 🚀 Temple Management - Automated Testing" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$dockerComposeFile = "docker-compose.local.yml"
$maxWaitTime = 120  # 2 minutes max wait
$checkInterval = 5  # Check every 5 seconds

# ==========================================
# STEP 1: Stop existing containers
# ==========================================
Write-Host "[1/5] Cleaning up existing containers..." -ForegroundColor Yellow
docker-compose -f $dockerComposeFile down 2>&1 | Out-Null
Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""

# ==========================================
# STEP 2: Start services with Docker Compose
# ==========================================
Write-Host "[2/5] Starting services (MongoDB + Redis + Backend)..." -ForegroundColor Yellow
Write-Host "   This may take 30-60 seconds on first run..." -ForegroundColor Gray

# Start services in detached mode
docker-compose -f $dockerComposeFile up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Docker services!" -ForegroundColor Red
    Write-Host "   Make sure Docker Desktop is running" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Services started" -ForegroundColor Green
Write-Host ""

# ==========================================
# STEP 3: Wait for services to be healthy
# ==========================================
Write-Host "[3/5] Waiting for services to be healthy..." -ForegroundColor Yellow

$elapsed = 0
$allHealthy = $false

while ($elapsed -lt $maxWaitTime) {
    # Check container health
    $mongoHealth = docker inspect temple-mongo --format='{{.State.Health.Status}}' 2>$null
    $redisHealth = docker inspect temple-redis --format='{{.State.Health.Status}}' 2>$null
    $backendHealth = docker inspect temple-backend --format='{{.State.Health.Status}}' 2>$null

    # Display status
    Write-Host "   MongoDB: $mongoHealth | Redis: $redisHealth | Backend: $backendHealth" -ForegroundColor Gray

    # Check if all healthy
    if ($mongoHealth -eq "healthy" -and $redisHealth -eq "healthy" -and $backendHealth -eq "healthy") {
        $allHealthy = $true
        break
    }

    Start-Sleep -Seconds $checkInterval
    $elapsed += $checkInterval
}

if (-not $allHealthy) {
    Write-Host "❌ Services did not become healthy in time!" -ForegroundColor Red
    Write-Host "   Check logs: docker-compose -f $dockerComposeFile logs" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All services healthy!" -ForegroundColor Green
Write-Host ""

# ==========================================
# STEP 4: Wait for backend API to respond
# ==========================================
Write-Host "[4/5] Verifying backend API..." -ForegroundColor Yellow

$backendReady = $false
$apiCheckAttempts = 0
$maxApiAttempts = 12  # 1 minute (5 sec intervals)

while ($apiCheckAttempts -lt $maxApiAttempts) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000" -Method Get -TimeoutSec 3
        if ($response.status -eq "Healthy") {
            $backendReady = $true
            break
        }
    }
    catch {
        # API not ready yet
    }
    
    Start-Sleep -Seconds 5
    $apiCheckAttempts++
    Write-Host "   Waiting for backend API... ($apiCheckAttempts/$maxApiAttempts)" -ForegroundColor Gray
}

if (-not $backendReady) {
    Write-Host "❌ Backend API not responding!" -ForegroundColor Red
    Write-Host "   Check backend logs: docker logs temple-backend" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend API ready!" -ForegroundColor Green
Write-Host ""

# ==========================================
# STEP 5: Run Temple Management Tests
# ==========================================
Write-Host "[5/5] Running Temple Management Tests..." -ForegroundColor Yellow
Write-Host ""

$baseUrl = "http://localhost:5000/api/v1"
$templeId = $null
$adminToken = $null
$testsPassed = 0
$testsFailed = 0

# Helper function to run tests
function Test-Endpoint {
    param($testName, $scriptBlock)
    
    Write-Host "[$testName]" -ForegroundColor Cyan
    try {
        & $scriptBlock
        $script:testsPassed++
        return $true
    }
    catch {
        Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
        return $false
    }
}

# Test 1: Admin Registration/Login
Test-Endpoint "Admin Authentication" {
    try {
        # Try login first
        $loginData = @{
            email    = "admin@temple.com"
            password = "Admin@123"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
            -Method Post `
            -Body $loginData `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        $script:adminToken = $response.token
    }
    catch {
        # Register if login fails
        $registerData = @{
            name     = "Admin User"
            email    = "admin@temple.com"
            password = "Admin@123"
            role     = "admin"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
            -Method Post `
            -Body $registerData `
            -ContentType "application/json"
        
        $script:adminToken = $response.token
    }
    
    Write-Host "   ✅ Admin authenticated" -ForegroundColor Green
    Write-Host "   Token: $($script:adminToken.Substring(0, 20))..." -ForegroundColor Gray
}

# Test 2: Create Temple
Test-Endpoint "Create Temple" {
    $templeData = @{
        name     = "Somnath Temple - Test $(Get-Random -Maximum 9999)"
        location = @{
            address     = "Veraval, Prabhas Patan"
            city        = "Veraval"
            state       = "Gujarat"
            coordinates = @{
                latitude  = 20.8880
                longitude = 70.4013
            }
        }
        capacity = @{
            total              = 10000
            per_slot           = 500
            threshold_warning  = 85
            threshold_critical = 95
        }
        slots    = @(
            @{ time = "06:00 AM - 08:00 AM"; max_capacity = 500; is_active = $true }
            @{ time = "08:00 AM - 10:00 AM"; max_capacity = 500; is_active = $true }
            @{ time = "10:00 AM - 12:00 PM"; max_capacity = 500; is_active = $true }
        )
        contact  = @{
            phone = "+91-9876543210"
            email = "info@somnath.com"
        }
        status   = "OPEN"
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri "$baseUrl/temples" `
        -Method Post `
        -Body $templeData `
        -Headers @{ "Authorization" = "Bearer $script:adminToken" } `
        -ContentType "application/json"
    
    $script:templeId = $response.data._id
    Write-Host "   ✅ Temple created: $($response.data.name)" -ForegroundColor Green
    Write-Host "   ID: $script:templeId" -ForegroundColor Gray
}

# Test 3: Get All Temples
Test-Endpoint "Get All Temples" {
    $response = Invoke-RestMethod -Uri "$baseUrl/temples" -Method Get
    Write-Host "   ✅ Retrieved $($response.count) temple(s)" -ForegroundColor Green
    
    if ($null -eq $script:templeId -and $response.count -gt 0) {
        $script:templeId = $response.data[0]._id
    }
}

# Test 4: Get Single Temple
if ($templeId) {
    Test-Endpoint "Get Temple Details" {
        $response = Invoke-RestMethod -Uri "$baseUrl/temples/$script:templeId" -Method Get
        Write-Host "   ✅ Temple: $($response.data.name)" -ForegroundColor Green
        Write-Host "   Capacity: $($response.data.capacity.total)" -ForegroundColor Gray
        Write-Host "   Traffic: $($response.data.traffic_status)" -ForegroundColor Gray
    }
}

# Test 5: Update Temple
if ($templeId -and $adminToken) {
    Test-Endpoint "Update Temple" {
        $updateData = @{
            status = "OPEN"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/temples/$script:templeId" `
            -Method Put `
            -Body $updateData `
            -Headers @{ "Authorization" = "Bearer $script:adminToken" } `
            -ContentType "application/json"
        
        Write-Host "   ✅ Temple updated" -ForegroundColor Green
    }
}

# Test 6: Get Live Status
if ($templeId) {
    Test-Endpoint "Get Live Status" {
        $response = Invoke-RestMethod -Uri "$baseUrl/temples/$script:templeId/live" -Method Get
        Write-Host "   ✅ Live Status Retrieved" -ForegroundColor Green
        Write-Host "   Live Count: $($response.data.live_count)" -ForegroundColor Gray
        Write-Host "   Percentage: $($response.data.percentage)%" -ForegroundColor Gray
        Write-Host "   Status: $($response.data.status)" -ForegroundColor Gray
    }
}

# Test 7: Filter Temples
Test-Endpoint "Filter Temples by Status" {
    $response = Invoke-RestMethod -Uri "$baseUrl/temples?status=OPEN" -Method Get
    Write-Host "   ✅ Filtered: $($response.count) open temple(s)" -ForegroundColor Green
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " 📊 Test Results" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✅ Passed: $testsPassed" -ForegroundColor Green
if ($testsFailed -gt 0) {
    Write-Host "❌ Failed: $testsFailed" -ForegroundColor Red
}
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Some tests failed. Check logs above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " 🛠️  Useful Commands" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "View logs:        docker-compose -f $dockerComposeFile logs -f" -ForegroundColor Gray
Write-Host "Backend logs:     docker logs -f temple-backend" -ForegroundColor Gray
Write-Host "Restart services: docker-compose -f $dockerComposeFile restart" -ForegroundColor Gray
Write-Host "Stop services:    docker-compose -f $dockerComposeFile down" -ForegroundColor Gray
Write-Host "MongoDB shell:    docker exec -it temple-mongo mongosh temple_crowd_management" -ForegroundColor Gray
Write-Host "Redis CLI:        docker exec -it temple-redis redis-cli" -ForegroundColor Gray
Write-Host ""
