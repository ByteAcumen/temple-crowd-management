# 🏗️ System Architecture Documentation

## Overview

This document provides detailed technical architecture of the Temple & Pilgrimage Crowd Management System.

## Architecture Layers

### 1. Presentation Layer
- **Web Dashboard**: React.js SPA for admin/staff
- **Mobile App**: React Native for devotees
- **Admin Portal**: Enhanced dashboard for system configuration

### 2. API Layer
- **API Gateway**: Kong/NGINX for routing, rate limiting, authentication
- **REST APIs**: Node.js + Express microservices
- **WebSocket Server**: Socket.io for real-time updates
- **GraphQL** (future): For flexible data queries

### 3. Business Logic Layer
- **Microservices**: Independent, domain-driven services
  - Auth Service
  - Crowd Service
  - Booking Service
  - Temple Service
  - Alert Service
  - User Service
  - Analytics Service

### 4. ML/AI Layer
- **Detection Service**: YOLOv8 person counting (FastAPI)
- **Forecasting Service**: LSTM/Prophet predictions (FastAPI)
- **Anomaly Service**: Isolation Forest (FastAPI)
- **Model Registry**: MLflow for version control

### 5. Data Layer
- **MongoDB**: Primary database (users, temples, bookings)
- **Firebase**: Real-time sync (live counts, alerts)
- **Redis**: Caching and session storage
- **TimescaleDB** (optional): Time-series optimization

### 6. Message Queue Layer
- **RabbitMQ/Kafka**: Event streaming
  - Video frame processing queues
  - Alert notifications
  - Analytics events

### 7. External Integration Layer
- **Weather APIs**: OpenWeatherMap
- **Maps**: Google Maps, OpenStreetMap
- **Notifications**: Twilio (SMS), FCM (Push)
- **Payments** (future): Razorpay, Stripe

## Data Flow Diagrams

### Real-Time Crowd Monitoring Flow
```
CCTV Camera (RTSP)
    ↓
Stream Ingestion Service (Python)
    ↓
RabbitMQ Queue
    ↓
YOLOv8 Detection Service (GPU)
    ↓
Person Count + Bounding Boxes
    ↓ (parallel)
    ├─→ Firebase Realtime DB (live updates)
    ├─→ MongoDB (historical storage)
    └─→ Alert Service (threshold checks)
         ↓
    SMS/Push Notifications
         ↓
    Admin Dashboard (WebSocket update)
```

### Booking Flow
```
Mobile App (Devotee)
    ↓
POST /api/v1/bookings
    ↓
API Gateway (auth validation)
    ↓
Booking Service
    ↓
Check Slot Availability (MongoDB query)
    ↓
Create Booking + Generate QR Code
    ↓
Save to MongoDB
    ↓
Send Confirmation (FCM Push)
    ↓
Return Booking Details to App
```

### Forecasting Flow
```
Scheduled Job (Daily @ Midnight)
    ↓
Fetch Historical Data (MongoDB)
    ↓
Fetch Weather Forecast (OpenWeatherMap API)
    ↓
POST /ml/forecast (ML Service)
    ↓
LSTM Model Inference
    ↓
Generate 7-Day Predictions
    ↓
Store in MongoDB + Firebase
    ↓
Dashboard Displays Forecast
```

## Deployment Architecture

### Development Environment
```
Developer Workstation
    ↓
Docker Compose (Local)
    ├─ MongoDB Container
    ├─ Redis Container
    ├─ RabbitMQ Container
    ├─ Backend Container
    ├─ ML Services Containers
    └─ Frontend Container (Hot Reload)
```

### Production Environment (Kubernetes)
```
Cloud Load Balancer (HTTPS)
    ↓
Ingress Controller (NGINX)
    ↓
    ├─→ Frontend Pods (3 replicas)
    ├─→ Backend Pods (5 replicas, HPA)
    ├─→ ML Detection Pods (2 replicas, GPU nodes)
    ├─→ ML Forecasting Pods (1 replica)
    └─→ ML Anomaly Pods (1 replica)

Persistent Storage:
    ├─ MongoDB Atlas (Managed)
    ├─ Redis ElastiCache (Managed)
    ├─ S3 Buckets (Model files, videos)
    └─ Firebase (Managed)

Monitoring:
    ├─ Prometheus (Metrics collection)
    ├─ Grafana (Visualization)
    ├─ ELK Stack (Logging)
    └─ Sentry (Error tracking)
```

