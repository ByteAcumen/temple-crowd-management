# =============================================================
# Temple Crowd Management - Stop All Services
# =============================================================
# USAGE:
#   .\stop-all.ps1              → Stop dev containers
#   .\stop-all.ps1 -Production  → Stop production containers
#   .\stop-all.ps1 -All         → Stop all temple-* containers
# =============================================================

param(
    [switch]$Production,
    [switch]$All
)

function Write-OK   { param($m) Write-Host "  ✅ $m" -ForegroundColor Green }
function Write-Info { param($m) Write-Host "  ℹ  $m" -ForegroundColor Yellow }
function Write-Step { param($m) Write-Host "  ▶  $m" -ForegroundColor White }

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "`n  🛑 Stopping Temple Crowd Management Services..." -ForegroundColor Red

if ($All) {
    Write-Step "Stopping ALL temple containers (dev + prod)..."
    docker compose -f docker-compose.dev.yml down --remove-orphans 2>&1 | Out-Null
    docker compose -f docker-compose.yml     down --remove-orphans 2>&1 | Out-Null
    Write-OK "All containers stopped."
} elseif ($Production) {
    Write-Step "Stopping Production containers..."
    docker compose -f docker-compose.yml down --remove-orphans 2>&1 | Out-Null
    Write-OK "Production containers stopped."
} else {
    Write-Step "Stopping Development containers..."
    docker compose -f docker-compose.dev.yml down --remove-orphans 2>&1 | Out-Null
    Write-OK "Development containers stopped."
}

# Kill any hanging node processes (optional safety net)
$nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcs) {
    Write-Info "Found $($nodeProcs.Count) lingering node process(es) — stopping..."
    $nodeProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-OK "Node processes cleared."
}

Write-Host "  Data is preserved in named Docker volumes." -ForegroundColor Gray
Write-Host "  Run .\start.ps1 to restart.`n" -ForegroundColor Gray

