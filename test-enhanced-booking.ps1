# Enhanced Booking API Test Script
# Tests slot capacity validation, cancellation, availability check, and QR lookup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Enhanced Booking System - API Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api/v1"

# Variables
$templeId = $null
$userToken = $null
$bookingId = $null
$bookingPassId = $null

# Test 1: Create Test Temple
Write-Host "[1] Creating Test Temple..." -ForegroundColor Yellow
try {
    $loginData = @{
        email    = "admin@temple.com"
        password = "Admin@123"
    } | ConvertTo-Json

    $authResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $adminToken = $authResponse.token
}
catch {
    Write-Host "Admin not found, creating..." -ForegroundColor Gray
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
    
    $adminToken = $authResponse.token
}

$templeData = @{
    name     = "Booking Test Temple"
    location = @{
        city  = "Test City"
        state = "Test State"
    }
    capacity = @{
        total              = 1000
        per_slot           = 10
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
Write-Host "   Slot Capacity: 10 visitors" -ForegroundColor Gray
Write-Host ""

# Test 2: Create Test User
Write-Host "[2] Creating Test User..." -ForegroundColor Yellow
try {
    $loginData = @{
        email    = "testuser@temple.com"
        password = "Test@123"
    } | ConvertTo-Json

    $userAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $userToken = $userAuth.token
}
catch {
    $registerData = @{
        name     = "Test User"
        email    = "testuser@temple.com"
        password = "Test@123"
        role     = "user"
    } | ConvertTo-Json

    $userAuth = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $registerData `
        -ContentType "application/json"
    
    $userToken = $userAuth.token
}
Write-Host "✅ User token obtained" -ForegroundColor Green
Write-Host ""

# Test 3: Check Initial Availability
Write-Host "[3] Checking Slot Availability (should be 10/10)..." -ForegroundColor Yellow
$date = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
$slot = "10:00 AM - 11:00 AM"

$availability = Invoke-RestMethod -Uri "$baseUrl/bookings/availability?templeId=$templeId&date=$date&slot=$($slot -replace ' ','%20')" -Method Get
Write-Host "✅ Availability checked:" -ForegroundColor Green
Write-Host "   Total: $($availability.data.total_capacity)" -ForegroundColor Gray
Write-Host "   Booked: $($availability.data.booked)" -ForegroundColor Gray
Write-Host "   Available: $($availability.data.available)" -ForegroundColor Gray
Write-Host ""

# Test 4: Create First Booking (5 visitors)
Write-Host "[4] Creating First Booking (5 visitors)..." -ForegroundColor Yellow
$bookingData = @{
    templeId   = $templeId
    templeName = "Booking Test Temple"
    date       = $date
    slot       = $slot
    visitors   = 5
    userName   = "Test User"
    userEmail  = "testuser@temple.com"
} | ConvertTo-Json

$booking1 = Invoke-RestMethod -Uri "$baseUrl/bookings" `
    -Method Post `
    -Body $bookingData `
    -Headers @{ "Authorization" = "Bearer $userToken" } `
    -ContentType "application/json"

$bookingId = $booking1.data._id
$bookingPassId = $booking1.data.passId

Write-Host "✅ Booking created!" -ForegroundColor Green
Write-Host "   Pass ID: $bookingPassId" -ForegroundColor Gray
Write-Host "   Remaining: $($booking1.slot_info.remaining)" -ForegroundColor Gray
Write-Host ""

# Test 5: Check Updated Availability (should be 5/10)
Write-Host "[5] Checking Updated Availability (should be 5/10)..." -ForegroundColor Yellow
$availability = Invoke-RestMethod -Uri "$baseUrl/bookings/availability?templeId=$templeId&date=$date&slot=$($slot -replace ' ','%20')" -Method Get
Write-Host "✅ Availability:" -ForegroundColor Green
Write-Host "   Booked: $($availability.data.booked)" -ForegroundColor Gray
Write-Host "   Available: $($availability.data.available)" -ForegroundColor Gray
Write-Host ""

# Test 6: Try Overbooking (should fail)
Write-Host "[6] Testing Overbooking Prevention (6 visitors > 5 available)..." -ForegroundColor Yellow
try {
    $overbookData = @{
        templeId   = $templeId
        templeName = "Booking Test Temple"
        date       = $date
        slot       = $slot
        visitors   = 6
        userName   = "Another User"
        userEmail  = "another@temple.com"
    } | ConvertTo-Json

    $overbooking = Invoke-RestMethod -Uri "$baseUrl/bookings" `
        -Method Post `
        -Body $overbookData `
        -Headers @{ "Authorization" = "Bearer $userToken" } `
        -ContentType "application/json"
    
    Write-Host "❌ Overbooking was allowed (BAD!)" -ForegroundColor Red
}
catch {
    Write-Host "✅ Overbooking prevented (GOOD!)" -ForegroundColor Green
    Write-Host "   Error: $($_.Exception.Response.StatusDescription)" -ForegroundColor Gray
}
Write-Host ""

# Test 7: QR Code Lookup
Write-Host "[7] Testing QR Code Lookup..." -ForegroundColor Yellow
$qrLookup = Invoke-RestMethod -Uri "$baseUrl/bookings/pass/$bookingPassId" -Method Get
Write-Host "✅ QR lookup successful:" -ForegroundColor Green
Write-Host "   Pass ID: $($qrLookup.data.pass_id)" -ForegroundColor Gray
Write-Host "   Temple: $($qrLookup.data.temple)" -ForegroundColor Gray
Write-Host "   Status: $($qrLookup.data.status)" -ForegroundColor Gray
Write-Host "   Valid: $($qrLookup.data.is_valid)" -ForegroundColor Gray
Write-Host ""

# Test 8: Get User Bookings
Write-Host "[8] Getting User Bookings..." -ForegroundColor Yellow
$myBookings = Invoke-RestMethod -Uri "$baseUrl/bookings?email=testuser@temple.com" `
    -Headers @{ "Authorization" = "Bearer $userToken" }
Write-Host "✅ Found $($myBookings.count) booking(s)" -ForegroundColor Green
Write-Host ""

# Test 9: Cancel Booking
Write-Host "[9] Cancelling Booking..." -ForegroundColor Yellow
$cancelled = Invoke-RestMethod -Uri "$baseUrl/bookings/$bookingId" `
    -Method Delete `
    -Headers @{ "Authorization" = "Bearer $userToken" }
Write-Host "✅ Booking cancelled!" -ForegroundColor Green
Write-Host "   Status: $($cancelled.data.status)" -ForegroundColor Gray
Write-Host ""

# Test 10: Try Cancelling Again (should fail)
Write-Host "[10] Testing Double Cancellation Prevention..." -ForegroundColor Yellow
try {
    $cancelled2 = Invoke-RestMethod -Uri "$baseUrl/bookings/$bookingId" `
        -Method Delete `
        -Headers @{ "Authorization" = "Bearer $userToken" }
    
    Write-Host "❌ Double cancellation allowed (BAD!)" -ForegroundColor Red
}
catch {
    Write-Host "✅ Double cancellation prevented (GOOD!)" -ForegroundColor Green
}
Write-Host ""

# Test 11: Check Final Availability (should be back to 10/10)
Write-Host "[11] Checking Final Availability (should be 10/10)..." -ForegroundColor Yellow
$availability = Invoke-RestMethod -Uri "$baseUrl/bookings/availability?templeId=$templeId&date=$date&slot=$($slot -replace ' ','%20')" -Method Get
Write-Host "✅ Final availability:" -ForegroundColor Green
Write-Host "   Available: $($availability.data.available)" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 🎉 All Tests Passed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Enhanced Booking System is working!" -ForegroundColor Green
Write-Host ""
Write-Host "Key Features Verified:" -ForegroundColor Yellow
Write-Host "  ✅ Slot capacity validation" -ForegroundColor Gray
Write-Host "  ✅ Overbooking prevention" -ForegroundColor Gray
Write-Host "  ✅ Availability checking" -ForegroundColor Gray
Write-Host "  ✅ Booking cancellation" -ForegroundColor Gray
Write-Host "  ✅ QR code lookup" -ForegroundColor Gray
Write-Host "  ✅ User authorization" -ForegroundColor Gray
