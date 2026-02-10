# Diagnostic script - run in PowerShell (outside Cursor)
# Right-click -> "Run with PowerShell" or open PowerShell and run: .\diagnose.ps1

Write-Host "`n=== Temple Backend Diagnostic ===" -ForegroundColor Cyan

# 1. Docker
Write-Host "`n[1] Docker:" -ForegroundColor Yellow
try {
    $dockerOut = docker info 2>&1 | Out-String
    if ($dockerOut -match "Server Version") {
        Write-Host "   OK Docker is running" -ForegroundColor Green
    } else {
        Write-Host "   FAIL Docker daemon not reachable" -ForegroundColor Red
        Write-Host "   -> Start Docker Desktop, wait for 'Engine running'" -ForegroundColor Gray
    }
} catch {
    Write-Host "   FAIL Docker error: $_" -ForegroundColor Red
}

# 2. Ports
Write-Host "`n[2] Ports (5000=backend, 27017=mongo, 6379=redis):" -ForegroundColor Yellow
foreach ($port in @(5000, 27017, 6379)) {
    $conn = Test-NetConnection localhost -Port $port -WarningAction SilentlyContinue
    $status = if ($conn.TcpTestSucceeded) { "in use" } else { "free" }
    $color = if ($port -eq 5000 -and $conn.TcpTestSucceeded) { "Green" } else { "Gray" }
    Write-Host "   Port $port : $status" -ForegroundColor $color
}

# 3. Backend .env
Write-Host "`n[3] Config:" -ForegroundColor Yellow
$envPath = "backend\.env"
if (Test-Path $envPath) {
    Write-Host "   OK backend\.env exists" -ForegroundColor Green
} else {
    Write-Host "   WARN backend\.env missing (optional for minimal Docker)" -ForegroundColor Yellow
}

# 4. Containers
Write-Host "`n[4] Docker containers:" -ForegroundColor Yellow
$containers = docker ps -a --format "{{.Names}} {{.Status}}" 2>&1
if ($containers -match "temple") {
    $containers | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "   No temple containers (run .\run-docker.ps1)" -ForegroundColor Gray
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "If Docker FAIL: Open Docker Desktop, wait 1-2 min, try again" -ForegroundColor White
Write-Host "Then run: .\run-docker.ps1" -ForegroundColor White
Write-Host ""
