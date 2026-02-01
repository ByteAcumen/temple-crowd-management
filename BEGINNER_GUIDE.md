# 🕉️ Temple Crowd Management System - Beginner's Guide

## 📖 Table of Contents
1. [What is This Project?](#what-is-this-project)
2. [Why Does This Project Exist?](#why-does-this-project-exist)
3. [How Does It Work? (Simple Explanation)](#how-does-it-work-simple-explanation)
4. [Project Architecture (For Beginners)](#project-architecture-for-beginners)
5. [Getting Started - Step by Step](#getting-started---step-by-step)
6. [Understanding the Code Structure](#understanding-the-code-structure)
7. [Common Troubleshooting](#common-troubleshooting)
8. [Next Steps for Learning](#next-steps-for-learning)

---

## What is This Project?

**Temple Crowd Management System** is a smart digital platform that helps manage crowds at religious temples to prevent dangerous overcrowding and stampedes.

Think of it like this:
- **Normal ticketing system**: "Buy a ticket, show up whenever" → Can cause overcrowding
- **Our smart system**: "Book a specific time slot, AI predicts crowd levels, real-time monitoring ensures safety" → Much safer!

### Real-World Example
Imagine you're visiting **Somnath Temple** during a festival:
1. You open your phone and see: "🔴 Temple is VERY crowded right now (12,000 people)"
2. The AI suggests: "🟢 Best time to visit: 4 PM today (only 2,500 expected)"
3. You book a slot for 4 PM and get a digital pass (QR code)
4. When you arrive, the gatekeeper scans your QR code and lets you in

**Result**: You avoid the crowd, have a peaceful darshan, and everyone stays safe!

---

## Why Does This Project Exist?

### The Problem
Every year at major temples in India:
- **Stampedes kill hundreds** during festivals (Kumbh Mela, Hanuman Jayanti, etc.)
- **Uncontrolled crowds** mix together (people with tickets + walk-ins)
- **No real-time data** - administrators don't know the exact crowd count
- **No prediction** - can't plan for sudden surges (weather, VIP visits, holidays)

### Our Solution
This system uses **3 powerful technologies** to solve these problems:

1. **Real-Time Counting (Redis)**
   - Every person entering/exiting is counted **instantly**
   - Admins see a live dashboard: "4,523 people inside right now"
   - If capacity reaches 85%, system alerts: "🟡 Getting crowded!"

2. **AI Crowd Prediction (Machine Learning)**
   - Analyzes weather, holidays, historical data
   - Predicts: "Tomorrow at 2 PM, expect 8,000 people - increase capacity"
   - Adjusts time slots dynamically

3. **Smart Booking System (Backend API)**
   - People book specific time slots online
   - Get digital QR code passes
   - Walk-ins are tracked separately
   - Both systems ensure total capacity is never exceeded

---

## How Does It Work? (Simple Explanation)

### The Journey of a Devotee

```
┌─────────────────┐
│ 1. Devotee      │
│    Opens App    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ 2. AI Says:     │
│ "Tomorrow 3 PM  │
│  less crowded"  │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ 3. Books Slot + │
│    Gets QR Code │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ 4. At Temple    │
│    Gatekeeper   │
│    Scans QR     │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ 5. Entry Count +1│
│ (Redis updates) │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ 6. Admin Sees   │
│ Live Dashboard  │
│ "Safe - 45%"    │
└─────────────────┘
```

### Behind the Scenes (Technical Flow)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Frontend   │◄─────►│   Backend    │◄─────►│   Database   │
│ (React App)  │       │  (Node.js)   │       │  (MongoDB)   │
└──────────────┘       └──────┬───────┘       └──────────────┘
                              │      
                              ├─────►┌──────────────┐
                              │      │  Redis       │
                              │      │ (Live Count) │
                              │      └──────────────┘
                              │
                              └─────►┌──────────────┐
                                     │  Python AI   │
                                     │ (Forecasting)│
                                     └──────────────┘
```

---

## Project Architecture (For Beginners)

### What is "Architecture"?
Architecture is like a **blueprint** of how all the pieces fit together. Just like a house has rooms (kitchen, bedroom, bathroom), our system has components (backend, frontend, database, AI).

### Our System Has 5 Main Parts:

#### 1. **Frontend (The Face)**
- **What**: The app/website users see
- **Technology**: React.js (JavaScript framework)
- **Files**: `frontend/` folder
- **Does**: Shows booking page, displays crowd levels, generates QR codes

#### 2. **Backend (The Brain)**
- **What**: Processes all requests, business logic
- **Technology**: Node.js + Express
- **Files**: `backend/` folder
- **Does**: 
  - Handles user login/registration
  - Creates bookings
  - Talks to database
  - Connects frontend with AI services

#### 3. **Database (The Memory)**
- **What**: Stores permanent data
- **Technology**: MongoDB (NoSQL database)
- **Stores**:
  - User accounts (name, email, password)
  - Booking history
  - Temple information
  - Gatekeeper data

#### 4. **Redis (The Live Counter)**
- **What**: Super-fast temporary storage
- **Technology**: Redis (in-memory database)
- **Does**: 
  - Tracks real-time crowd count
  - Updates every second
  - Example: `somnath_live_count: 4523`

#### 5. **AI Services (The Forecaster)**
- **What**: Python services that predict crowds
- **Technology**: Python + FastAPI + Machine Learning
- **Files**: `ml-services/` folder
- **Does**:
  - **Crowd Detection**: Analyzes CCTV footage to count people
  - **Demand Forecasting**: Predicts future crowd levels

---

## Getting Started - Step by Step

### Prerequisites (What You Need Installed)

1. **Docker Desktop** - Runs all services in containers
   - [Download Docker](https://www.docker.com/products/docker-desktop/)
   - Why? So you DON'T need to install Node.js, Python, MongoDB manually!

2. **Git** - Version control
   - [Download Git](https://git-scm.com/downloads)

That's it! Just 2 things!

### Step 1: Clone the Project

Open PowerShell (Windows) or Terminal (Mac/Linux):

```powershell
# Navigate to where you want the project
cd D:\  # Or wherever you want

# Clone the repository
git clone https://github.com/ByteAcumen/temple-crowd-management.git

# Enter the project folder
cd temple-crowd-management
```

### Step 2: Start Everything with One Command!

This project is **fully automated**. Just run:

**Windows:**
```powershell
.\setup.ps1
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**What this does (automatically):**
- ✅ Builds all Docker containers
- ✅ Starts MongoDB database
- ✅ Starts Redis cache
- ✅ Starts Backend API (Node.js)
- ✅ Starts AI services (Python)
- ✅ Runs health checks

**Wait 5-10 minutes** for everything to download and start.

### Step 3: Verify It's Working

Open your browser and test these URLs:

| Service | URL | What You Should See |
|---------|-----|---------------------|
| Backend API | http://localhost:5000 | `{"service": "Temple Booking API", "status": "Healthy"}` |
| AI Detection | http://localhost:8001/docs | Swagger API documentation page |
| AI Forecasting | http://localhost:8002/docs | Swagger API documentation page |

If all 3 work, congratulations! 🎉 Everything is running!

### Step 4: Run Automated Tests

Test the complete system:

```powershell
# Test the backend API
.\test-api.ps1

# Test the ML services
.\test-ml.ps1
```

**Expected Output:**
```
✅ Backend is running!
✅ User registered successfully!
✅ User logged in successfully!
✅ Protected route works!
🎉 All tests passed!
```

---

## Understanding the Code Structure

### Root Directory Overview

```
temple-crowd-management/
├── backend/              ← Node.js API server
├── frontend/             ← React web dashboard (TO DO)
├── ml-services/          ← Python AI services
│   ├── crowd-detection/      ← YOLOv8 person detection
│   └── demand-forecasting/   ← LSTM forecasting
├── mobile/               ← React Native app (TO DO)
├── docker-compose.yml    ← Orchestrates all services
├── setup.ps1             ← Windows automated setup
├── test-api.ps1          ← Backend testing script
└── README.md             ← Main documentation
```

### Backend Structure (`backend/`)

```
backend/
├── src/
│   ├── app.js               ← Express app setup
│   ├── server.js            ← Server startup
│   ├── config/              ← Configuration files
│   │   ├── database.js          ← MongoDB connection
│   │   └── redis.js             ← Redis connection
│   ├── controllers/         ← Business logic
│   │   ├── authController.js    ← Login/Register
│   │   ├── bookingController.js ← Booking CRUD
│   │   └── liveController.js    ← Live crowd tracking
│   ├── models/              ← Database schemas
│   │   ├── User.js              ← User model
│   │   └── Booking.js           ← Booking model
│   ├── routes/              ← API endpoints
│   │   ├── authRoutes.js        ← /api/v1/auth/*
│   │   ├── bookingRoutes.js     ← /api/v1/bookings/*
│   │   └── liveRoutes.js        ← /api/v1/live/*
│   └── middleware/          ← Interceptors
│       └── auth.js              ← JWT verification
├── .env                     ← Environment variables
└── package.json             ← Dependencies
```

### Key Files Explained

#### 1. `backend/src/server.js` - The Entry Point
```javascript
// This file:
// 1. Connects to MongoDB
// 2. Starts the Express server
// 3. Listens on port 5000

const startServer = async () => {
  await connectDB();  // Connect to MongoDB
  server.listen(5000); // Start listening
};
```

#### 2. `backend/src/controllers/authController.js` - Authentication
```javascript
// Handles:
// - User registration (create account)
// - User login (get JWT token)
// - Password hashing (security)

exports.register = async (req, res) => {
  // 1. Get user data from request
  // 2. Hash password
  // 3. Save to MongoDB
  // 4. Return JWT token
};
```

#### 3. `backend/src/middleware/auth.js` - Protecting Routes
```javascript
// This middleware checks:
// "Does this request have a valid JWT token?"

exports.protect = async (req, res, next) => {
  // 1. Extract token from header
  // 2. Verify token is valid
  // 3. If valid, allow request (next())
  // 4. If invalid, return 401 Unauthorized
};
```

### ML Services Structure

```
ml-services/
├── crowd-detection/           ← Counts people in CCTV footage
│   ├── src/
│   │   ├── api.py                ← FastAPI server
│   │   └── detector.py           ← YOLOv8 logic
│   ├── models/                   ← AI model files
│   └── requirements.txt          ← Python dependencies
│
└── demand-forecasting/        ← Predicts future crowds
    ├── src/
    │   ├── api.py                ← FastAPI server
    │   └── forecaster.py         ← LSTM logic
    └── models/                   ← Trained models
```

---

## Common Troubleshooting

### Problem 1: "Backend won't start"

**Error Message:**
```
❌ MongoDB connection error
```

**Solution:**
Make sure Docker is running! Open Docker Desktop and verify MongoDB container is up.

**Check:**
```powershell
docker-compose ps
```

You should see:
```
NAME                STATUS
temple-mongo        Up
temple-redis        Up
temple-backend      Up
```

---

### Problem 2: "Port already in use"

**Error Message:**
```
Error: listen EADDRINUSE :::5000
```

**Solution:**
Another program is using port 5000. Kill it:

```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill it (replace PID with the number shown)
taskkill /PID <PID> /F
```

Or change the port in `backend/.env`:
```
PORT=5001
```

---

### Problem 3: "Docker containers keep restarting"

**Solution:**
Check logs to see what's failing:

```powershell
docker-compose logs -f backend
docker-compose logs -f ml-detection
```

Common issues:
- Missing `.env` file → Copy `.env.example` to `.env`
- MongoDB not ready → Wait 30 seconds and restart
- Redis connection failed → Check `REDIS_HOST` in `.env`

---

### Problem 4: "Tests fail"

**Error:**
```
❌ User registration failed
```

**Solution:**
1. Make sure backend is running: `docker-compose ps`
2. Check backend logs: `docker-compose logs backend`
3. Verify MongoDB is connected: Look for "✅ MongoDB connected" in logs

---

## Next Steps for Learning

### If You Want to Learn Backend Development:

1. **Understand Express.js**
   - Read: [Express.js Guide](https://expressjs.com/en/guide/routing.html)
   - Practice: Create a simple "Hello World" API

2. **Learn MongoDB**
   - Read: [MongoDB Tutorial](https://www.mongodb.com/docs/manual/tutorial/)
   - Practice: Create a User schema, save data

3. **Study JWT Authentication**
   - Read: [JWT.io Introduction](https://jwt.io/introduction)
   - Practice: Implement login/register endpoints

### If You Want to Learn AI/ML:

1. **Understand Computer Vision**
   - Read: [YOLOv8 Documentation](https://docs.ultralytics.com/)
   - Practice: Detect objects in images

2. **Learn Time Series Forecasting**
   - Read: [LSTM Tutorial](https://www.tensorflow.org/tutorials/structured_data/time_series)
   - Practice: Predict stock prices (simple example)

### If You Want to Learn Full Stack:

1. **React.js** (Frontend)
   - Read: [React Tutorial](https://react.dev/learn)
   - Practice: Build a simple todo app

2. **Node.js + Express** (Backend)
   - Read: [Node.js Guide](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)
   - Practice: Create a REST API

3. **Docker** (DevOps)
   - Read: [Docker Tutorial](https://docs.docker.com/get-started/)
   - Practice: Containerize a simple app

---

## Key Concepts Explained Simply

### What is an API?
**API** = Application Programming Interface
- Think of it as a **waiter in a restaurant**
- You (frontend) tell the waiter (API) what you want ("I want user data")
- The waiter asks the kitchen (backend/database)
- The kitchen prepares the food (data)
- The waiter brings it back to you

**Example:**
```
Frontend: "Hey API, get me all bookings for user 123"
API: "Sure! Let me ask the database..."
Database: "Here are 5 bookings"
API: "Here you go, Frontend!"
Frontend: "Thanks!" (displays bookings)
```

### What is JWT (JSON Web Token)?
- Like a **movie ticket** that proves you paid
- When you login, backend gives you a JWT token
- Every time you make a request, you show this token
- If token is valid, you can access protected data
- If token is fake/expired, you get rejected

**Example:**
```
1. User logs in → Backend creates JWT → "eyJhbGciOiJIUzI1NiIsInR..."
2. User requests profile → Sends JWT in header
3. Backend verifies JWT → "Valid! Here's your profile"
```

### What is Redis?
- **Super fast temporary storage**
- Like RAM, not hard drive
- Perfect for things that change every second (live crowd count)
- Example: `temple_live_count: 4523` → Updates in 0.001 seconds

### What is MongoDB?
- **Document-based database** (stores JSON-like objects)
- Instead of tables (SQL), it has "collections"
- Example:
```json
{
  "_id": "abc123",
  "name": "Ramesh Kumar",
  "email": "ramesh@gmail.com",
  "bookings": [...]
}
```

---

## Quick Reference - Important Commands

### Docker Commands
```powershell
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build
```

### Testing Commands
```powershell
# Test backend API
.\test-api.ps1

# Test ML services
.\test-ml.ps1

# Manual API test
curl http://localhost:5000
```

### Development Workflow
```powershell
# Morning - Start work
git pull origin main
docker-compose up -d

# Make changes to code...

# Test changes
docker-compose restart backend
.\test-api.ps1

# Evening - Save work
git add .
git commit -m "Your message"
git push origin your-branch
docker-compose down
```

---

## Need Help?

### Documentation
- [README.md](README.md) - Main features and overview
- [START_HERE.md](START_HERE.md) - Detailed setup guide
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing procedures
- [DOCKER_AUTOMATION.md](DOCKER_AUTOMATION.md) - Docker guide

### External Resources
- [Stack Overflow](https://stackoverflow.com/) - Search your error messages
- [MDN Web Docs](https://developer.mozilla.org/) - JavaScript reference
- [Node.js Docs](https://nodejs.org/docs/) - Node.js API reference

### Contact
- GitHub Issues: [Create an issue](https://github.com/ByteAcumen/temple-crowd-management/issues)
- Email: dev@templecrowdmanagement.com

---

**Last Updated**: February 1, 2026  
**Version**: 1.0.0  
**Status**: Ready for Beginners! 🎉
