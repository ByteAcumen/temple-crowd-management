#!/bin/bash

# ========================================
# TEMPLE MANAGEMENT SYSTEM - ONE COMMAND START
# Development Environment with Docker (Linux/Mac)
# ========================================

echo ""
echo "========================================"
echo " TEMPLE MANAGEMENT SYSTEM - STARTUP"
echo "========================================"
echo ""

# Check Docker
echo "[1/4] Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "   ERROR: Docker not found!"
    echo "   Please install Docker from https://www.docker.com"
    exit 1
fi
echo "   Docker installed: $(docker --version)"

# Check if Docker is running
echo "[2/4] Checking if Docker is running..."
if ! docker ps &> /dev/null; then
    echo "   ERROR: Docker daemon is not running"
    echo "   Please start Docker and run this script again"
    exit 1
fi
echo "   Docker is running"

# Stop any existing containers
echo "[3/4] Cleaning up old containers..."
docker-compose -f docker-compose.dev.yml down -v 2>/dev/null
echo "   Cleanup complete"

# Start all services
echo "[4/4] Starting all services..."
echo "   This will:"
echo "   - Start MongoDB (with health checks)"
echo "   - Start Redis (with health checks)"
echo "   - Start Backend API (after DB ready)"
echo ""

docker-compose -f docker-compose.dev.yml up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo " SUCCESS! SERVICES STARTED"
    echo "========================================"
    echo ""
    
    echo "Waiting for health checks (30 seconds)..."
    sleep 30
    
    echo ""
    echo "Service URLs:"
    echo "  Backend API: http://localhost:5000"
    echo "  MongoDB: mongodb://localhost:27017"
    echo "  Redis: redis://localhost:6379"
    
    echo ""
    echo "Next Steps:"
    echo "  1. Test system:"
    echo "     ./verify-system.ps1"
    echo ""
    echo "  2. View logs:"
    echo "     docker-compose -f docker-compose.dev.yml logs -f"
    echo ""
    echo "  3. Stop services:"
    echo "     ./scripts/stop.sh"
    echo ""
else
    echo ""
    echo "ERROR: Failed to start services"
    echo "Run 'docker-compose -f docker-compose.dev.yml logs' to see errors"
    exit 1
fi
