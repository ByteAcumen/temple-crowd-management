# 🚀 For Collaborators - Complete Setup Guide

## ⚡ Quick Start (One Command Setup)

### Windows Users

```powershell
# Clone and setup everything automatically
git clone https://github.com/ByteAcumen/temple-crowd-management.git
cd temple-crowd-management
.\setup.ps1
```

### Linux/Mac Users

```bash
# Clone and setup everything automatically
git clone https://github.com/ByteAcumen/temple-crowd-management.git
cd temple-crowd-management
chmod +x setup.sh
./setup.sh
```

That's it! Everything will be automatically:
- ✅ Downloaded and installed
- ✅ Built with Docker
- ✅ Started and running
- ✅ Ready to test

---

## 📋 Prerequisites

Install these before running setup:

1. **Git** - [Download](https://git-scm.com/downloads)
2. **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
3. That's all! No Node.js, Python, or MongoDB installation needed.

---

## 🎯 Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ByteAcumen/temple-crowd-management.git
cd temple-crowd-management
```

### 2. Run Setup Script

**Windows:**
```powershell
.\setup.ps1
```

**Linux/Mac:**
```bash
./setup.sh
```

The script will:
1. Check prerequisites (Git, Docker)
2. Create environment files
3. Build all Docker containers
4. Start all services
5. Verify everything is running

### 3. Verify Installation

```powershell
# Check all services are running
docker-compose ps

# Test the backend API
curl http://localhost:5000

# Run full test suite
.\test-api.ps1

# Test ML services
.\test-ml.ps1
```

---

## 🐳 What Gets Started with Docker

The setup automatically starts:

| Service | Port | Description |
|---------|------|-------------|
| **Backend API** | 5000 | Node.js Express REST API |
| **MongoDB** | 27017 | Database for users, bookings, temples |
| **Redis** | 6379 | Caching and session storage |
| **ML Detection** | 8001 | YOLOv8 crowd detection service |
| **ML Forecasting** | 8002 | LSTM demand prediction service |

---

## 🧪 Testing Everything

### 1. Test Backend API

```powershell
# Automated test suite
.\test-api.ps1

# Manual tests
curl http://localhost:5000              # Health check
curl http://localhost:5000/api/v1       # API endpoints
```

### 2. Test ML Services

```powershell
# Test ML detection and forecasting
.\test-ml.ps1

# Check ML service health
curl http://localhost:8001/health       # Detection service
curl http://localhost:8002/health       # Forecasting service
```

### 3. Test User Authentication

```powershell
# Register a new user
curl -X POST http://localhost:5000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{"name":"John","email":"john@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"john@example.com","password":"pass123"}'
```

---

## 🔄 Daily Workflow

### Starting Your Day

```powershell
# Pull latest changes
git pull origin main

# Start all services
docker-compose up -d

# Check everything is running
docker-compose ps
```

### Making Changes

```powershell
# Make your code changes in backend/ or ml-services/

# Rebuild specific service
docker-compose build backend
docker-compose restart backend

# OR rebuild everything
docker-compose up -d --build
```

### Viewing Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f ml-detection
docker-compose logs -f ml-forecasting
```

### Stopping Services

```powershell
# Stop all services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

---

## 📁 Project Structure

```
temple-crowd-management/
│
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── server.js          # Server entry point
│   │   ├── models/            # MongoDB schemas
│   │   ├── controllers/       # Route handlers
│   │   ├── routes/            # API routes
│   │   └── middleware/        # JWT auth, validation
│   ├── Dockerfile             # Backend container config
│   └── package.json
│
├── ml-services/               # Python ML services
│   ├── crowd-detection/       # YOLOv8 person detection
│   │   ├── src/api.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── demand-forecasting/    # LSTM forecasting
│       ├── src/api.py
│       ├── Dockerfile
│       └── requirements.txt
│
├── docker-compose.yml         # Orchestrates all services
│
├── setup.ps1                  # Windows setup script
├── setup.sh                   # Linux/Mac setup script
├── test-api.ps1              # Backend testing
├── test-ml.ps1               # ML testing
│
└── Documentation/
    ├── README.md
    ├── QUICK_START.md
    └── START_HERE.md
```

---

## 🐛 Troubleshooting

### Docker containers won't start

```powershell
# Check Docker is running
docker ps

# Restart Docker Desktop, then:
docker-compose down
docker-compose up -d
```

### Port already in use

```powershell
# Windows: Find and kill process on port 5000
netstat -ano | findstr :5000
Stop-Process -Id <PID> -Force

# Then restart
docker-compose down
docker-compose up -d
```

### Cannot connect to backend

```powershell
# Check if backend is running
docker-compose ps

# View backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Database connection errors

```powershell
# Restart MongoDB
docker-compose restart mongo

# Check MongoDB is healthy
docker exec -it temple-mongo mongosh
```

### Fresh start (nuclear option)

```powershell
# Stop everything and remove all data
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
.\setup.ps1
```

---

## 🔧 Development Tips

### Hot Reload (Auto-restart on code changes)

```powershell
# For backend development
cd backend
npm run dev

# OR with Docker volume mount (already configured)
# Just edit files and Docker will auto-reload
```

### Access Database

```powershell
# MongoDB shell
docker exec -it temple-mongo mongosh

# View users
use temple_db
db.users.find().pretty()

# Redis CLI
docker exec -it temple-redis redis-cli
KEYS *
```

### Run Tests Inside Container

```powershell
# Execute commands inside backend container
docker exec -it temple-backend npm test

# Execute Python tests in ML container
docker exec -it temple-ml-detection pytest
```

### Debug with VS Code

1. Install Docker extension for VS Code
2. Attach to running container
3. Set breakpoints in code
4. Container will auto-reload

---

## 🚀 Deployment

### Production Deployment

```bash
# On production server
git clone https://github.com/ByteAcumen/temple-crowd-management.git
cd temple-crowd-management

# Set production environment
export NODE_ENV=production

# Start with production settings
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Cloud Deployment (AWS/Azure/GCP)

1. Push Docker images to registry
2. Deploy using Kubernetes or ECS
3. Configure load balancer
4. Setup auto-scaling
5. Enable monitoring

See `docs/DEPLOYMENT.md` for details.

---

## 📚 Additional Resources

- **Full Documentation:** [START_HERE.md](START_HERE.md)
- **API Testing Guide:** [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Project Plan:** [PROJECT_PLAN.md](PROJECT_PLAN.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes and test
4. Commit: `git commit -m "Add my feature"`
5. Push: `git push origin feature/my-feature`
6. Create Pull Request

---

## ❓ Getting Help

- **Issues:** Create an issue on GitHub
- **Questions:** Check existing documentation
- **Bugs:** Include logs and steps to reproduce

---

## ✅ Quick Commands Reference

```powershell
# Setup
.\setup.ps1                          # Initial setup

# Start/Stop
docker-compose up -d                 # Start all
docker-compose down                  # Stop all
docker-compose restart               # Restart all

# Testing
.\test-api.ps1                       # Test backend
.\test-ml.ps1                        # Test ML services
curl http://localhost:5000           # Quick health check

# Logs
docker-compose logs -f               # All logs
docker-compose logs -f backend       # Backend only

# Database
docker exec -it temple-mongo mongosh # MongoDB shell
docker exec -it temple-redis redis-cli # Redis CLI

# Rebuild
docker-compose up -d --build         # Rebuild all
docker-compose build backend         # Rebuild one service

# Clean up
docker-compose down -v               # Remove everything
```

---

## 🎉 You're Ready!

Once setup is complete, you'll have:
- ✅ Full backend API running
- ✅ Database configured
- ✅ ML services ready
- ✅ All tests passing
- ✅ Ready for development

**Happy coding! 🚀**
