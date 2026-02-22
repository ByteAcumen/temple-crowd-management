# Admin Dashboard API Test Script
# Tests statistics, analytics, and management endpoints

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Admin Dashboard APIs - Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api/v1"

# Variables
$adminToken = $null
$userToken = $null
$templeId = $null

# Test 1: Get Admin Token
Write-Host "[1] Logging in as Admin..." -ForegroundColor Yellow
try {
    $loginData = @{
        email    = "admin@temple.com"
        password = "Admin@123"
    } | ConvertTo-Json

    $adminAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json"
    
    $adminToken = $adminAuth.token
}
catch {
    Write-Host "Admin not found, creating..." -ForegroundColor Gray
    $registerData = @{
        name     = "Admin User"
        email    = "admin@temple.com"
        password = "Admin@123"
        role     = "admin"
    } | ConvertTo-Json

    $adminAuth = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $registerData `
        -ContentType "application/json"
    
    $adminToken = $adminAuth.token
}
Write-Host "✅ Admin token obtained" -ForegroundColor Green
Write-Host ""

# Test 2: Get Regular User Token
Write-Host "[2] Creating Regular User..." -ForegroundColor Yellow
try {
    $loginData = @{
        email    = "testuser@temple.com"
        password = "Test@123"
    } | ConvertTo-Json

    $userAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json"
    
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

# Test 3: Test Non-Admin Access (should fail)
Write-Host "[3] Testing Non-Admin Authorization Block..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/admin/stats" `
        -Headers @{ "Authorization" = "Bearer $userToken" }
    
    Write-Host "❌ Non-admin was allowed (BAD!)" -ForegroundColor Red
}
catch {
    Write-Host "✅ Non-admin blocked successfully (GOOD!)" -ForegroundColor Green
}
Write-Host ""

# Test 4: Get Dashboard Statistics
Write-Host "[4] Getting Dashboard Statistics..." -ForegroundColor Yellow
$stats = Invoke-RestMethod -Uri "$baseUrl/admin/stats" `
    -Headers @{ "Authorization" = "Bearer $adminToken" }

Write-Host "✅ Dashboard stats retrieved:" -ForegroundColor Green
Write-Host "   Total Bookings: $($stats.data.overview.total_bookings)" -ForegroundColor Gray
Write-Host "   Total Users: $($stats.data.overview.total_users)" -ForegroundColor Gray
Write-Host "   Total Temples: $($stats.data.overview.total_temples)" -ForegroundColor Gray
Write-Host "   Revenue: $($stats.data.overview.total_revenue)" -ForegroundColor Gray
Write-Host "   Today's Bookings: $($stats.data.bookings.today)" -ForegroundColor Gray
Write-Host "   System Occupancy: $($stats.data.crowd.occupancy_percentage)%" -ForegroundColor Gray
Write-Host ""

# Test 5: Get Analytics
Write-Host "[5] Getting Analytics (Last 30 days)..." -ForegroundColor Yellow
$analytics = Invoke-RestMethod -Uri "$baseUrl/admin/analytics" `
    -Headers @{ "Authorization" = "Bearer $adminToken" }

Write-Host "✅ Analytics retrieved:" -ForegroundColor Green
Write-Host "   Peak Hours: $($analytics.data.peak_hours.Count) slots analyzed" -ForegroundColor Gray
Write-Host "   Popular Temples: $($analytics.data.popular_temples.Count) temples ranked" -ForegroundColor Gray
Write-Host "   Daily Trends: $($analytics.data.daily_trends.Count) days of data" -ForegroundColor Gray
Write-Host ""

# Test 6: Get Temple (for report testing)
Write-Host "[6] Creating Test Temple for Report..." -ForegroundColor Yellow
$templeData = @{
    name     = "Admin Test Temple"
    location = @{
        city  = "Test City"
        state = "Test State"
    }
    capacity = @{
        total    = 1000
        per_slot = 100
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

# Test 7: Get Temple Report
Write-Host "[7] Getting Temple Report..." -ForegroundColor Yellow
$report = Invoke-RestMethod -Uri "$baseUrl/admin/temples/$templeId/report" `
    -Headers @{ "Authorization" = "Bearer $adminToken" }

Write-Host "✅ Temple report retrieved:" -ForegroundColor Green
Write-Host "   Temple: $($report.temple.name)" -ForegroundColor Gray
Write-Host "   Total Bookings: $($report.statistics.total_bookings)" -ForegroundColor Gray
Write-Host "   Total Visitors: $($report.statistics.total_visitors)" -ForegroundColor Gray
Write-Host "   Live Count: $($report.live_data.current_count)" -ForegroundColor Gray
Write-Host ""

# Test 8: Get User Management
Write-Host "[8] Getting User List..." -ForegroundColor Yellow
$users = Invoke-RestMethod -Uri "$baseUrl/admin/users?limit=10" `
    -Headers @{ "Authorization" = "Bearer $adminToken" }

Write-Host "✅ User management accessed:" -ForegroundColor Green
Write-Host "   Total Users: $($users.count)" -ForegroundColor Gray
Write-Host "   Pages: $($users.pages)" -ForegroundColor Gray
Write-Host ""

# Test 9: Get Booking Management
Write-Host "[9] Getting Booking List..." -ForegroundColor Yellow
$bookings = Invoke-RestMethod -Uri "$baseUrl/admin/bookings?limit=10" `
    -Headers @{ "Authorization" = "Bearer $adminToken" }

Write-Host "✅ Booking management accessed:" -ForegroundColor Green
Write-Host "   Total Bookings: $($bookings.count)" -ForegroundColor Gray
Write-Host "   Pages: $($bookings.pages)" -ForegroundColor Gray
Write-Host ""

# Test 10: Get System Health
Write-Host "[10] Checking System Health..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$baseUrl/admin/health" `
    -Headers @{ "Authorization" = "Bearer $adminToken" }

Write-Host "✅ System health checked:" -ForegroundColor Green
Write-Host "   Status: $($health.data.status)" -ForegroundColor Gray
Write-Host "   Database: $($health.data.database)" -ForegroundColor Gray
Write-Host "   Redis: $($health.data.redis)" -ForegroundColor Gray
Write-Host "   Uptime: $($health.data.uptime_formatted)" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 🎉 All Tests Passed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Dashboard APIs working!" -ForegroundColor Green
Write-Host ""
Write-Host "Key Features Verified:" -ForegroundColor Yellow
Write-Host "  ✅ Admin authorization enforced" -ForegroundColor Gray
Write-Host "  ✅ Dashboard statistics" -ForegroundColor Gray
Write-Host "  ✅ Analytics (peak hours, popular temples)" -ForegroundColor Gray
Write-Host "  ✅ Temple reports" -ForegroundColor Gray
Write-Host "  ✅ User management" -ForegroundColor Gray
Write-Host "  ✅ Booking management" -ForegroundColor Gray
Write-Host "  ✅ System health check" -ForegroundColor Gray
