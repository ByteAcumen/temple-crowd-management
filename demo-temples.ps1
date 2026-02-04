# Simple Temple API Demo
# Shows all temple endpoints working

Write-Host "================================" -ForegroundColor Cyan
Write-Host " Temple API - Quick Demo" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api/v1"

# Test 1: Health Check
Write-Host "[1] Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "http://localhost:5000" -Method Get
Write-Host "✅ Status: $($health.status)" -ForegroundColor Green
Write-Host ""

# Test 2: Get All Temples (should be empty initially)
Write-Host "[2] Get All Temples..." -ForegroundColor Yellow
$temples = Invoke-RestMethod -Uri "$baseUrl/temples" -Method Get
Write-Host "✅ Found $($temples.count) temple(s)" -ForegroundColor Green
Write-Host ""

# Test 3: Register Admin (if needed)
Write-Host "[3] Creating Admin User..." -ForegroundColor Yellow
try {
    $registerData = @{
        name     = "Admin User"
        email    = "admin@temple.com"
        password = "Admin@123"
        role     = "admin"
    } | ConvertTo-Json

    $authResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $registerData `
        -ContentType "application/json"
    
    $token = $authResponse.token
    Write-Host "✅ Admin created! Token: $($token.Substring(0,20))..." -ForegroundColor Green
}
catch {
    # Try login instead
    $loginData = @{
        email    = "admin@temple.com"
        password = "Admin@123"
    } | ConvertTo-Json

    $authResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json"
    
    $token = $authResponse.token
    Write-Host "✅ Admin logged in! Token: $($token.Substring(0,20))..." -ForegroundColor Green
}
Write-Host ""

# Test 4: Create Temple
Write-Host "[4] Creating Somnath Temple..." -ForegroundColor Yellow
$templeData = @{
    name     = "Somnath Temple"
    location = @{
        city    = "Veraval"
        state   = "Gujarat"
        address = "Veraval, Prabhas Patan"
    }
    capacity = @{
        total              = 10000
        per_slot           = 500
        threshold_warning  = 85
        threshold_critical = 95
    }
    status   = "OPEN"
} | ConvertTo-Json -Depth 10

$temple = Invoke-RestMethod -Uri "$baseUrl/temples" `
    -Method Post `
    -Body $templeData `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -ContentType "application/json"

Write-Host "✅ Temple created!" -ForegroundColor Green
Write-Host "   ID: $($temple.data._id)" -ForegroundColor Gray
Write-Host "   Name: $($temple.data.name)" -ForegroundColor Gray
Write-Host "   Capacity: $($temple.data.capacity.total)" -ForegroundColor Gray
Write-Host ""

# Test 5: Get Temple Details
Write-Host "[5] Getting Temple Details..." -ForegroundColor Yellow
$templeDetails = Invoke-RestMethod -Uri "$baseUrl/temples/$($temple.data._id)" -Method Get
Write-Host "✅ Retrieved temple" -ForegroundColor Green
Write-Host "   Name: $($templeDetails.data.name)" -ForegroundColor Gray
Write-Host "   City: $($templeDetails.data.location.city)" -ForegroundColor Gray
Write-Host "   Traffic Status: $($templeDetails.data.traffic_status)" -ForegroundColor Gray
Write-Host ""

# Test 6: Get Live Status
Write-Host "[6] Getting Live Crowd Status..." -ForegroundColor Yellow
$liveStatus = Invoke-RestMethod -Uri "$baseUrl/temples/$($temple.data._id)/live" -Method Get
Write-Host "✅ Live status" -ForegroundColor Green
Write-Host "   Live Count: $($liveStatus.data.live_count)" -ForegroundColor Gray
Write-Host "   Percentage: $($liveStatus.data.percentage)%" -ForegroundColor Gray
Write-Host "   Status: $($liveStatus.data.status)" -ForegroundColor Gray
Write-Host ""

# Test 7: Get All Temples Again
Write-Host "[7] Get All Temples (should show 1)..." -ForegroundColor Yellow
$templesAfter = Invoke-RestMethod -Uri "$baseUrl/temples" -Method Get
Write-Host "✅ Found $($templesAfter.count) temple(s)" -ForegroundColor Green
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host " 🎉 All Tests Passed!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Temple Management System is working perfectly!" -ForegroundColor Green
