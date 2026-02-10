# Database Backup Script
# Backs up MongoDB data to local folder
#
# USAGE:
# powershell -ExecutionPolicy Bypass -File .\backup.ps1
# powershell -ExecutionPolicy Bypass -File .\backup.ps1 -Restore "backup_2024-02-09_123456"

param(
    [string]$Restore = $null
)

$ErrorActionPreference = "Stop"
$BACKUP_DIR = "$PSScriptRoot\backups"
$CONTAINER = "temple-mongo"
$DATABASE = "temple_db"

function Write-Pass { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Yellow }

# Create backup directory if not exists
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Info "Created backup directory: $BACKUP_DIR"
}

if ($Restore) {
    # =====================================
    # RESTORE DATABASE
    # =====================================
    Write-Host "`n=== DATABASE RESTORE ===" -ForegroundColor Cyan
    
    $backupPath = "$BACKUP_DIR\$Restore"
    if (-not (Test-Path $backupPath)) {
        Write-Fail "Backup not found: $backupPath"
        exit 1
    }
    
    Write-Info "Restoring from: $Restore"
    Write-Host "WARNING: This will REPLACE all current data!" -ForegroundColor Red
    $confirm = Read-Host "Type 'YES' to confirm"
    
    if ($confirm -ne "YES") {
        Write-Info "Restore cancelled"
        exit 0
    }
    
    # Copy backup to container
    Write-Info "Copying backup to container..."
    docker cp "$backupPath" "${CONTAINER}:/backup_restore"
    
    # Restore
    Write-Info "Restoring database..."
    docker exec $CONTAINER mongorestore --db $DATABASE --drop /backup_restore/$DATABASE
    
    # Cleanup
    docker exec $CONTAINER rm -rf /backup_restore
    
    Write-Pass "Database restored successfully!"
    
}
else {
    # =====================================
    # CREATE BACKUP
    # =====================================
    Write-Host "`n=== DATABASE BACKUP ===" -ForegroundColor Cyan
    
    $timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
    $backupName = "backup_$timestamp"
    $backupPath = "$BACKUP_DIR\$backupName"
    
    # Check if container is running
    $status = docker inspect $CONTAINER --format='{{.State.Status}}' 2>&1
    if ($status -ne "running") {
        Write-Fail "MongoDB container is not running"
        exit 1
    }
    
    Write-Info "Creating backup: $backupName"
    
    # Create backup inside container
    docker exec $CONTAINER mongodump --db $DATABASE --out /backup_temp
    
    # Copy to host
    docker cp "${CONTAINER}:/backup_temp" $backupPath
    
    # Cleanup container
    docker exec $CONTAINER rm -rf /backup_temp
    
    # Calculate size
    $size = (Get-ChildItem $backupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    $sizeStr = "{0:N2}" -f $size
    
    Write-Pass "Backup created: $backupPath ($sizeStr MB)"
    
    # List recent backups
    Write-Host "`nRecent backups:" -ForegroundColor Cyan
    Get-ChildItem $BACKUP_DIR -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object {
        $bsize = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "  - $($_.Name) ($("{0:N2}" -f $bsize) MB)" -ForegroundColor Gray
    }
}

Write-Host "`nBackup directory: $BACKUP_DIR" -ForegroundColor Gray
