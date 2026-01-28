# 🚀 Quick Start Guide - Temple Crowd Management System

## ✅ Everything is Working!

The backend API is fully functional with:
- ✅ MongoDB database connection
- ✅ Redis caching
- ✅ User authentication (Register/Login)
- ✅ JWT token generation
- ✅ Protected routes
- ✅ Input validation

---

## 🎯 Start Everything (Development Mode)

### Option 1: Automated Start (Recommended)

```powershell
# Start all services (MongoDB, Redis, Backend)
.\start-all.ps1

# Test the API
.\test-api.ps1

# Stop all services
.\stop-all.ps1
```

### Option 2: Manual Start

```powershell
# 1. Start MongoDB
docker run -d --name temple-mongo -p 27017:27017 mongo:latest

# 2. Start Redis
docker run -d --name temple-redis -p 6379:6379 redis:alpine

# 3. Start Backend
cd backend
node .\src\server.js
```

### Option 3: Docker Compose (Full Stack)

```powershell
# Start everything with Docker Compose
.\start-docker.ps1

# OR manually:
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop everything
docker-compose down
```

---

## 🧪 Testing the API

### Automated Tests

```powershell
.\test-api.ps1
```

This will test:
1. ✅ Health check endpoint
2. ✅ User registration
3. ✅ User login
4. ✅ Protected route access

### Manual API Testing

#### 1. Health Check
```powershell
curl http://localhost:5000
```

**Response:**
```json
{
  "service": "Temple Booking API",
  "status": "Healthy",
  "ai_link": "http://ai-service:8000"
}
```

#### 2. Register User
```powershell
curl -X POST http://localhost:5000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "697a0c8831a50fa30b3d99c4",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### 3. Login User
```powershell
curl -X POST http://localhost:5000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:** Same as registration

#### 4. Get Current User (Protected)
```powershell
$token = "YOUR_JWT_TOKEN_HERE"
curl -X GET http://localhost:5000/api/v1/auth/me `
  -H "Authorization: Bearer $token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "697a0c8831a50fa30b3d99c4",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2026-01-28T..."
  }
}
```

---

## 📊 Service Status

### Check Running Services

```powershell
# Check Docker containers
docker ps

# Check backend port
netstat -ano | findstr :5000

# Check MongoDB
docker logs temple-mongo

# Check Redis
docker logs temple-redis
```

### Access Points

| Service | URL | Status |
|---------|-----|--------|
| Backend API | http://localhost:5000 | ✅ Working |
| MongoDB | mongodb://localhost:27017 | ✅ Working |
| Redis | redis://localhost:6379 | ✅ Working |
| API Docs | http://localhost:5000/api/v1 | ✅ Working |

---

## 🐛 Troubleshooting

### Backend won't start

```powershell
# Check if MongoDB is running
docker ps | findstr mongo

# If not running, start it
docker start temple-mongo

# Check logs
docker logs temple-mongo
```

### Port 5000 already in use

```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
Stop-Process -Id <PID> -Force
```

### MongoDB connection error

```powershell
# Restart MongoDB
docker restart temple-mongo

# OR remove and recreate
docker rm -f temple-mongo
docker run -d --name temple-mongo -p 27017:27017 mongo:latest
```

### Redis connection errors

These are OK if you're not using Redis features yet. To fix:

```powershell
# Start Redis
docker start temple-redis

# OR create new
docker run -d --name temple-redis -p 6379:6379 redis:alpine
```

---

## 📁 Project Structure

```
temple-crowd-management/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── app.js          # Express app setup
│   │   ├── server.js       # Server entry point
│   │   ├── models/         # MongoDB models
│   │   │   └── User.js     # ✅ User model with bcrypt
│   │   ├── controllers/    # Route handlers
│   │   │   └── authController.js  # ✅ Register/Login
│   │   ├── routes/         # API routes
│   │   │   └── authRoutes.js      # ✅ Auth endpoints
│   │   ├── middleware/     # Express middleware
│   │   │   └── auth.js     # ✅ JWT protection
│   │   └── config/         # Configuration
│   │       ├── db.js       # MongoDB connection
│   │       └── redis.js    # Redis connection
│   ├── .env                # Environment variables
│   └── package.json        # Dependencies
├── ml-services/            # AI/ML services (WIP)
├── frontend/               # React app (WIP)
├── docker-compose.yml      # Docker orchestration
├── start-all.ps1           # ✅ Start everything
├── test-api.ps1            # ✅ API test suite
└── stop-all.ps1            # ✅ Stop all services
```

---

## 🎯 What's Implemented

### Backend API (40% Complete)

✅ **Working:**
- User authentication (register/login)
- JWT token generation
- Password hashing with bcrypt
- Protected routes with JWT middleware
- MongoDB integration
- Redis integration
- Input validation
- Error handling
- Security headers (helmet, cors, rate-limiting)

⏳ **Pending:**
- Temple management endpoints
- Booking system endpoints
- Live crowd monitoring endpoints
- Admin dashboard endpoints
- Chatbot endpoints

### ML Services (20% Complete)

✅ **Working:**
- FastAPI framework setup
- API endpoint structure

⏳ **Pending:**
- YOLOv8 person detection
- LSTM crowd forecasting
- Model training
- Real-time video processing

### Frontend (10% Complete)

✅ **Working:**
- React project structure
- Dependencies configured

⏳ **Pending:**
- UI components
- Authentication pages
- Dashboard
- Booking interface

---

## 📝 Next Steps

### Week 1 - Backend Development
1. Implement Temple model
2. Create temple CRUD endpoints
3. Implement Booking model
4. Create booking endpoints
5. Add admin authorization

### Week 2 - ML Integration
1. Download YOLOv8 weights
2. Implement person detection
3. Train LSTM model
4. Connect ML APIs to backend

### Week 3 - Frontend Development
1. Build login/register pages
2. Create dashboard layout
3. Implement booking interface
4. Add real-time crowd display

---

## 🔗 Useful Links

- **GitHub Repository:** https://github.com/ByteAcumen/temple-crowd-management.git
- **Project Plan:** [PROJECT_PLAN.md](PROJECT_PLAN.md)
- **Architecture:** [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Testing Guide:** [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Startup Guide:** [START_HERE.md](START_HERE.md)

---

## 💡 Development Tips

### Hot Reload

```powershell
# Backend with nodemon
cd backend
npm run dev
```

### View MongoDB Data

```powershell
# Connect to MongoDB
docker exec -it temple-mongo mongosh

# Use database
use temple_crowd_management

# View users
db.users.find().pretty()
```

### View Redis Data

```powershell
# Connect to Redis
docker exec -it temple-redis redis-cli

# View all keys
KEYS *

# Get a key
GET keyname
```

---

## ✅ Success Checklist

- [x] MongoDB running
- [x] Redis running
- [x] Backend API running
- [x] User registration working
- [x] User login working
- [x] JWT authentication working
- [x] Protected routes secured
- [x] All tests passing

**Status: 🎉 Core authentication system is fully functional!**