## Security Architecture

### Authentication Flow
```
User → Login Request → Backend Auth Service
    ↓
Validate Credentials (bcrypt hash comparison)
    ↓
Generate JWT Token (access + refresh)
    ↓
Return Tokens to Client
    ↓
Client Stores in Secure Storage (Keychain/Keystore)
    ↓
Subsequent Requests Include Token in Header
    ↓
API Gateway Validates Token
    ↓
Allow/Deny Request
```

### Data Encryption
- **At Rest**: AES-256 encryption for MongoDB, S3
- **In Transit**: TLS 1.3 for all HTTP/WebSocket connections
- **Secrets Management**: AWS Secrets Manager, K8s Secrets

### Access Control
- **RBAC**: Role-based permissions (admin, staff, volunteer, devotee)
- **API Keys**: For external integrations
- **IP Whitelisting**: For admin endpoints

## Scalability Considerations

### Horizontal Scaling
- **Backend**: Stateless services, scale with HPA
- **ML Services**: Queue-based processing, add workers as needed
- **Databases**: MongoDB sharding, Redis clustering

### Caching Strategy
- **Redis Cache**: Temple info, user sessions, rate limits
- **CDN**: Static assets (images, videos, mobile app bundles)
- **Application-Level**: In-memory LRU cache for frequently accessed data

### Database Optimization
- **Indexes**: Compound indexes for common queries
- **Aggregation**: MongoDB aggregation pipeline for analytics
- **Read Replicas**: Separate read/write workloads
- **Archival**: Move old data (>30 days) to cold storage

## Monitoring & Observability

### Metrics (Prometheus)
- API request rates, latencies, error rates
- ML inference times, model accuracy
- Database query performance
- System resources (CPU, memory, disk)

### Logging (ELK)
- Structured JSON logs from all services
- Centralized log aggregation (Logstash)
- Searchable logs (Elasticsearch)
- Log visualization (Kibana)

### Tracing (Jaeger)
- Distributed tracing for request flows
- Identify bottlenecks across microservices

### Alerting (Alertmanager)
- Threshold-based alerts (high latency, errors)
- Multi-channel notifications (Email, SMS, Slack)
- On-call escalation (PagerDuty)

## Disaster Recovery

### Backup Strategy
- **Daily Backups**: MongoDB (mongodump), Firebase (JSON export)
- **Hourly Snapshots**: RDS/ElastiCache automated snapshots
- **Model Versioning**: DVC (Data Version Control) in Git

### Failover Plan
- **Database**: Automatic failover to replica (MongoDB Atlas)
- **Services**: Kubernetes auto-restart unhealthy pods
- **Cross-Region**: Deploy to multiple AWS regions (future)

### RTO/RPO Targets
- **RTO** (Recovery Time Objective): 1 hour
- **RPO** (Recovery Point Objective): 5 minutes (last backup)

## Technology Decisions & Rationale

| Choice | Alternatives | Rationale |
|--------|-------------|-----------|
| React.js | Vue.js, Angular | Largest ecosystem, Material-UI, strong community |
| Node.js | Python (Django), Java (Spring) | JavaScript everywhere, non-blocking I/O, fast iteration |
| MongoDB | PostgreSQL, MySQL | Flexible schema, horizontal scaling, JSON documents |
| YOLOv8 | Faster R-CNN, SSD | Best accuracy/speed trade-off, easy fine-tuning |
| LSTM | ARIMA, XGBoost | Better for long-term dependencies, seasonal patterns |
| Kubernetes | Docker Swarm, Nomad | Industry standard, extensive tooling, auto-scaling |
| RabbitMQ | Kafka, Redis Pub/Sub | Simpler setup, sufficient for our scale, good docs |

## Future Enhancements

### Phase 5+ Features
- **Blockchain**: Immutable audit logs for compliance
- **AI Chatbots**: Multi-lingual virtual assistants
- **AR Navigation**: Augmented reality wayfinding
- **5G Edge Computing**: Ultra-low latency ML inference
- **Quantum-Resistant Encryption**: Future-proof security

---

*For detailed API documentation, see [API.md](API.md)*  
*For deployment guide, see [DEPLOYMENT.md](DEPLOYMENT.md)*
