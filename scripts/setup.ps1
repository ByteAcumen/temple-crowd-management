# COLLABORATOR SETUP SCRIPT - Windows PowerShell
# This script sets up the entire project in one command

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Temple Crowd Management - Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Git
try {
    $gitVersion = git --version
    Write-Host "[OK] Git: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Git is not installed!" -ForegroundColor Red
    Write-Host "   Download from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Host "[OK] Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not installed!" -ForegroundColor Red
    Write-Host "   Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check Docker Compose
try {
    $composeVersion = docker-compose --version
    Write-Host "[OK] Docker Compose: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker Compose is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Clone or pull repository
if (-not (Test-Path ".git")) {
    Write-Host "[1/4] Cloning repository..." -ForegroundColor Yellow
    $repoUrl = Read-Host "Enter the repository URL"
    git clone $repoUrl .
    Write-Host "[OK] Repository cloned" -ForegroundColor Green
} else {
    Write-Host "[1/4] Repository already exists" -ForegroundColor Yellow
    Write-Host "   Pulling latest changes..." -ForegroundColor Gray
    git pull origin main
    Write-Host "[OK] Updated to latest version" -ForegroundColor Green
}
Write-Host ""

# Create environment file
Write-Host "[2/4] Setting up environment..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    @"
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://mongo:27017/temple_db
JWT_SECRET=your-secret-key-change-in-production
REDIS_HOST=redis
REDIS_PORT=6379
ML_DETECTION_URL=http://ml-detection:8000
ML_FORECASTING_URL=http://ml-forecasting:8000
"@ | Out-File -FilePath "backend\.env" -Encoding UTF8
    Write-Host "[OK] Environment file created" -ForegroundColor Green
} else {
    Write-Host "[OK] Environment file already exists" -ForegroundColor Green
}
Write-Host ""

# Build Docker containers
Write-Host "[3/4] Building Docker containers..." -ForegroundColor Yellow
Write-Host "   This may take 5-10 minutes on first run..." -ForegroundColor Gray
docker-compose build
Write-Host "[OK] Containers built" -ForegroundColor Green
Write-Host ""

# Start services
Write-Host "[4/4] Starting all services..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "[OK] All services started" -ForegroundColor Green
Write-Host ""

# Wait for services
Write-Host "[WAIT] Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check service health
Write-Host ""
Write-Host "Service Status:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""

# Test backend
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000" -Method Get -TimeoutSec 5
    Write-Host "[OK] Backend is responding!" -ForegroundColor Green
    Write-Host "   Service: $($response.service)" -ForegroundColor Gray
} catch {
    Write-Host "[WARN] Backend is still starting... (wait 30 seconds and try: curl http://localhost:5000)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Setup Complete!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services Running:" -ForegroundColor Green
Write-Host "   - Backend API:    http://localhost:5000" -ForegroundColor Gray
Write-Host "   - MongoDB:        mongodb://localhost:27017" -ForegroundColor Gray
Write-Host "   - Redis:          redis://localhost:6379" -ForegroundColor Gray
Write-Host "   - ML Detection:   http://localhost:8001" -ForegroundColor Gray
Write-Host "   - ML Forecasting: http://localhost:8002" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test the API:        .\test-api.ps1" -ForegroundColor Gray
Write-Host "   2. View logs:           docker-compose logs -f" -ForegroundColor Gray
Write-Host "   3. Stop services:       docker-compose down" -ForegroundColor Gray
Write-Host "   4. Restart services:    docker-compose restart" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "   - README.md" -ForegroundColor Gray
Write-Host "   - QUICK_START.md" -ForegroundColor Gray
Write-Host "   - START_HERE.md" -ForegroundColor Gray
Write-Host ""
