# 🚀 Quick Start Guide

**Get the Temple Crowd Management System running in under 2 minutes!**

This guide automates the entire setup using Docker. No manual database installation required.

---

## ✅ Prerequisites

1.  **[Docker Desktop](https://www.docker.com/products/docker-desktop)** (Must be installed and running)
2.  **[Node.js](https://nodejs.org/)** (v18+ for Frontend)
3.  **Git**

That's it! MongoDB, Redis, and AI Services are handled automatically.

---

## 🏃 One-Click Startup (Windows)

We have automated the entire backend ecosystem (API, Database, AI Models) into a single script.

### Step 1: Clone & Setup
```powershell
git clone <your-repo-url>
cd temple-crowd-management
# No .env needed - Docker uses built-in config
```

### Step 2: One-Click Startup 🚀
Run the master startup script. This handles **Backend**, **Database**, **AI Services**, and launches the **Frontend** automatically.

```powershell
.\start.ps1
```

**What this does:**
1.  Starts all Docker containers (Backend, Mongo, Redis, ML Models).
2.  Waits for services to be healthy.
3.  Automatically opens a new window for the Frontend.

**Success Output:**
> ✅ System is fully operational! 🚀
> 📡 Backend: http://localhost:5001
> 💻 Frontend: http://localhost:3000

---

## 🔑 Default Credentials

Use these accounts to log in:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Super Admin** 👑 | `admin@temple.com` | `Admin@123456` | Full Control, Dashboard, Analytics |
| **Gatekeeper** 👮 | `gatekeeper@temple.com` | `Gate@12345` | Scan QR, Track Entry/Exit |
| **Devotee** 🙏 | `user@temple.com` | `User@12345` | Book Slots, View History |

---

## 🧪 Verify Installation

To check if all 27 system features (Auth, Booking, AI, Crowd Tracking) are working correctly, run the full test suite:

```powershell
powershell -ExecutionPolicy Bypass -File .\verify-system.ps1
```

**Expected Result:** ~90%+ tests passing (some need specific data).

---

## 🔧 Backend Testing & Crowd Simulation

### Temples Showing as Offline?
Temple status (OPEN/CLOSED) is based on operating hours. To force all temples OPEN for dev/demo:

```bash
# Add to .env
FORCE_TEMPLES_OPEN=true
```

Or run the sync + crowd simulation script:

```powershell
cd backend
node scripts/simulate_crowd.js --open    # Force all temples OPEN
node scripts/simulate_crowd.js           # Simulate 10-80% crowd
node scripts/simulate_crowd.js --high    # Simulate 70-95% (triggers ORANGE/RED alerts)
node scripts/simulate_crowd.js --reset   # Reset all counts to 0
```

### No Graphs on Dashboard?
Analytics graphs show booking trends and revenue. If no bookings exist, the API returns sample data so charts render. Seed bookings:

```powershell
cd backend
node scripts/seed_simulation.js --force
```

### How Crowd Reacts
- **GREEN**: < 85% capacity
- **ORANGE**: 85–95% (warning)
- **RED**: 95%+ (critical)
- Live counts come from Redis; entry/exit scans update in real-time.

---

## 🛠️ Troubleshooting

### "Docker is not running"
**Fix:** Open Docker Desktop and wait for the whale icon to stop animating.

### "Port 5000 already in use"
**Fix:** The `start_backend.ps1` script automatically finds and kills rogue processes on port 5000. Just run it again!

### "MongoDB connection failed"
**Fix:** Ensure you are NOT running a local MongoDB instance separately. The system expects to use the Docker container.

### Frontend shows "Network Error"
**Fix:** Ensure the backend is running (Step 2) and healthy before starting the frontend.

---

## 📚 Documentation
- [Architecture Overview](README.md)
- [API Documentation](docs/)
