# ========================================
# TEMPLE MANAGEMENT SYSTEM - VERIFICATION TEST
# Complete end-to-end testing suite
# ========================================

param(
    [string]$BaseUrl = "http://localhost:5000/api/v1"
)

# Colors for output
$script:PassCount = 0
$script:FailCount = 0
$script:TotalCount = 0

# Test data storage
$script:TestData = @{
    AdminToken      = $null
    UserToken       = $null
    GatekeeperToken = $null
    TempleId        = $null
    BookingId       = $null
    PassId          = $null
}

#region Helper Functions

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-SectionHeader {
    param([string]$Section)
    Write-Host "`n--- $Section ---" -ForegroundColor Magenta
}

function Test-Endpoint {
    param(
        [string]$Name,
        [scriptblock]$TestBlock
    )
    
    $script:TotalCount++
    Write-Host "[$script:TotalCount] $Name" -ForegroundColor Yellow
    
    try {
        & $TestBlock
        $script:PassCount++
        Write-Host "   PASS" -ForegroundColor Green
        return $true
    }
    catch {
        $script:FailCount++
        Write-Host "   FAIL: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Write-TestSummary {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " TEST SUMMARY" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Total Tests: $script:TotalCount" -ForegroundColor White
    Write-Host "Passed: $script:PassCount" -ForegroundColor Green
    Write-Host "Failed: $script:FailCount" -ForegroundColor Red
    
    $percentage = [math]::Round(($script:PassCount / $script:TotalCount) * 100, 2)
    Write-Host "Success Rate: $percentage%" -ForegroundColor $(if ($percentage -eq 100) { "Green" } else { "Yellow" })
    
    if ($script:FailCount -eq 0) {
        Write-Host "`nALL TESTS PASSED! System is production-ready." -ForegroundColor Green
    }
    else {
        Write-Host "`nSome tests failed. Please review errors above." -ForegroundColor Yellow
    }
}

#endregion

#region Test Execution

Write-TestHeader "TEMPLE MANAGEMENT SYSTEM VERIFICATION"
Write-Host "Testing endpoint: $BaseUrl`n" -ForegroundColor Gray

# ========================================
# SECTION 1: HEALTH & CONNECTIVITY
# ========================================
Write-SectionHeader "1. Health Check & Connectivity"

Test-Endpoint "API Health Check" {
    $response = Invoke-RestMethod -Uri "http://localhost:5000"
    if ($response.status -ne "Healthy") {
        throw "API not healthy"
    }
}

# ========================================
# SECTION 2: AUTHENTICATION
# ========================================
Write-SectionHeader "2. Authentication & User Management"

Test-Endpoint "Register Admin User" {
    $data = @{
        name     = "System Admin"
        email    = "admin@test.com"
        password = "Admin@12345"
        role     = "admin"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/auth/register" `
        -Method Post -Body $data -ContentType "application/json"
    
    $script:TestData.AdminToken = $response.token
    if (!$script:TestData.AdminToken) { throw "No admin token received" }
}

Test-Endpoint "Register Regular User" {
    $data = @{
        name     = "Test User"
        email    = "user@test.com"
        password = "User@12345"
        role     = "user"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/auth/register" `
        -Method Post -Body $data -ContentType "application/json"
    
    $script:TestData.UserToken = $response.token
    if (!$script:TestData.UserToken) { throw "No user token received" }
}

Test-Endpoint "Register Gatekeeper User" {
    $data = @{
        name     = "Gatekeeper"
        email    = "gatekeeper@test.com"
        password = "Gate@12345"
        role     = "gatekeeper"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/auth/register" `
        -Method Post -Body $data -ContentType "application/json"
    
    $script:TestData.GatekeeperToken = $response.token
    if (!$script:TestData.GatekeeperToken) { throw "No gatekeeper token received" }
}

# ========================================
# SECTION 3: AUTHORIZATION & SECURITY
# ========================================
Write-SectionHeader "3. Authorization & Security"

Test-Endpoint "JWT Token Validation" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/admin/health" `
        -Headers @{ "Authorization" = "Bearer $($script:TestData.AdminToken)" }
    
    if ($response.data.status -ne "healthy") { throw "Health check failed" }
}

Test-Endpoint "Block Unauthorized Access (401)" {
    try {
        Invoke-RestMethod -Uri "$BaseUrl/admin/stats"
        throw "Unauthorized request was allowed"
    }
    catch {
        if ($_.Exception.Response.StatusCode -ne 401) {
            throw "Expected 401, got $($_.Exception.Response.StatusCode)"
        }
    }
}

Test-Endpoint "Block Non-Admin from Admin Routes (403)" {
    try {
        Invoke-RestMethod -Uri "$BaseUrl/admin/stats" `
            -Headers @{ "Authorization" = "Bearer $($script:TestData.UserToken)" }
        throw "Non-admin access was allowed"
    }
    catch {
        if ($_.Exception.Response.StatusCode -ne 403) {
            throw "Expected 403, got $($_.Exception.Response.StatusCode)"
        }
    }
}

# ========================================
# SECTION 4: TEMPLE MANAGEMENT
# ========================================
Write-SectionHeader "4. Temple Management (CRUD)"

Test-Endpoint "Create Temple (Admin Only)" {
    $data = @{
        name     = "Test Temple"
        location = @{
            city  = "Mumbai"
            state = "Maharashtra"
        }
        capacity = @{
            total              = 500
            per_slot           = 50
            threshold_warning  = 85
            threshold_critical = 95
        }
        status   = "OPEN"
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri "$BaseUrl/temples" `
        -Method Post -Body $data `
        -Headers @{ "Authorization" = "Bearer $($script:TestData.AdminToken)" } `
        -ContentType "application/json"
    
    $script:TestData.TempleId = $response.data._id
    if (!$script:TestData.TempleId) { throw "No temple ID received" }
}

Test-Endpoint "Get All Temples (Public)" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/temples"
    if ($response.count -eq 0) { throw "No temples found" }
}

Test-Endpoint "Get Single Temple" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/temples/$($script:TestData.TempleId)"
    if ($response.data._id -ne $script:TestData.TempleId) { throw "Wrong temple returned" }
}

Test-Endpoint "Get Temple Live Status" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/temples/$($script:TestData.TempleId)/live"
    if ($null -eq $response.data.live_count) { throw "No live count" }
}

# ========================================
# SECTION 5: BOOKING SYSTEM
# ========================================
Write-SectionHeader "5. Booking System"

Test-Endpoint "Check Slot Availability" {
    $date = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    $slot = "10:00 AM - 11:00 AM"
    
    $url = "$BaseUrl/bookings/availability?templeId=$($script:TestData.TempleId)&date=$date&slot=$($slot -replace ' ','%20')"
    $response = Invoke-RestMethod -Uri $url
    
    if ($response.data.status -ne "AVAILABLE") { throw "Slot not available" }
}

Test-Endpoint "Create Booking" {
    $date = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    $data = @{
        templeId   = $script:TestData.TempleId
        templeName = "Test Temple"
        date       = $date
        slot       = "10:00 AM - 11:00 AM"
        visitors   = 5
        userName   = "Test User"
        userEmail  = "user@test.com"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/bookings" `
        -Method Post -Body $data `
        -Headers @{ "Authorization" = "Bearer $($script:TestData.UserToken)" } `
        -ContentType "application/json"
    
    $script:TestData.BookingId = $response.data._id
    $script:TestData.PassId = $response.data.passId
    
    if (!$script:TestData.BookingId) { throw "No booking ID" }
    if (!$script:TestData.PassId) { throw "No pass ID" }
}

Test-Endpoint "Prevent Overbooking" {
    $date = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    $data = @{
        templeId   = $script:TestData.TempleId
        templeName = "Test Temple"
        date       = $date
        slot       = "10:00 AM - 11:00 AM"
        visitors   = 50  # This would exceed capacity
        userName   = "Overbook User"
        userEmail  = "overbook@test.com"
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri "$BaseUrl/bookings" `
            -Method Post -Body $data `
            -Headers @{ "Authorization" = "Bearer $($script:TestData.UserToken)" } `
            -ContentType "application/json"
        throw "Overbooking was allowed"
    }
    catch {
        if ($_.Exception.Response.StatusCode -ne 400) {
            throw "Expected 400 for overbooking"
        }
    }
}

Test-Endpoint "QR Code Lookup (Public)" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/bookings/pass/$($script:TestData.PassId)"
    if ($response.data.pass_id -ne $script:TestData.PassId) { throw "Wrong pass returned" }
    if ($response.data.is_valid -ne $true) { throw "Pass not valid" }
}

Test-Endpoint "Get User Bookings" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/bookings?email=user@test.com" `
        -Headers @{ "Authorization" = "Bearer $($script:TestData.UserToken)" }
    
    if ($response.count -eq 0) { throw "No bookings found" }
}

# ========================================
# SECTION 6: LIVE CROWD TRACKING
# ========================================
Write-SectionHeader "6. Live Crowd Tracking"

Test-Endpoint "Record Entry (Gatekeeper)" {
    $data = @{
        templeId = $script:TestData.TempleId
        passId   = $script:TestData.PassId
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/live/entry" `
        -Method Post -Body $data `
        -Headers @{ "Authorization" = "Bearer $($script:TestData.GatekeeperToken)" } `
        -ContentType "application/json"
    
    if ($response.data.count -lt 1) { throw "Entry not recorded" }
}

Test-Endpoint "Prevent Duplicate Entry" {
    $data = @{
        templeId = $script:TestData.TempleId
        passId   = $script:TestData.PassId
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri "$BaseUrl/live/entry" `
            -Method Post -Body $data `
            -Headers @{ "Authorization" = "Bearer $($script:TestData.GatekeeperToken)" } `
            -ContentType "application/json"
        throw "Duplicate entry was allowed"
    }
    catch {
        if ($_.Exception.Response.StatusCode -ne 400) {
            throw "Expected 400 for duplicate"
        }
    }
}

Test-Endpoint "Get Live Dashboard" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/live/$($script:TestData.TempleId)"
    if ($null -eq $response.data.current_count) { throw "No count data" }
}

Test-Endpoint "Record Exit (Gatekeeper)" {
    $data = @{
        templeId = $script:TestData.TempleId
        passId   = $script:TestData.PassId
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/live/exit" `
        -Method Post -Body $data `
        -Headers @{ "Authorization" = "Bearer $($script:TestData.GatekeeperToken)" } `
        -ContentType "application/json"
    
    if ($null -eq $response.data.count) { throw "Exit not recorded" }
}

# ========================================
# SECTION 7: ADMIN DASHBOARD
# ========================================
Write-SectionHeader "7. Admin Dashboard & Analytics"

Test-Endpoint "Get Dashboard Statistics" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/admin/stats" `
        -Headers @{ "Authorization" = "Bearer $($script:TestData.AdminToken)" }
    
    if (!$response.data.overview) { throw "No overview data" }
}

Test-Endpoint "Get Crowd Analytics" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/admin/analytics" `
        -Headers @{ "Authorization" = "Bearer $($script:TestData.AdminToken)" }
    
    if (!$response.data.peak_hours) { throw "No analytics data" }
}

Test-Endpoint "Get Temple Report" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/admin/temples/$($script:TestData.TempleId)/report" `
        -Headers @{ "Authorization" = "Bearer $($script:TestData.AdminToken)" }
    
    if (!$response.temple) { throw "No temple report" }
}

Test-Endpoint "User Management (Pagination)" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/admin/users?limit=10" `
        -Headers @{ "Authorization" = "Bearer $($script:TestData.AdminToken)" }
    
    if ($response.count -eq 0) { throw "No users found" }
}

Test-Endpoint "Booking Management" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/admin/bookings?limit=10" `
        -Headers @{ "Authorization" = "Bearer $($script:TestData.AdminToken)" }
    
    if ($null -eq $response.count) { throw "No booking data" }
}

