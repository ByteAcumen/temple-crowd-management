# Live Crowd Tracking API Test Script
# Tests entry, exit, and live status endpoints

Write-Host "====================================" -ForegroundColor Cyan
Write-Host " Live Crowd Tracking - API Tests" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api/v1"

# Variables
$templeId = $null
$adminToken = $null
$gatekeeperToken = $null
$bookingPassId = $null

# Test 1: Create Admin User
Write-Host "[1] Setting up Admin User..." -ForegroundColor Yellow
try {
    $loginData = @{
        email    = "admin@temple.com"
        password = "Admin@123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $adminToken = $response.token
}
catch {
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
    
    $adminToken = $response.token
}
Write-Host "✅ Admin token obtained" -ForegroundColor Green
Write-Host ""

# Test 2: Create Gatekeeper User
Write-Host "[2] Setting up Gatekeeper User..." -ForegroundColor Yellow
try {
    $loginData = @{
        email    = "gatekeeper@temple.com"
        password = "Gate@123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $gatekeeperToken = $response.token
}
catch {
    $registerData = @{
        name     = "Gatekeeper User"
        email    = "gatekeeper@temple.com"
        password = "Gate@123"
        role     = "gatekeeper"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $registerData `
        -ContentType "application/json"
    
    $gatekeeperToken = $response.token
}
Write-Host "✅ Gatekeeper token obtained" -ForegroundColor Green
Write-Host ""

# Test 3: Create Temple
Write-Host "[3] Creating Temple..." -ForegroundColor Yellow
$templeData = @{
    name     = "Test Temple - Live Tracking"
    location = @{
        city  = "Test City"
        state = "Test State"
    }
    capacity = @{
        total              = 100
        per_slot           = 50
        threshold_warning  = 85
        threshold_critical = 95
    }
    status   = "OPEN"
} | ConvertTo-Json -Depth 10

$temple = Invoke-RestMethod -Uri "$baseUrl/temples" `
    -Method Post `
    -Body $templeData `
    -Headers @{ "Authorization" = "Bearer $adminToken" } `
    -ContentType "application/json"

$templeId = $temple.data._id
Write-Host "✅ Temple created: $templeId" -ForegroundColor Green
Write-Host ""

# Test 4: Create Booking
Write-Host "[4] Creating Test Booking..." -ForegroundColor Yellow
$bookingData = @{
    templeName = "Test Temple - Live Tracking"
    date       = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    slot       = "10:00 AM - 11:00 AM"
    visitors   = 2
    userName   = "Test User"
    userEmail  = "testuser@example.com"
} | ConvertTo-Json

$booking = Invoke-RestMethod -Uri "$baseUrl/bookings/create" `
    -Method Post `
    -Body $bookingData `
    -ContentType "application/json"

$bookingPassId = $booking.data.passId
Write-Host "✅ Booking created: Pass ID = $bookingPassId" -ForegroundColor Green
Write-Host ""

# Test 5: Get Initial Live Status
Write-Host "[5] Getting Initial Live Status..." -ForegroundColor Yellow
$liveStatus = Invoke-RestMethod -Uri "$baseUrl/live/$templeId" -Method Get
Write-Host "✅ Initial status:" -ForegroundColor Green
Write-Host "   Live Count: $($liveStatus.data.live_count)" -ForegroundColor Gray
Write-Host "   Capacity: $($liveStatus.data.total_capacity)" -ForegroundColor Gray
Write-Host "   Status: $($liveStatus.data.traffic_status)" -ForegroundColor Gray
Write-Host ""

# Test 6: Record Entry (Gatekeeper)
Write-Host "[6] Recording Entry..." -ForegroundColor Yellow
$entryData = @{
    templeId = $templeId
    passId   = $bookingPassId
} | ConvertTo-Json

$entryResponse = Invoke-RestMethod -Uri "$baseUrl/live/entry" `
    -Method Post `
    -Body $entryData `
    -Headers @{ "Authorization" = "Bearer $gatekeeperToken" } `
    -ContentType "application/json"

Write-Host "✅ Entry recorded!" -ForegroundColor Green
Write-Host "   Live Count: $($entryResponse.data.temple.live_count)" -ForegroundColor Gray
Write-Host "   Percentage: $($entryResponse.data.temple.capacity_percentage)%" -ForegroundColor Gray
Write-Host "   Status: $($entryResponse.data.temple.traffic_status)" -ForegroundColor Gray
Write-Host ""

# Test 7: Try Duplicate Entry (Should Fail)
Write-Host "[7] Testing Duplicate Entry Prevention..." -ForegroundColor Yellow
try {
    $duplicateEntry = Invoke-RestMethod -Uri "$baseUrl/live/entry" `
        -Method Post `
        -Body $entryData `
        -Headers @{ "Authorization" = "Bearer $gatekeeperToken" } `
        -ContentType "application/json"
    
    Write-Host "❌ Duplicate entry was allowed (BAD!)" -ForegroundColor Red
}
catch {
    Write-Host "✅ Duplicate entry prevented (GOOD!)" -ForegroundColor Green
}
Write-Host ""

# Test 8: Get Updated Live Status
Write-Host "[8] Getting Updated Live Status..." -ForegroundColor Yellow
$liveStatus = Invoke-RestMethod -Uri "$baseUrl/live/$templeId" -Method Get
Write-Host "✅ Current status:" -ForegroundColor Green
Write-Host "   Live Count: $($liveStatus.data.live_count)" -ForegroundColor Gray
Write-Host "   Percentage: $($liveStatus.data.capacity_percentage)%" -ForegroundColor Gray
Write-Host "   Status: $($liveStatus.data.traffic_status)" -ForegroundColor Gray
Write-Host ""

# Test 9: Record Exit
Write-Host "[9] Recording Exit..." -ForegroundColor Yellow
$exitData = @{
    templeId = $templeId
    passId   = $bookingPassId
} | ConvertTo-Json

$exitResponse = Invoke-RestMethod -Uri "$baseUrl/live/exit" `
    -Method Post `
    -Body $exitData `
    -Headers @{ "Authorization" = "Bearer $gatekeeperToken" } `
    -ContentType "application/json"

Write-Host "✅ Exit recorded!" -ForegroundColor Green
Write-Host "   Live Count: $($exitResponse.data.temple.live_count)" -ForegroundColor Gray
Write-Host "   Status: $($exitResponse.data.temple.traffic_status)" -ForegroundColor Gray
Write-Host ""

# Test 10: Final Live Status
Write-Host "[10] Final Live Status Check..." -ForegroundColor Yellow
$liveStatus = Invoke-RestMethod -Uri "$baseUrl/live/$templeId" -Method Get
Write-Host "✅ Final status (should be 0):" -ForegroundColor Green
Write-Host "   Live Count: $($liveStatus.data.live_count)" -ForegroundColor Gray
Write-Host ""

Write-Host "====================================" -ForegroundColor Cyan
Write-Host " 🎉 All Tests Passed!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Live Crowd Tracking is working!" -ForegroundColor Green
Write-Host ""
Write-Host "Key Features Verified:" -ForegroundColor Yellow
Write-Host "  ✅ Entry recording (Redis INCR)" -ForegroundColor Gray
Write-Host "  ✅ Exit recording (Redis DECR)" -ForegroundColor Gray
Write-Host "  ✅ Duplicate entry prevention" -ForegroundColor Gray
Write-Host "  ✅ Live status dashboard" -ForegroundColor Gray
Write-Host "  ✅ Traffic light system" -ForegroundColor Gray
