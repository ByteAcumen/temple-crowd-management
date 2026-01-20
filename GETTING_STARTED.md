# 🚀 Getting Started with Temple Crowd Management System

## Quick Setup (Development)

### Prerequisites
- Node.js 18+
- Python 3.9+
- Docker & Docker Compose (recommended)
- Git

### Option 1: Docker Compose (Recommended)

1. **Clone Repository**
```bash
git clone https://github.com/yourusername/temple-crowd-management.git
cd temple-crowd-management
```

2. **Setup Environment Variables**
```bash
cp .env.example .env
# Edit .env with your configurations
```

3. **Start All Services**
```bash
cd infra
docker-compose up -d
```

4. **Check Status**
```bash
docker-compose ps
```

5. **Access Services**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1
- ML Detection: http://localhost:8001/docs
- ML Forecasting: http://localhost:8002/docs
- MongoDB: localhost:27017
- Redis: localhost:6379
- RabbitMQ Management: http://localhost:15672

### Option 2: Manual Setup

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env
npm start
```

#### ML Services
```bash
cd ml-services/crowd-detection
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn src.api:app --reload --port 8001
```

## Next Steps

1. **Read Documentation**
   - [PROJECT_PLAN.md](PROJECT_PLAN.md) - Complete implementation guide
   - [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture
   - [docs/API.md](docs/API.md) - API documentation (to be created)

2. **Install ML Models**
```bash
cd ml-services/crowd-detection
python scripts/download_models.py
```

3. **Run Tests**
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# ML Services
cd ml-services/crowd-detection && pytest
```

4. **Create First Temple**
```bash
curl -X POST http://localhost:5000/api/v1/temples \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Somnath Temple",
    "location": {"lat": 20.8879, "lng": 70.4011},
    "capacity": 10000
  }'
```

## Common Issues

### Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :5000  # Windows
lsof -i :5000  # Mac/Linux

# Kill the process or change port in .env
```

### MongoDB Connection Failed
```bash
# Ensure MongoDB is running
docker-compose ps mongodb

# Check logs
docker-compose logs mongodb
```

### Python Dependencies Error
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install with verbose output
pip install -r requirements.txt -v
```

## Development Workflow

1. Create feature branch
```bash
git checkout -b feature/your-feature-name
```

2. Make changes and test
```bash
npm test
```

3. Commit with meaningful message
```bash
git commit -m "Add: Brief description"
```

4. Push and create pull request
```bash
git push origin feature/your-feature-name
```

## Support

- **Email**: support@templecrowdmanagement.com
- **Issues**: [GitHub Issues](https://github.com/yourusername/temple-crowd-management/issues)
- **Documentation**: [docs/](docs/)

Happy coding! 🎉
