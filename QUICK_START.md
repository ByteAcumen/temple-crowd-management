# Quick Start Guide

**Get the Temple Management System running in under 5 minutes!**

---

## Prerequisites

**Only 1 requirement**:
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed

That's it! Docker handles MongoDB, Redis, and the backend automatically.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Clone the Repository
```bash
git clone <your-repo-url>
cd temple-crowd-management
```

### Step 2: Start Everything!
```powershell
# Windows
.\scripts\start.ps1

# Linux/Mac
chmod +x scripts/start.sh
./scripts/start.sh
```

**That's it!** The script will:
- ✅ Check if Docker is running (start it if needed)
- ✅ Start MongoDB with health checks
- ✅ Start Redis with health checks
- ✅ Start Backend API (waits for DB to be ready)
- ✅ Show you when everything is ready

**Wait ~30 seconds** for all health checks to complete.

### Step 3: Verify It Works
```powershell
# Test the system
.\verify-system.ps1
```

**Expected**: ~90% tests passing (some features need data setup)

---

## 📍 Service URLs

Once started, access:
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api/v1
- **MongoDB**: mongodb://localhost:27017
- **Redis**: redis://localhost:6379

---

## 🛑 Stop Everything

```powershell
# Windows
.\scripts\stop.ps1

# Linux/Mac
./scripts/stop.sh
```

This cleanly stops all containers.

---

## ⚙️ Environment Variables (Optional)

**By default**: Everything works with Docker's built-in configuration.

**If you need to customize** (SMTP, Twilio, etc.):

1. **Create `.env` in backend folder** (only if needed):
```bash
cp .env.example backend/.env
```

2. **Edit backend/.env**:
```env
# Email (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS (Optional - for notifications)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

3. **Restart backend**:
```powershell
docker-compose -f docker-compose.dev.yml restart backend
```

**Note**: MongoDB and Redis URLs are automatically configured by Docker. Don't change them!

---

## 🧪 Running Tests

### Full System Test (Recommended)
```powershell
.\verify-system.ps1
```

Tests all 27 features:
- Authentication & Authorization
- Temple Management
- Booking System
- Live Crowd Tracking
- Admin Dashboard
- WebSocket Events

### First Time Running Tests?

**If tests fail because of duplicate data**:
```powershell
# Clear the database
docker exec temple-mongodb-dev mongosh temple-management --eval "db.dropDatabase()"

# Run tests again
.\verify-system.ps1
```

**Expected first-time success rate**: 90%+

---

## 🔧 Troubleshooting

### "Docker is not running"
**Fix**:
1. Open Docker Desktop
2. Wait for it to start (whale icon in system tray)
3. Run `.\scripts\start.ps1` again

### "Port 27017 already in use"
**Fix**:
```powershell
# Stop all Docker containers
docker stop $(docker ps -aq)

# Start fresh
.\scripts\start.ps1
```

### "Backend not responding"
**Fix**:
```powershell
# Check backend logs
docker-compose -f docker-compose.dev.yml logs backend

# Restart backend
docker-compose -f docker-compose.dev.yml restart backend

# Wait 10 seconds, then test
curl http://localhost:5000
```

### "MongoDB connection error"
**Symptoms**: Backend logs show "ECONNREFUSED" or "connection error"

**Fix**:
```powershell
# Restart all services
.\scripts\stop.ps1
.\scripts\start.ps1
```

### "Tests getting 400 errors on registration"
**Cause**: Users already exist in database from previous tests

**Fix**:
```powershell
# Clear users collection
docker exec temple-mongodb-dev mongosh temple-management --eval "db.users.drop()"

# Or clear entire database
docker exec temple-mongodb-dev mongosh temple-management --eval "db.dropDatabase()"

# Run tests again
.\verify-system.ps1
```

### Check Container Status
```powershell
# See which containers are running
docker ps

# Should show 3 containers:
# - temple-mongodb-dev (healthy)
# - temple-redis-dev (healthy)
# - temple-backend-dev (healthy)
```

### View Container Logs
```powershell
# Backend logs
docker-compose -f docker-compose.dev.yml logs backend

# MongoDB logs
docker-compose -f docker-compose.dev.yml logs mongodb

# Redis logs
docker-compose -f docker-compose.dev.yml logs redis

# All logs (follow mode)
docker-compose -f docker-compose.dev.yml logs -f
```

---

## 📚 Next Steps

### Learn the API
Check out the documentation in `docs/`:
- [Temple API](docs/TEMPLE_API.md) - Temple CRUD operations
- [Booking API](docs/BOOKING_API.md) - Booking management
- [Live Tracking API](docs/LIVE_TRACKING_API.md) - Entry/Exit tracking
- [Admin API](docs/ADMIN_API.md) - Dashboard & analytics
- [WebSocket Events](docs/WEBSOCKET_EVENTS.md) - Real-time updates

### Test Individual Features
```powershell
# Create a test user
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "Test@123"
    role = "user"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/register" -Method POST -Body $body -ContentType "application/json"
```

### Develop with Hot Reload
The backend has **hot reload** enabled - any code changes automatically restart the server!

1. Edit files in `backend/src/`
2. Save
3. Wait 2-3 seconds
4. Changes are live!

---

## 🎯 Common Development Tasks

### Add New Packages
```bash
cd backend
npm install package-name

# Rebuild Docker image
docker-compose -f docker-compose.dev.yml up -d --build
```

### Access MongoDB Directly
```bash
# Open MongoDB shell
docker exec -it temple-mongodb-dev mongosh temple-management

# Run queries
db.users.find()
db.temples.find()
db.bookings.find()
```

### Access Redis Directly
```bash
# Open Redis CLI
docker exec -it temple-redis-dev redis-cli

# Check data
KEYS *
GET temple:live:temple_id
```

### Reset Everything
```powershell
# Stop and remove all containers + volumes
docker-compose -f docker-compose.dev.yml down -v

# Start fresh
.\scripts\start.ps1
```

---

## ⚡ Performance Tips

### First Time Startup
- **First run**: ~2-3 minutes (downloading images)
- **Subsequent runs**: ~30 seconds (images cached)

### Running Status
- MongoDB: ~10-15 MB RAM
- Redis: ~5-10 MB RAM
- Backend: ~50-100 MB RAM

**Total**: ~100 MB RAM (very lightweight!)

---

## 🚨 Important Notes

### DO NOT:
- ❌ Edit `docker-compose.dev.yml` unless you know what you're doing
- ❌ Change MongoDB or Redis URLs in .env (Docker handles this)
- ❌ Commit `.env` files to git (they're in .gitignore)

### DO:
- ✅ Use `.\scripts\start.ps1` to start
- ✅ Use `.\scripts\stop.ps1` to stop
- ✅ Check logs if something fails
- ✅ Clear database if tests fail with "duplicate" errors
- ✅ Ask for help in Discord/Slack if stuck

---

## 📞 Getting Help

**Issues?**
1. Check [Troubleshooting](#-troubleshooting) section above
2. Check backend logs: `docker-compose -f docker-compose.dev.yml logs backend`
3. Open an issue on GitHub
4. Ask in team Discord/Slack

**System Info for Bug Reports**:
```powershell
# Get versions
docker --version
node --version
npm --version

# Get container status
docker ps -a

# Get backend logs (last 50 lines)
docker-compose -f docker-compose.dev.yml logs --tail=50 backend
```

---

## 🎉 You're Ready!

Your Temple Management System is now running!

- 🟢 MongoDB: Healthy
- 🟢 Redis: Healthy
- 🟢 Backend: Running at http://localhost:5000

**Happy coding! 🚀**
