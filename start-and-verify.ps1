# ==========================================
# START BACKEND & RUN VERIFICATION
# Run when Docker Desktop is fully started
# ==========================================

$ErrorActionPreference = "Stop"

function Write-Step { param([string]$M) Write-Host "`n>> $M" -ForegroundColor Cyan }
function Write-Ok { param([string]$M) Write-Host "OK: $M" -ForegroundColor Green }
function Write-Fail { param([string]$M) Write-Host "FAIL: $M" -ForegroundColor Red; exit 1 }

# 1. Verify Docker
Write-Step "Checking Docker..."
$dockerOk = $false
try {
    $out = docker info 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0 -and $out -match "Server Version") { $dockerOk = $true }
} catch { }
if (-not $dockerOk) {
    Write-Fail "Docker is not running. Start Docker Desktop, wait until it shows 'Engine running' in the tray, then run this script again."
}

Write-Ok "Docker is ready"

# 2. Stop old, start fresh
Write-Step "Starting backend services..."
docker compose down --remove-orphans 2>$null
docker compose up -d --build mongo redis ml-detection ml-forecasting backend
if ($LASTEXITCODE -ne 0) { Write-Fail "Docker Compose failed" }
Write-Ok "Containers started"

# 3. Wait for health
Write-Step "Waiting for backend to be healthy (up to 90s)..."
$ok = $false
for ($i = 0; $i -lt 18; $i++) {
    Start-Sleep -Seconds 5
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:5000" -TimeoutSec 5
        if ($r.status -eq "Healthy") { $ok = $true; break }
    } catch {}
    Write-Host -NoNewline "."
}
if (-not $ok) { Write-Fail "Backend did not become healthy. Check: docker logs temple-backend" }
Write-Ok "Backend is healthy"

# 4. Run verification
Write-Step "Running verification tests..."
Set-Location $PSScriptRoot
& .\verify-system.ps1

Write-Host "`n" -NoNewline
Write-Ok "Backend running at http://localhost:5000 | API: http://localhost:5000/api/v1"