Test-Endpoint "System Health Check" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/admin/health" `
        -Headers @{ "Authorization" = "Bearer $($script:TestData.AdminToken)" }
    
    if ($response.data.status -ne "healthy") { throw "System unhealthy" }
    if ($response.data.database -ne "connected") { throw "Database not connected" }
    if ($response.data.redis -ne "connected") { throw "Redis not connected" }
}

# ========================================
# SECTION 8: CLEANUP & FINAL TESTS
# ========================================
Write-SectionHeader "8. Cleanup Operations"

Test-Endpoint "Cancel Booking (User)" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/bookings/$($script:TestData.BookingId)" `
        -Method Delete `
        -Headers @{ "Authorization" = "Bearer $($script:TestData.UserToken)" }
    
    if ($response.data.status -ne "CANCELLED") { throw "Booking not cancelled" }
}

#endregion

# Print final summary
Write-TestSummary

Write-Host "`nFeatures Tested:" -ForegroundColor Yellow
Write-Host "  - API Health & Connectivity" -ForegroundColor Gray
Write-Host "  - Authentication (JWT)" -ForegroundColor Gray
Write-Host "  - Authorization (RBAC)" -ForegroundColor Gray
Write-Host "  - Temple Management (CRUD)" -ForegroundColor Gray
Write-Host "  - Booking System (with overbooking prevention)" -ForegroundColor Gray
Write-Host "  - Live Crowd Tracking (Redis)" -ForegroundColor Gray
Write-Host "  - Admin Dashboard & Analytics" -ForegroundColor Gray
Write-Host "  - System Health Monitoring" -ForegroundColor Gray

Write-Host "`nDone!" -ForegroundColor Green
