# 🔧 Troubleshooting Guide - Backend Not Responding

## ❌ Error: "Backend is not responding on port 5000"

This means the backend server is not running. Follow these steps to fix it:

---

## ✅ Quick Fix (3 Steps)

### Step 1: Start MongoDB and Redis

```powershell
# Start MongoDB
docker run -d --name temple-mongo -p 27017:27017 mongo:latest

# Start Redis
docker run -d --name temple-redis -p 6379:6379 redis:alpine
```

### Step 2: Navigate to Backend Folder

```powershell
cd D:\temple-crowd-management\backend
```

### Step 3: Start the Backend

```powershell
# Install dependencies (first time only)
npm install

# Start the backend
node src/server.js
```

You should see:
```
🔌 Connecting to Redis at localhost:6379...
✅ Redis Connected Successfully
🚀 Backend running on port 5000
```

### Step 4: Test It

Open a **NEW PowerShell window** and run:
```powershell
cd D:\temple-crowd-management
.\test-api.ps1
```

---

## 🚀 Easier Method - Use Automated Script

```powershell
cd D:\temple-crowd-management
.\start-all.ps1
```

This starts everything automatically!

---

## 🐛 If Still Not Working - Detailed Diagnosis

### Check 1: Is Port 5000 Already in Use?

```powershell
# Find what's using port 5000
netstat -ano | findstr :5000
```

**If you see output**, port 5000 is occupied:

```powershell
# Kill the process (replace PID with actual number from above)
Stop-Process -Id <PID> -Force

# Example: Stop-Process -Id 12345 -Force
```

Then start backend again.

---

### Check 2: Is MongoDB Running?

```powershell
# Check MongoDB container status
docker ps | findstr mongo
```

**If nothing appears**, MongoDB is not running:

```powershell
# Remove old container (if exists)
docker rm -f temple-mongo

# Start fresh MongoDB
docker run -d --name temple-mongo -p 27017:27017 mongo:latest

# Verify it's running
docker ps
```

---

### Check 3: Is Redis Running?

```powershell
# Check Redis container status
docker ps | findstr redis
```

**If nothing appears**, Redis is not running:

```powershell
# Remove old container (if exists)
docker rm -f temple-redis

# Start fresh Redis
docker run -d --name temple-redis -p 6379:6379 redis:alpine

# Verify it's running
docker ps
```

---

### Check 4: Backend Crash or Error?

If backend starts but immediately stops:

```powershell
cd backend

# Check for errors
node src/server.js
```

**Common errors and fixes:**

#### Error: "Cannot find module 'express'"
```powershell
# Install dependencies
npm install
```

#### Error: "EADDRINUSE: Port 5000 already in use"
```powershell
# Kill process on port 5000
netstat -ano | findstr :5000
Stop-Process -Id <PID> -Force
```

#### Error: "MongoNetworkError: connect ECONNREFUSED"
```powershell
# MongoDB is not running - start it
docker start temple-mongo

# OR create new one
docker run -d --name temple-mongo -p 27017:27017 mongo:latest
```

#### Error: "Redis connection error"
```powershell
# Redis is not running - start it
docker start temple-redis

# OR create new one
docker run -d --name temple-redis -p 6379:6379 redis:alpine
```

---

## 📋 Complete Restart (Nuclear Option)

If nothing works, do a complete clean restart:

```powershell
# Stop all Docker containers
docker stop $(docker ps -aq)

# Remove old containers
docker rm -f temple-mongo temple-redis

# Clean start
cd D:\temple-crowd-management

# Start MongoDB
docker run -d --name temple-mongo -p 27017:27017 mongo:latest

# Start Redis
docker run -d --name temple-redis -p 6379:6379 redis:alpine

# Wait 5 seconds for containers to be ready
Start-Sleep -Seconds 5

# Start backend
cd backend
npm install
node src/server.js
```

---

## ✅ Verify Everything is Running

```powershell
# Check Docker containers
docker ps

# Should show:
# temple-mongo  (port 27017)
# temple-redis  (port 6379)

# Check backend port
netstat -ano | findstr :5000

# Should show backend process listening on 5000
```

---

## 🎯 After Backend Starts Successfully

Open a **NEW terminal window** and test:

```powershell
cd D:\temple-crowd-management
.\test-api.ps1
```

You should see:
```
✅ Backend is running!
✅ User logged in successfully!
✅ Protected route works!
🎉 All tests passed!
```

---

## 💡 Pro Tip: Keep Backend Running

**Don't close the backend terminal window!**

The backend needs to keep running while you test. You should have:
- **Window 1**: Backend running (`node src/server.js`)
- **Window 2**: Running tests (`.\test-api.ps1`)

---

## 🆘 Still Having Issues?

### Check Environment File

```powershell
cd backend

# Check if .env file exists
ls .env
```

If it doesn't exist:

```powershell
# Copy from example
cp .env.example .env
```

Edit `.env` and set:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/temple_crowd_management
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key-change-this-in-production
```

---

## 📞 Quick Help Checklist

Before asking for help, confirm:
- [ ] Docker is installed and running
- [ ] MongoDB container is running (`docker ps | findstr mongo`)
- [ ] Redis container is running (`docker ps | findstr redis`)
- [ ] Backend dependencies installed (`npm install` in backend folder)
- [ ] No error messages when starting backend
- [ ] Port 5000 is not used by another app

---

**Still stuck? Share:**
1. Error message screenshot
2. Output of `docker ps`
3. Output of backend startup (`node src/server.js`)
