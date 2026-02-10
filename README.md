# Temple Crowd Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Smart, AI-powered crowd management system for religious sites and temples.**

Prevents dangerous overcrowding through real-time tracking, intelligent bookings, and automated alerts.

---

## 🚀 Quick Start (Automated)

The system now includes **self-healing automation scripts** for Windows.

### 1-Click Startup
```powershell
.\start.ps1
```
**What this does:**
- 🧹 **Cleans Ports**: Kills rogue Node/Mongo processes freeing ports 5000/27017/6379
- 🐳 **Starts Docker**: Launches MongoDB, Redis, and Backend with named volumes
- 🧪 **Auto-Testing**: Runs `load_test.js` to verify 18/18 endpoints are healthy
- 🔄 **Auto-Recovery**: Restarts backend automatically if health checks fail

### Graceful Shutdown
```powershell
.\stop.ps1
```
**Why use this?**
- Ensures **No Data Loss** (triggers SIGTERM for meaningful shutdown)
- Preserves MongoDB/Redis data in named volumes (`temple-mongo-data`)

### Data Backup
```powershell
.\backup.ps1
```
- Creates timestamped snapshots of your database in `.\backups`

---

## 🏗️ Architecture Updates

### Data Persistence
- **MongoDB**: Stores Users, Temples, Bookings (Volume: `temple-mongo-data`)
- **Redis**: Stores Live Counts, Active Sessions (Volume: `temple-redis-data`)
  - *Persistence Enabled*: AOF + RDB ensures live counts survive restarts

### Security Layer
- **Rate Limiting**: 5-Tier System
  - `Auth`: 30 req/15min (Brute force protection)
  - `Live`: 200 req/min (Real-time updates)
  - `Temples`: 500 req/15min (Public data)
  - `Admin`: 1000 req/15min (Dashboard)
  - `General`: 1000 req/15min
- **Hardening**:
  - Non-root container user (`nodejs:1001`)
  - Helmet.js Security Headers
  - Input Sanitization (XSS, NoSQL Injection)

---

## 🧪 Testing

We provide a **comprehensive test suite** that verifies all 27 features:

```powershell
.\verify-system.ps1
```

**What it tests**:
- ✅ API Health & Connectivity
- ✅ Authentication (JWT)
- ✅ Authorization (RBAC with 3 roles)
- ✅ Temple Management (CRUD)
- ✅ Booking System (with overbooking prevention)
- ✅ Live Crowd Tracking (Redis)
- ✅ Admin Dashboard & Analytics
- ✅ System Health Monitoring

See [TESTING.md](TESTING.md) for details.

---

## 📚 API Documentation

All API documentation is in the `docs/` folder:

- [Temple API](docs/TEMPLE_API.md) - Temple CRUD operations
- [Live Tracking API](docs/LIVE_TRACKING_API.md) - Entry/Exit tracking
- [Booking API](docs/BOOKING_API.md) - Booking management
- [Admin API](docs/ADMIN_API.md) - Dashboard & analytics
- [WebSocket Events](docs/WEBSOCKET_EVENTS.md) - Real-time events

---

## 🔐 Security

### Authentication
- JWT-based authentication
- Token expiration and validation
- Secure password hashing (bcrypt)

### Authorization (RBAC)
| Role | Access Level |
|------|-------------|
| **Super Admin** | Full system access, manage all temples and admins |
| **Temple Admin** | Manage only assigned temples |
| **Gatekeeper** | Entry/Exit management at assigned temples |
| **User** | Book passes and view own bookings |

### First-Time Super Admin Setup
```bash
cd backend
node scripts/promote-superadmin.js
```

### Protection
- Rate limiting (100 req/15min)
- Security headers (Helmet.js)
- Input validation
- Protected routes

See [Security Audit Report](https://github.com/yourusername/temple-crowd-management/blob/main/docs/SECURITY.md) for details.

---

## 🐳 Docker

### Development Mode (with hot reload)
```powershell
.\scripts\start.ps1
```

Uses `docker-compose.dev.yml` with:
- Health checks for all services
- Automatic dependency management
- Hot reload for backend
- Volume mounting for development

### Production Mode
```bash
docker-compose up -d
```

Uses `docker-compose.yml` optimized for production.

### Stop Services
```powershell
.\scripts\stop.ps1
```

---

## 🎯 Use Cases

### Case 1: Temple Administrator
- Manage multiple temples
- View real-time crowd dashboards
- Access analytics and reports
- Manage bookings and users

### Case 2: Devotee (User)
- Browse available temples
- Book time slots online
- Receive QR code passes
- Get email confirmations

### Case 3: Gatekeeper
- Scan QR codes for entry/exit
- Track live crowd count
- Prevent duplicate entries
- Monitor capacity alerts

---

## 🌟 Key Features Explained

### 1. Overbooking Prevention
The booking system **strictly enforces slot capacity**:
- Checks available slots in real-time
- Atomic booking operations
- Prevents race conditions
- Returns clear error messages

### 2. Live Crowd Tracking
Redis-based atomic counters provide:
- Thread-safe operations (INCR/DECR)
- Duplicate entry prevention (SET operations)
- Sub-10ms response times
- Threshold alerts (85%, 95%)

### 3. Admin Dashboard
MongoDB aggregation pipelines deliver:
- Parallel queries (9x faster)
- Peak hour analytics
- Revenue breakdowns
- Temple utilization metrics

### 4. Real-time Updates
Socket.IO WebSocket provides:
- Room-based isolation
- Live crowd updates
- Booking notifications
- Capacity alerts

---

## 🛠️ Development

### Run Locally (without Docker)
```bash
# Start MongoDB
mongod

# Start Redis
redis-server

# Start Backend
cd backend
npm install
npm run dev
```

### Project Scripts
```bash
npm run dev      # Development with nodemon
npm start        # Production
npm test         # Run tests
```

---

## 📊 Architecture

### Backend Stack
- **Node.js** + Express.js
- **MongoDB** (Mongoose ODM)
- **Redis** (ioredis)
- **Socket.IO** (WebSocket)
- **JWT** (Authentication)

### Database Design
- **MongoDB**: Bookings, Users, Temples (persistence)
- **Redis**: Live counts, Active entries (real-time)

### API Design
- RESTful API with clear resource paths
- JWT authentication on protected routes
- Role-based authorization middleware
- Standardized error responses

---

## 🚀 Deployment

### Recommended Platforms
1. **Railway** - Easiest (built-in Redis)
2. **Render** - Simple (free tier)
3. **DigitalOcean** - More control ($5/month)

### Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGO_URI=your_mongodb_uri
REDIS_HOST=your_redis_host
REDIS_PORT=6379
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=30d
SMTP_HOST=your_smtp_host (optional)
SMTP_PORT=587 (optional)
SMTP_USER=your_email (optional)
SMTP_PASS=your_password (optional)
```

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built for solving real-world overcrowding problems at religious sites
- Inspired by the need for better crowd safety management
- Focused on simplicity and reliability

---

## 📞 Support

Issues? Questions?
- Open an [issue](https://github.com/yourusername/temple-crowd-management/issues)
- Check our [documentation](docs/)
- Read our [FAQ](docs/FAQ.md)

---

**Made with ❤️ for safer temple experiences**
