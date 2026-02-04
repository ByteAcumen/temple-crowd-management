#!/bin/bash
# COLLABORATOR SETUP SCRIPT - Linux/Mac
# This script sets up the entire project in one command

set -e  # Exit on any error

echo "========================================="
echo " Temple Crowd Management - Setup"
echo "========================================="
echo ""

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites checked"
echo ""

# Clone repository (if not already cloned)
if [ ! -d ".git" ]; then
    echo "[1/4] Cloning repository..."
    read -p "Enter the repository URL: " REPO_URL
    git clone $REPO_URL .
    echo "✅ Repository cloned"
else
    echo "[1/4] Repository already exists"
    echo "✅ Pulling latest changes..."
    git pull origin main
fi
echo ""

# Create environment file
echo "[2/4] Setting up environment..."
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << EOF
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://mongo:27017/temple_db
JWT_SECRET=your-secret-key-change-in-production
REDIS_HOST=redis
REDIS_PORT=6379
ML_DETECTION_URL=http://ml-detection:8000
ML_FORECASTING_URL=http://ml-forecasting:8000
EOF
    echo "✅ Environment file created"
else
    echo "✅ Environment file already exists"
fi
echo ""

# Build and start Docker containers
echo "[3/4] Building Docker containers..."
echo "   This may take 5-10 minutes on first run..."
docker-compose build
echo "✅ Containers built"
echo ""

echo "[4/4] Starting all services..."
docker-compose up -d
echo "✅ All services started"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""

echo "========================================="
echo " Setup Complete!"
echo "========================================="
echo ""
echo "🚀 Services Running:"
echo "   • Backend API:    http://localhost:5000"
echo "   • MongoDB:        mongodb://localhost:27017"
echo "   • Redis:          redis://localhost:6379"
echo "   • ML Detection:   http://localhost:8001"
echo "   • ML Forecasting: http://localhost:8002"
echo ""
echo "📝 Next Steps:"
echo "   1. Test the API:        curl http://localhost:5000"
echo "   2. View logs:           docker-compose logs -f"
echo "   3. Stop services:       docker-compose down"
echo "   4. Restart services:    docker-compose restart"
echo ""
echo "📖 Documentation:"
echo "   • README.md"
echo "   • QUICK_START.md"
echo "   • START_HERE.md"
echo ""
