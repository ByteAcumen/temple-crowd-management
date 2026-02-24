# 🛕 Temple Crowd Management — Quick Start Guide

> Get the entire system running in **under 3 minutes** with one command.

---

## ✅ Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| **Docker Desktop** | Runs everything (DB, Redis, Backend, Frontend) | [Download](https://www.docker.com/products/docker-desktop) |
| **Node.js v20+** | Frontend local dev (optional) | [Download](https://nodejs.org) |
| **Git** | Clone the repo | Pre-installed on most systems |

> MongoDB, Redis, Backend, and ML services start automatically inside Docker. No manual installation needed.

---

## 🚀 One-Command Startup

```powershell
# 1. Clone the repo
git clone <your-repo-url>
cd temple-crowd-management

# 2. Start everything (Docker Desktop must be running)
.\start.ps1
```

The script automatically:
1. Checks Docker is healthy
2. Frees any port conflicts (5001, 3000, 27017, 6379)
3. Starts MongoDB, Redis, Backend, ML services, and Frontend
4. Waits for each service to become healthy
5. Runs a quick API sanity check
6. Prints all service URLs when ready

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** 👑 | `admin@temple.com` | `Admin@123456` |
| **Gatekeeper** 👮 | `gatekeeper@temple.com` | `Gate@12345` |
| **Devotee** 🙏 | `user@temple.com` | `User@12345` |

> **Note:** New users can self-register as Devotees. Staff accounts must be created by a Super Admin.

---

## ⚙️ Script Flags

```powershell
.\start.ps1                    # Normal dev start (default)
.\start.ps1 -Production        # Start production containers
.\start.ps1 -Rebuild           # Force rebuild Docker images (after code changes)
.\start.ps1 -SkipFrontend      # Backend-only mode (faster startup)
.\start.ps1 -Down              # Stop all containers (data is preserved)
.\start.ps1 -Logs              # Tail live container logs
.\start.ps1 -SkipTests         # Start without the quick API sanity check
```

> **Combine flags:** `.\start.ps1 -Production -SkipTests`

---

## 🛠️ Manual Start (without Docker)

If you prefer running services natively:

### Terminal 1 — Backend
```powershell
cd backend
cp .env.example .env    # Configure environment
npm install
npm run dev             # Starts on http://localhost:5001
```

### Terminal 2 — Frontend
```powershell
cd frontend
npm install
npm run dev             # Starts on http://localhost:3000
```

> **Note:** You'll need MongoDB and Redis running locally, or set `MONGODB_URI` and `REDIS_HOST` in `backend/.env` to point at your Docker containers.

---

## 📊 Seed Dashboard Data

If the Admin Dashboard graphs show no data, run the seeder:

```powershell
cd backend
npm run seed     # Injects 30 days of realistic booking data + live crowd counts
```

---

## 🎭 Crowd Simulation

Simulate live crowd counts for demos or testing:

```powershell
cd backend
node scripts/simulate_crowd.js           # Random 10–80% crowd
node scripts/simulate_crowd.js --open    # Force all temples OPEN
node scripts/simulate_crowd.js --high    # 70–95% crowd (triggers alerts)
node scripts/simulate_crowd.js --reset   # Reset all counts to 0
```

---

## 🔴 Crowd Status Thresholds

| Status | Capacity % | Action |
|--------|-----------|--------|
| 🟢 **GREEN** | < 85% | Normal — all good |
| 🟡 **ORANGE** | 85–94% | Warning — admins notified |
| 🔴 **RED** | 95%+ | Critical — new entries blocked |

---

## 🧯 Troubleshooting

### "Docker is not running"
Open **Docker Desktop** and wait for the whale icon to stop animating, then retry.

### "Port 5001 already in use"
`.\start.ps1` auto-kills non-Docker processes on required ports. Just run it again.

### "MongoDB connection failed"
Ensure you're not running a separate local MongoDB instance. The system uses the Docker container.

### "Frontend shows Network Error"
The backend must be fully healthy before the frontend loads data. Run `.\start.ps1` (not just the frontend dev server).

### Backend container keeps restarting
```powershell
# See what's happening
docker logs temple-backend-dev --tail 50

# Rebuild from scratch
.\start.ps1 -Rebuild
```

### Data looks empty after restart
Data is stored in Docker named volumes and **persists across restarts**. If data is missing, run:
```powershell
cd backend
npm run seed
```

---

## 📚 More Documentation

| Doc | Purpose |
|-----|---------|
| [README.md](README.md) | Full architecture overview |
| [docs/](docs/) | API reference |
| [CREDENTIALS.md](CREDENTIALS.md) | Full credentials list |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Testing guide |
