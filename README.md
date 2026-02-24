# 🛕 Temple Crowd Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com)

> **Smart, AI-powered crowd management for religious sites.**  
> Prevents dangerous overcrowding through real-time tracking, intelligent bookings, and automated alerts.

---

## 🚀 Quick Start (One Command)

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop) must be running.

```powershell
git clone <your-repo-url>
cd temple-crowd-management
.\start.ps1
```

MongoDB, Redis, Backend, ML services, and Frontend all start automatically. Ready in ~60 seconds.

**Stop everything:**
```powershell
.\start.ps1 -Down
```

See [QUICK_START.md](QUICK_START.md) for all options, flags, and troubleshooting.

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** 👑 | `admin@temple.com` | `Admin@123456` |
| **Gatekeeper** 👮 | `gatekeeper@temple.com` | `Gate@12345` |
| **Devotee** 🙏 | `user@temple.com` | `User@12345` |

> The first registered user is automatically promoted to Super Admin if no admin exists.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js 16)      →  http://localhost:3000 │
│  Backend API (Express)      →  http://localhost:5001 │
│  MongoDB                    →  localhost:27017        │
│  Redis                      →  localhost:6379         │
│  ML Crowd Detection         →  localhost:8001         │
│  ML Demand Forecasting      →  localhost:8002         │
└─────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| **Backend** | Node.js 18+, Express.js, Socket.IO |
| **Database** | MongoDB (Mongoose ODM) |
| **Cache / Real-time** | Redis (ioredis) with AOF + RDB persistence |
| **Auth** | JWT with bcrypt password hashing |
| **ML Services** | Python (crowd detection + demand forecasting) |
| **Infrastructure** | Docker + Docker Compose |

---

## 🔐 Security

| Layer | What's Protected |
|-------|-----------------|
| **Auth Rate Limit** | 30 req / 15 min (brute force protection) |
| **Temple API** | 500 req / 15 min |
| **Admin Dashboard** | 1000 req / 15 min |
| **Headers** | Helmet.js — CSP, HSTS, XSS protection |
| **Input** | NoSQL injection sanitization, XSS-clean, HPP |
| **Containers** | Non-root user (`node:1001`), read-only src mounts |

### RBAC Roles

| Role | Access |
|------|--------|
| **Super Admin** | Full system: all temples, users, settings |
| **Temple Admin** | Manage only their assigned temples |
| **Gatekeeper** | QR scan, entry/exit, live crowd at assigned temple |
| **Devotee** | Book passes, view own bookings |

---

## 🧪 Testing

```powershell
# Quick API sanity check (runs on startup automatically)
.\start.ps1

# Full scripted test suite
.\test-all.ps1

# Backend unit tests only
cd backend
npm test
```

All unit tests are in `backend/tests/unit/`. Coverage report is generated in `backend/coverage/`.

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for the full testing guide.

---

## 📚 API Documentation

| Doc | Endpoints |
|-----|-----------|
| [Temple API](docs/TEMPLE_API.md) | Temple CRUD, search, capacity |
| [Live Tracking API](docs/LIVE_TRACKING_API.md) | Entry/Exit tracking, live counts |
| [Booking API](docs/BOOKING_API.md) | Book passes, QR codes |
| [Admin API](docs/ADMIN_API.md) | Dashboard, analytics, user management |
| [WebSocket Events](docs/WEBSOCKET_EVENTS.md) | Real-time events via Socket.IO |

### Health Check
```
GET http://localhost:5001/api/v1/health
```
Returns: `db`, `redis`, and `ai` service status + server uptime.

---

## 🌟 Key Features

### 1. Overbooking Prevention
Atomic booking operations check + reserve slots in a single transaction, preventing race conditions even under concurrent load.

### 2. Live Crowd Tracking
Redis atomic counters (INCR/DECR) with duplicate-entry prevention. Sub-10ms response. Threshold alerts at 85% (warning) and 95% (critical — blocks new entries).

### 3. Admin Dashboard
MongoDB aggregation pipelines run in parallel, delivering peak-hour analytics, revenue breakdowns, and temple utilization metrics.

### 4. Real-time WebSocket Events
Socket.IO provides room-based isolation. Admins receive push updates; devotees see live crowd status without polling.

---

## 🛠️ Manual Development (without Docker)

### Backend
```powershell
cd backend
cp .env.example .env   # Configure environment variables
npm install
npm run dev            # http://localhost:5001 with hot reload
```

### Frontend
```powershell
cd frontend
npm install
npm run dev            # http://localhost:3000 with hot reload
```

> You'll need MongoDB and Redis running locally, or point `MONGODB_URI` and `REDIS_HOST` in `backend/.env` at your Docker containers.

### Seed Dashboard Data
```powershell
cd backend
npm run seed           # Injects 30 days of realistic booking data
```

---

## 🐳 Docker Reference

| Command | Description |
|---------|-------------|
| `.\start.ps1` | Start all services (dev mode) |
| `.\start.ps1 -Production` | Start production containers |
| `.\start.ps1 -Rebuild` | Force rebuild all images |
| `.\start.ps1 -SkipFrontend` | Backend only (faster) |
| `.\start.ps1 -Down` | Stop all containers |
| `.\start.ps1 -Logs` | Tail live logs |
| `.\scripts\backup.ps1` | Snapshot MongoDB to `./backups/` |

### Data Persistence
- **MongoDB**: Volume `temple-crowd-management_mongo_data`
- **Redis**: Volume `temple-redis-data-dev` (AOF + RDB — survives restarts)

---

## 🚀 Deployment

### Recommended Platforms
1. **Railway** — Easiest (built-in Redis + MongoDB add-ons)
2. **Render** — Simple (free tier available)
3. **DigitalOcean App Platform** — More control

### Required Environment Variables (production)
```env
NODE_ENV=production
PORT=5001
MONGO_URI=your_mongodb_uri
REDIS_HOST=your_redis_host
REDIS_PORT=6379
JWT_SECRET=your_super_secret_key_minimum_32_chars
JWT_EXPIRE=30d
FRONTEND_URL=https://your-frontend-domain.com
# Optional email notifications:
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_password
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📝 License

MIT — see [LICENSE](LICENSE) for details.

---

**Made with ❤️ for safer temple experiences**
