# Temple Crowd Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Smart, AI-powered crowd management system for religious sites and temples.**

Prevents dangerous overcrowding through real-time tracking, intelligent bookings, and automated alerts.

---

## 🚀 **ONE COMMAND START** (New!)

```powershell
# Windows
.\scripts\start.ps1

# Linux/Mac
./scripts/start.sh
```

That's it! This automatically:
- Starts Docker (if needed)
- Starts MongoDB with health checks
- Starts Redis with health checks
- Starts Backend API (after dependencies ready)

---

## ✨ Features

### Core Features
- 🏛️ **Temple Management** - Full CRUD operations with admin control
- 📅 **Smart Booking System** - Slot-based bookings with **overbooking prevention**
- 👥 **Live Crowd Tracking** - Real-time entry/exit with Redis atomic counters
- 📊 **Admin Dashboard** - Statistics, analytics, and insights
- 🔔 **Notifications** - Email/SMS alerts for bookings and capacity warnings
- ⚡ **Real-time Updates** - WebSocket broadcasts for live data
- 🎫 **QR Code System** - Digital passes for contactless entry

### Security
- 🔐 JWT Authentication
- 👮 Role-Based Access Control (Admin/Gatekeeper/User)
- 🛡️ Password hashing with bcrypt
- 🚫 Rate limiting & DDoS protection
- 🔒 Protected routes and authorization

### Technology
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (persistence) + Redis (real-time)
- **Real-time**: Socket.IO (WebSocket)
- **Deployment**: Docker with health checks

---

## 📁 Project Structure

```
temple-crowd-management/
├── README.md                    # This file
├── QUICK_START.md               # Quick reference guide
├── TESTING.md                   # Testing documentation
├── docs/                        # API Documentation
│   ├── TEMPLE_API.md
│   ├── LIVE_TRACKING_API.md
│   ├── BOOKING_API.md
│   ├── ADMIN_API.md
│   └── WEBSOCKET_EVENTS.md
├── scripts/                     # Automation scripts
│   ├── start.ps1               # ONE COMMAND START (Windows)
│   ├── start.sh                # ONE COMMAND START (Linux/Mac)
│   ├── stop.ps1                # Stop all services
│   └── setup.ps1               # Initial setup
├── backend/                     # Backend API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── events/
│   └── Dockerfile
├── ml-services/                 # AI/ML prediction services
├── verify-system.ps1            # Comprehensive test suite (27 tests)
├── docker-compose.yml           # Production Docker config
└── docker-compose.dev.yml       # Development Docker config (with health checks)
```

---

## 🏁 Quick Start

### Prerequisites
- **Docker Desktop** (Windows/Mac/Linux)
- That's it! Docker handles everything else

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/temple-crowd-management.git
cd temple-crowd-management
```

**2. Create environment file**
```bash
cp .env.example backend/.env
```

**3. Start everything!**
```powershell
# Windows
.\scripts\start.ps1

# Linux/Mac
chmod +x scripts/start.sh
./scripts/start.sh
```

**4. Test the system**
```powershell
.\verify-system.ps1
```

Done! The API is running at `http://localhost:5000`

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
- **Admin** - Full system access
- **Gatekeeper** - Entry/Exit management
- **User** - Bookings only

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
