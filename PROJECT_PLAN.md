# 🗺️ Temple & Pilgrimage Crowd Management - Complete Project Plan

> Comprehensive A-Z Implementation Guide for Building an AI-Powered Crowd Management System

---

## 📑 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Scope & Objectives](#project-scope--objectives)
3. [System Requirements Analysis](#system-requirements-analysis)
4. [Detailed Architecture Design](#detailed-architecture-design)
5. [Technology Stack Deep Dive](#technology-stack-deep-dive)
6. [Development Phases](#development-phases)
7. [ML Model Development Pipeline](#ml-model-development-pipeline)
8. [Data Collection & Management](#data-collection--management)
9. [Security & Privacy Framework](#security--privacy-framework)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Strategy](#deployment-strategy)
12. [Monitoring & Maintenance](#monitoring--maintenance)
13. [Budget & Resource Allocation](#budget--resource-allocation)
14. [Risk Management](#risk-management)
15. [Success Metrics & KPIs](#success-metrics--kpis)
16. [Timeline & Milestones](#timeline--milestones)

---

## 1. Executive Summary

### Project Vision
Create an intelligent, scalable, and culturally sensitive crowd management platform that ensures the safety and enhanced experience of millions of devotees visiting major Indian pilgrimage sites, starting with Gujarat's four key temples: Somnath, Dwarka, Ambaji, and Pavagadh.

### Core Problem
- **50+ million** annual visitors across these four sites
- High stampede risk during festivals (Navratri, Mahashivratri)
- Limited real-time crowd visibility for authorities
- Manual queue management inefficiencies
- Poor predictive capability for crowd surges
- Inadequate emergency response coordination

### Proposed Solution
A three-tier integrated platform:
1. **Real-Time Monitoring**: AI-powered CCTV analytics for instant crowd density mapping
2. **Predictive Intelligence**: ML forecasting models for proactive crowd management
3. **Devotee Services**: Mobile apps for virtual queuing, slot booking, and navigation

### Expected Outcomes
- **70% reduction** in queue wait times (via virtual booking)
- **90% faster** anomaly detection (vs manual monitoring)
- **85% accuracy** in crowd forecasting (7-day horizon)
- **100% coverage** of high-risk zones with AI surveillance
- **Zero stampede incidents** through predictive alerts

---

## 2. Project Scope & Objectives

### In-Scope

#### Phase 1: Core Platform (Months 1-6)
- ✅ Web-based admin dashboard for temple authorities
- ✅ Mobile app for devotees (Android + iOS)
- ✅ Real-time crowd monitoring with YOLOv8
- ✅ Basic LSTM-based crowd forecasting
- ✅ SMS/WhatsApp alert system
- ✅ Virtual queue and token booking
- ✅ Integration with 4 initial temples

#### Phase 2: Advanced AI (Months 7-12)
- ✅ Multi-camera person tracking
- ✅ Advanced anomaly detection (Isolation Forest + Autoencoders)
- ✅ Weather-integrated forecasting
- ✅ Festival calendar integration
- ✅ Heatmap visualization
- ✅ Historical trend analysis

#### Phase 3: IoT Expansion (Months 13-18)
- ✅ RFID wristband integration
- ✅ Environmental sensors (temperature, noise, air quality)
- ✅ Smart turnstiles with auto-counting
- ✅ Parking occupancy sensors
- ✅ Edge computing deployment (NVIDIA Jetson)

#### Phase 4: Scale-Up (Months 19-24)
- ✅ Expansion to 20+ temples across India
- ✅ Multi-tenancy architecture
- ✅ API marketplace for third-party integrations
- ✅ Government dashboard (PRASAD, NDMA integration)

### Out-of-Scope
- ❌ Facial recognition / biometric ID (privacy concerns)
- ❌ Payment gateway for donations (Phase 5 feature)
- ❌ VR/AR virtual darshan (Phase 5 feature)
- ❌ E-commerce for prasad/merchandise (separate project)
- ❌ Transportation management (partner with existing services)

### Objectives

#### Technical Objectives
1. **Accuracy**: Person detection ≥95% precision, forecasting MAE <50
2. **Performance**: Real-time processing <2s latency, 99.5% uptime
3. **Scalability**: Support 100+ cameras per temple, 1M+ daily users
4. **Security**: SOC 2 compliance, data encryption, GDPR-like privacy

#### Business Objectives
1. Reduce crowd-related incidents by 90%
2. Improve devotee satisfaction scores by 40%
3. Enable temples to handle 30% more pilgrims safely
4. Generate data-driven insights for infrastructure planning
5. Create a replicable model for 1000+ Indian temples

#### Social Objectives
1. Preserve religious sanctity while introducing technology
2. Ensure accessibility for elderly and disabled pilgrims
3. Support local employment (training volunteers, staff)
4. Contribute to sustainable tourism practices

---

## 3. System Requirements Analysis

### Functional Requirements

#### FR1: Real-Time Monitoring
- **FR1.1**: Ingest video streams from 100+ CCTV cameras per temple
- **FR1.2**: Detect and count persons in each frame (YOLOv8)
- **FR1.3**: Generate crowd density heatmaps updated every 5 seconds
- **FR1.4**: Display live counts on admin dashboard
- **FR1.5**: Support multiple temple sites with zone-wise breakdowns

#### FR2: Crowd Forecasting
- **FR2.1**: Predict hourly crowd levels for next 7 days
- **FR2.2**: Incorporate historical footfall, weather, festivals, holidays
- **FR2.3**: Provide confidence intervals for predictions
- **FR2.4**: Update forecasts daily at midnight
- **FR2.5**: Allow manual adjustments for special events

#### FR3: Anomaly Detection
- **FR3.1**: Monitor for sudden crowd surges (>20% increase in 5 min)
- **FR3.2**: Detect unusual dwell times in restricted areas
- **FR3.3**: Flag abnormal crowd velocities (panic indicators)
- **FR3.4**: Generate real-time alerts to authorities
- **FR3.5**: Log all anomalies with video snapshots

#### FR4: Alert System
- **FR4.1**: Multi-channel alerts (SMS, WhatsApp, Email, Push)
- **FR4.2**: Role-based alert routing (police, temple staff, volunteers)
- **FR4.3**: Escalation workflows for unacknowledged alerts
- **FR4.4**: Template-based messages in multiple languages
- **FR4.5**: Alert history and audit trails

#### FR5: Devotee Mobile App
- **FR5.1**: Browse temple information (timings, facilities, routes)
- **FR5.2**: View real-time wait times and crowd levels
- **FR5.3**: Book time slots for darshan (virtual queue)
- **FR5.4**: Receive push notifications for slot readiness
- **FR5.5**: Navigate using in-app maps (parking, toilets, exits)
- **FR5.6**: SOS button for emergencies

#### FR6: Admin Dashboard
- **FR6.1**: Live video feeds from all cameras
- **FR6.2**: Real-time crowd counts and heatmaps
- **FR6.3**: Predictive charts for upcoming days
- **FR6.4**: Alert management console
- **FR6.5**: Historical reports and analytics
- **FR6.6**: User management (add/remove staff, volunteers)

#### FR7: Token/Booking Management
- **FR7.1**: Configure daily capacity and slot durations
- **FR7.2**: Allow devotees to book slots via app/web
- **FR7.3**: Generate QR codes for booked tokens
- **FR7.4**: Verify tokens at entry gates (scanner app)
- **FR7.5**: Handle cancellations and no-shows

#### FR8: Reporting & Analytics
- **FR8.1**: Daily footfall summary reports
- **FR8.2**: Peak hour analysis and trends
- **FR8.3**: Festival period comparisons (year-on-year)
- **FR8.4**: Zone-wise occupancy reports
- **FR8.5**: Export to PDF, Excel, CSV

### Non-Functional Requirements

#### NFR1: Performance
- **NFR1.1**: Video processing latency <2 seconds per frame
- **NFR1.2**: Dashboard page load time <1.5 seconds
- **NFR1.3**: API response time <200ms (95th percentile)
- **NFR1.4**: Support 10,000 concurrent mobile app users
- **NFR1.5**: ML inference time <100ms per image

#### NFR2: Scalability
- **NFR2.1**: Horizontal scaling of backend services (Kubernetes)
- **NFR2.2**: Auto-scaling ML services based on camera load
- **NFR2.3**: Database sharding for multi-temple deployments
- **NFR2.4**: CDN for mobile app assets and videos

#### NFR3: Reliability
- **NFR3.1**: 99.5% uptime (target 99.9% in production)
- **NFR3.2**: Zero data loss (database replication, backups)
- **NFR3.3**: Graceful degradation (ML failure → use last known counts)
- **NFR3.4**: Automatic service recovery (health checks, restarts)

#### NFR4: Security
- **NFR4.1**: HTTPS/TLS 1.3 for all communications
- **NFR4.2**: JWT-based authentication with refresh tokens
- **NFR4.3**: Role-based access control (RBAC) for admin features
- **NFR4.4**: AES-256 encryption for video storage
- **NFR4.5**: Regular security audits and penetration testing

#### NFR5: Privacy
- **NFR5.1**: No storage of personally identifiable facial features
- **NFR5.2**: Data retention: 30 days (unless incident)
- **NFR5.3**: Anonymization of all exported analytics
- **NFR5.4**: Opt-in consent for mobile app location tracking
- **NFR5.5**: Compliance with upcoming Digital Personal Data Protection Act

#### NFR6: Usability
- **NFR6.1**: Mobile app in Hindi, Gujarati, English
- **NFR6.2**: Accessibility: WCAG 2.1 AA compliance
- **NFR6.3**: Intuitive dashboard (no training needed for basic use)
- **NFR6.4**: Offline mode for mobile app (cached temple info)

#### NFR7: Maintainability
- **NFR7.1**: Modular microservices architecture
- **NFR7.2**: Comprehensive API documentation (Swagger/OpenAPI)
- **NFR7.3**: Logging (structured JSON logs, ELK stack)
- **NFR7.4**: Monitoring (Prometheus, Grafana)

---

## 4. Detailed Architecture Design

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                                │
├──────────────────────┬──────────────────────┬──────────────────────┤
│  Web Dashboard       │   Mobile App         │   Admin Portal       │
│  (React.js)          │   (React Native)     │   (React.js)         │
│  - Live Monitoring   │   - Token Booking    │   - User Management  │
│  - Heatmaps          │   - Wait Times       │   - System Config    │
│  - Forecasts         │   - Navigation       │   - Reports          │
│  - Alerts            │   - Notifications    │   - Audit Logs       │
└──────────┬───────────┴──────────┬───────────┴──────────┬───────────┘
           │                      │                      │
           └──────────────────────┼──────────────────────┘
                                  │
                         ┌────────▼────────┐
                         │   API GATEWAY   │
                         │  (Kong / NGINX) │
                         │  - Rate Limiting│
                         │  - Auth         │
                         │  - Load Balance │
                         └────────┬────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
        ┌────────▼────────┐ ┌────▼─────┐ ┌───────▼────────┐
        │   APPLICATION    │ │ WEBSOCKET│ │  AUTH SERVICE  │
        │   SERVICES       │ │  SERVER  │ │  (Passport.js) │
        │   (Node.js +     │ │(Socket.io│ │  - JWT         │
        │   Express)       │ │)         │ │  - OAuth 2.0   │
        └────────┬─────────┘ └────┬─────┘ └───────┬────────┘
                 │                │                │
        ┌────────┼────────────────┼────────────────┤
        │        │                │                │
   ┌────▼────┐ ┌▼────────┐ ┌─────▼────┐ ┌────────▼────────┐
   │ Crowd   │ │ Booking │ │ Temple   │ │ User/Role       │
   │ Service │ │ Service │ │ Service  │ │ Service         │
   └────┬────┘ └────┬────┘ └─────┬────┘ └────────┬────────┘
        │           │            │                │
        └───────────┼────────────┼────────────────┘
                    │            │
              ┌─────▼────────────▼──────┐
              │   DATA LAYER             │
              ├──────────────────────────┤
              │ MongoDB (Primary)        │
              │ - Users, Temples,        │
              │   Bookings, Config       │
              ├──────────────────────────┤
              │ Firebase/Firestore       │
              │ - Real-time crowd counts │
              │ - Live alerts            │
              ├──────────────────────────┤
              │ Redis (Cache)            │
              │ - Session store          │
              │ - Rate limit counters    │
              ├──────────────────────────┤
              │ TimescaleDB (Optional)   │
              │ - Time-series footfall   │
              └─────────┬────────────────┘
                        │
              ┌─────────▼────────────────┐
              │   MESSAGE QUEUE          │
              │   (RabbitMQ / Kafka)     │
              │   - Video frame queue    │
              │   - Alert queue          │
              │   - Analytics events     │
              └─────────┬────────────────┘
                        │
          ┌─────────────┼─────────────────┐
          │             │                 │
   ┌──────▼──────┐ ┌───▼──────────┐ ┌────▼──────────┐
   │ ML SERVICE  │ │ ML SERVICE   │ │ ML SERVICE    │
   │ (Detection) │ │ (Forecasting)│ │ (Anomaly)     │
   ├─────────────┤ ├──────────────┤ ├───────────────┤
   │ YOLOv8      │ │ LSTM/Prophet │ │ Iso. Forest   │
   │ OpenCV      │ │ PyTorch      │ │ Scikit-learn  │
   │ FastAPI     │ │ FastAPI      │ │ FastAPI       │
   └──────┬──────┘ └───┬──────────┘ └────┬──────────┘
          │            │                  │
          └────────────┼──────────────────┘
                       │
              ┌────────▼────────────┐
              │   DATA INGESTION    │
              ├─────────────────────┤
              │ CCTV Streams (RTSP) │
              │ IoT Sensors (MQTT)  │
              │ Weather API (REST)  │
              │ Social Media API    │
              └─────────────────────┘
```

### 4.2 Component Breakdown

#### A. Frontend Components

##### Web Dashboard (React.js)
**Technology**: React 18, Material-UI v5, Redux Toolkit, Recharts
**Key Pages**:
1. **Live Monitoring**
   - Grid view of all camera feeds
   - Real-time person counts per zone
   - Interactive heatmap (Leaflet.js)
   - Alert notifications panel

2. **Forecasting**
   - 7-day crowd prediction charts
   - Weather forecast integration
   - Festival calendar overlay
   - Confidence interval visualization

3. **Analytics**
   - Historical footfall trends
   - Peak hour analysis
   - Year-over-year comparisons
   - Export functionality

4. **Management**
   - Booking slot configuration
   - Alert threshold settings
   - User/role management
   - Temple configuration

##### Mobile App (React Native)
**Technology**: React Native 0.72, React Navigation, Redux Toolkit, Native Base
**Key Screens**:
1. **Home**: Temple selection, current crowd status
2. **Booking**: Slot selection, QR code display
3. **Live Info**: Wait times, facilities, map
4. **Profile**: Booking history, preferences
5. **SOS**: Emergency contact button

##### Admin Portal
**Extends Web Dashboard with**:
- System configuration (cameras, zones)
- Staff management
- Audit logs
- Database backups

#### B. Backend Services (Node.js)

##### API Gateway (Kong or NGINX)
- **Rate Limiting**: 100 req/min per user, 1000 req/min per admin
- **Authentication**: Verify JWT tokens
- **Load Balancing**: Round-robin to backend instances
- **Logging**: Request/response logs to ELK

##### Core Services (Express.js Microservices)

1. **Auth Service** (Port 5001)
   - User registration/login
   - JWT token generation/refresh
   - OAuth 2.0 (Google, Facebook)
   - Password reset via email

2. **Crowd Service** (Port 5002)
   - Fetch live crowd data (from Firebase)
   - Historical footfall queries (MongoDB)
   - Trigger forecast jobs (calls ML service)
   - Heatmap generation

3. **Booking Service** (Port 5003)
   - Slot availability checks
   - Create/cancel bookings
   - QR code generation
   - Booking verification at gates

4. **Temple Service** (Port 5004)
   - Temple CRUD operations
   - Zone management
   - Facility listings
   - Opening hours config

5. **Alert Service** (Port 5005)
   - Threshold monitoring
   - Alert rule engine
   - Multi-channel dispatch (Twilio, FCM)
   - Alert acknowledgment tracking

6. **User Service** (Port 5006)
   - User profile management
   - Role-based permissions
   - Volunteer management

7. **Analytics Service** (Port 5007)
   - Generate reports (daily, weekly, monthly)
   - Export to PDF/Excel
   - Trend analysis queries

##### WebSocket Server (Socket.io)
- **Real-Time Events**:
  - `crowd:update` - Live crowd counts
  - `alert:new` - New anomaly alerts
  - `booking:confirmed` - Booking confirmations
  - `system:status` - Service health updates

#### C. ML Services (Python + FastAPI)

##### 1. Crowd Detection Service (Port 8001)
**File**: `ml-services/crowd-detection/src/api.py`

**Endpoints**:
- `POST /detect` - Upload image, get person count
- `POST /detect/stream` - Process RTSP stream URL
- `GET /cameras/{id}/count` - Latest count for camera ID
- `GET /health` - Service health check

**Core Modules**:
```python
# detector.py
class YOLODetector:
    def __init__(self, model_path='yolov8n.pt'):
        self.model = YOLO(model_path)
    
    def detect(self, frame):
        results = self.model(frame, classes=[0])  # class 0 = person
        boxes = results[0].boxes
        count = len(boxes)
        return count, boxes

# stream_handler.py
class StreamProcessor:
    def process_rtsp(self, rtsp_url, fps=5):
        cap = cv2.VideoCapture(rtsp_url)
        while cap.isOpened():
            ret, frame = cap.read()
            if ret and frame_counter % (30/fps) == 0:
                count, boxes = detector.detect(frame)
                publish_to_queue(count, camera_id)
```

**Performance**: 45 FPS on NVIDIA RTX 3060, 5 FPS on CPU

##### 2. Crowd Forecasting Service (Port 8002)
**File**: `ml-services/crowd-forecasting/src/api.py`

**Endpoints**:
- `POST /forecast` - Get 7-day hourly predictions
- `POST /train` - Retrain model on new data
- `GET /models` - List available models
- `GET /accuracy` - Model performance metrics

**Core Modules**:
```python
# predictor.py
class LSTMForecaster:
    def __init__(self, model_path):
        self.model = torch.load(model_path)
        self.scaler = joblib.load('scaler.pkl')
    
    def predict(self, history, exog_features):
        # history: past 90 days hourly counts
        # exog_features: weather, holidays, festivals
        X = self.prepare_sequences(history, exog_features)
        X_scaled = self.scaler.transform(X)
        predictions = self.model(torch.tensor(X_scaled))
        return self.scaler.inverse_transform(predictions)

# prophet_forecaster.py
class ProphetForecaster:
    def __init__(self):
        self.model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False
        )
        self.add_country_holidays('IN')
        self.add_regressor('temperature')
    
    def fit(self, df):
        self.model.fit(df)
    
    def forecast(self, periods=168):  # 7 days * 24 hours
        future = self.model.make_future_dataframe(periods=periods, freq='H')
        forecast = self.model.predict(future)
        return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
```

**Accuracy**: MAE 45, RMSE 95, MAPE 12% (on validation set)

##### 3. Anomaly Detection Service (Port 8003)
**File**: `ml-services/anomaly-detection/src/api.py`

**Endpoints**:
- `POST /detect-anomaly` - Check if current crowd pattern is anomalous
- `GET /anomalies/recent` - List recent anomalies
- `POST /train` - Retrain Isolation Forest

**Core Modules**:
```python
# detector.py
class AnomalyDetector:
    def __init__(self, model_path):
        self.model = joblib.load(model_path)
    
    def detect(self, features):
        # features: [density, velocity, dwell_time, occupancy]
        score = self.model.decision_function([features])[0]
        is_anomaly = score < self.threshold  # threshold at 95th percentile
        return is_anomaly, score
    
    def train(self, normal_data):
        self.model = IsolationForest(contamination=0.05, random_state=42)
        self.model.fit(normal_data)
        scores = self.model.decision_function(normal_data)
        self.threshold = np.percentile(scores, 5)
```

#### D. Databases

##### MongoDB Schema Design

**Collections**:

1. **users**
```json
{
  "_id": "ObjectId",
  "email": "string",
  "password": "hashed_string",
  "role": "admin | staff | volunteer | devotee",
  "profile": {
    "name": "string",
    "phone": "string",
    "language": "hi | gu | en"
  },
  "temples": ["temple_id1", "temple_id2"],  // for staff
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

2. **temples**
```json
{
  "_id": "ObjectId",
  "name": "string",
  "location": {
    "type": "Point",
    "coordinates": [lng, lat]
  },
  "address": "string",
  "zones": [
    {
      "id": "zone1",
      "name": "Main Hall",
      "capacity": 500,
      "cameras": ["cam1", "cam2"]
    }
  ],
  "timings": {
    "open": "05:00",
    "close": "22:00"
  },
  "facilities": ["parking", "restroom", "wheelchair"],
  "config": {
    "dailyCapacity": 10000,
    "slotDuration": 30  // minutes
  }
}
```

3. **bookings**
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "templeId": "ObjectId",
  "slotTime": "ISODate",
  "status": "pending | confirmed | completed | cancelled",
  "qrCode": "base64_string",
  "verifiedAt": "ISODate",
  "createdAt": "ISODate"
}
```

4. **crowd_history**
```json
{
  "_id": "ObjectId",
  "templeId": "ObjectId",
  "zoneId": "string",
  "timestamp": "ISODate",
  "count": 234,
  "density": 0.67,  // count / capacity
  "source": "camera_id | turnstile_id"
}
```

5. **alerts**
```json
{
  "_id": "ObjectId",
  "templeId": "ObjectId",
  "type": "threshold | anomaly | emergency",
  "severity": "low | medium | high | critical",
  "message": "string",
  "data": {
    "zoneId": "string",
    "currentCount": 520,
    "threshold": 500
  },
  "status": "active | acknowledged | resolved",
  "acknowledgedBy": "ObjectId",
  "createdAt": "ISODate",
  "resolvedAt": "ISODate"
}
```

##### Firebase Realtime Database Structure

```
temples/
  └── {templeId}/
      ├── zones/
      │   └── {zoneId}/
      │       ├── liveCount: 234
      │       ├── density: 0.67
      │       ├── timestamp: 1737360000
      │       └── cameras/
      │           └── {cameraId}/
      │               ├── count: 45
      │               ├── status: "online"
      │               └── lastUpdate: 1737360000
      ├── alerts/
      │   └── {alertId}/
      │       ├── type: "threshold"
      │       ├── severity: "high"
      │       ├── message: "Zone capacity exceeded"
      │       └── timestamp: 1737360000
      └── forecast/
          └── {hour}/
              ├── predicted: 1200
              ├── lower: 1050
              └── upper: 1350
```

##### Redis Cache Keys

```
session:{userId}              # User session data (TTL: 7 days)
ratelimit:{ip}:{endpoint}     # Rate limit counters (TTL: 1 minute)
temple:{templeId}:info        # Temple static info (TTL: 1 hour)
forecast:{templeId}:latest    # Latest forecast (TTL: 1 day)
```

#### E. Message Queue (RabbitMQ)

**Exchanges & Queues**:

1. **video_processing_exchange** (Topic)
   - Queue: `video.frames.{camera_id}`
   - Producers: CCTV ingest service
   - Consumers: ML detection service

2. **alerts_exchange** (Fanout)
   - Queue: `alerts.sms`
   - Queue: `alerts.push`
   - Queue: `alerts.email`
   - Consumers: Notification services

3. **analytics_exchange** (Topic)
   - Queue: `analytics.crowd`
   - Queue: `analytics.booking`
   - Consumers: Analytics service

---

## 5. Technology Stack Deep Dive

### 5.1 Frontend Technologies

#### React.js (Web Dashboard)
**Why React?**
- Component reusability (cards, charts, tables)
- Virtual DOM for fast re-renders (live updates)
- Large ecosystem (Material-UI, Redux, Recharts)
- Strong community support

**Key Libraries**:
```json
{
  "react": "^18.2.0",
  "react-redux": "^8.1.0",
  "@reduxjs/toolkit": "^1.9.5",
  "@mui/material": "^5.14.0",
  "recharts": "^2.7.2",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "socket.io-client": "^4.7.0",
  "axios": "^1.4.0",
  "date-fns": "^2.30.0"
}
```

**State Management**:
- **Redux Toolkit** for global state (user, temples, alerts)
- **React Query** for server state (API caching, auto-refetch)
- **Context API** for theme, language

**Folder Structure**:
```
frontend/src/
├── components/
│   ├── common/              # Buttons, inputs, modals
│   ├── dashboard/           # Dashboard-specific components
│   ├── heatmap/             # Crowd heatmap component
│   └── charts/              # Chart wrappers
├── pages/
│   ├── Dashboard.jsx
│   ├── Forecasting.jsx
│   ├── Analytics.jsx
│   └── Settings.jsx
├── store/
│   ├── slices/              # Redux slices
│   └── store.js
├── services/
│   └── api.js               # Axios instance & API calls
└── utils/
    ├── formatters.js        # Date, number formatters
    └── constants.js
```

#### React Native (Mobile App)
**Why React Native?**
- Single codebase for iOS & Android (60% code reuse)
- Native performance for maps, camera access
- Hot reloading for faster development
- Expo for simplified build/deploy

**Key Libraries**:
```json
{
  "react-native": "0.72.0",
  "@react-navigation/native": "^6.1.7",
  "@react-navigation/stack": "^6.3.17",
  "native-base": "^3.4.28",
  "react-native-maps": "^1.7.1",
  "react-native-camera": "^4.2.1",
  "react-native-qrcode-scanner": "^1.5.5",
  "@react-native-firebase/messaging": "^18.3.0"
}
```

### 5.2 Backend Technologies

#### Node.js + Express.js
**Why Node.js?**
- Non-blocking I/O (handle thousands of concurrent connections)
- JavaScript everywhere (frontend & backend)
- Fast JSON processing (REST APIs)
- Rich ecosystem (NPM)

**Key Packages**:
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.4.0",
  "jsonwebtoken": "^9.0.1",
  "bcryptjs": "^2.4.3",
  "joi": "^17.9.2",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "express-rate-limit": "^6.10.0",
  "winston": "^3.10.0",
  "socket.io": "^4.7.0",
  "bull": "^4.11.3",
  "twilio": "^4.14.0",
  "firebase-admin": "^11.10.0"
}
```

**Architecture Pattern**: Microservices with API Gateway
- Each service independently deployable
- Service-to-service communication via REST + RabbitMQ
- Shared MongoDB (future: per-service databases)

### 5.3 ML/AI Technologies

#### Python Ecosystem
**Why Python?**
- De facto language for ML/AI
- Rich libraries (TensorFlow, PyTorch, OpenCV, scikit-learn)
- Fast prototyping with Jupyter Notebooks
- Strong computer vision support

#### YOLOv8 (Ultralytics)
**Why YOLOv8?**
- State-of-the-art accuracy + speed trade-off
- Easy fine-tuning on custom datasets
- Multiple model sizes (nano, small, medium, large, xlarge)
- Built-in tracking (ByteTrack)
- Exportable to ONNX, TensorRT for edge deployment

**Installation & Usage**:
```bash
pip install ultralytics

# Inference
from ultralytics import YOLO
model = YOLO('yolov8n.pt')  # Nano model (fastest)
results = model('crowd_image.jpg', classes=[0])  # Detect persons only
count = len(results[0].boxes)
```

**Fine-Tuning**:
```yaml
# temple_dataset.yaml
train: ../datasets/train/images
val: ../datasets/val/images
nc: 1  # Number of classes
names: ['person']
```

```python
# train.py
from ultralytics import YOLO

model = YOLO('yolov8n.pt')  # Start from pretrained
results = model.train(
    data='temple_dataset.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    device=0  # GPU
)
```

#### LSTM (PyTorch)
**Why LSTM?**
- Excellent for time-series with long dependencies
- Handles seasonality (daily, weekly, yearly patterns)
- Outperforms ARIMA on complex, non-linear data

**Model Architecture**:
```python
import torch
import torch.nn as nn

class CrowdLSTM(nn.Module):
    def __init__(self, input_size=10, hidden_size=128, num_layers=3):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc1 = nn.Linear(hidden_size, 64)
        self.fc2 = nn.Linear(64, 1)  # Output: crowd count
    
    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        out = self.fc1(lstm_out[:, -1, :])  # Last time step
        out = torch.relu(out)
        out = self.fc2(out)
        return out
```

**Features**:
- Historical footfall (lag 1, 7, 24, 168 hours)
- Day of week (one-hot encoded)
- Hour of day (cyclical encoding: sin, cos)
- Holiday flag (0/1)
- Festival flag (0/1)
- Temperature (°C)
- Rainfall (mm)

#### Facebook Prophet
**Why Prophet?**
- Handles missing data gracefully
- Automatic detection of trend change points
- Easy to add custom seasonality (festivals)
- Confidence intervals out-of-the-box

**Usage**:
```python
from prophet import Prophet
import pandas as pd

# Prepare data
df = pd.DataFrame({
    'ds': dates,  # Date column
    'y': footfall  # Target column
})

# Add regressors
df['temperature'] = temperatures

# Initialize model
model = Prophet(yearly_seasonality=True, weekly_seasonality=True)
model.add_country_holidays(country_name='IN')
model.add_regressor('temperature')

# Train
model.fit(df)

# Forecast
future = model.make_future_dataframe(periods=168, freq='H')  # 7 days
future['temperature'] = predicted_temps
forecast = model.predict(future)
```

#### Isolation Forest (scikit-learn)
**Why Isolation Forest?**
- Unsupervised (no labeled anomalies needed)
- Fast training & inference
- Works well on high-dimensional data
- Low false-positive rate

**Usage**:
```python
from sklearn.ensemble import IsolationForest
import numpy as np

# Train on normal crowd patterns
normal_data = np.array([
    [density, velocity, dwell_time, occupancy],
    # ... thousands of normal samples
])

model = IsolationForest(contamination=0.05, random_state=42)
model.fit(normal_data)

# Predict on new data
new_sample = [[0.85, 1.2, 45, 0.92]]  # High density, slow velocity
score = model.decision_function(new_sample)[0]
is_anomaly = model.predict(new_sample)[0]  # -1 = anomaly, 1 = normal
```

### 5.4 Database Technologies

#### MongoDB
**Why MongoDB?**
- Flexible schema (easy to iterate)
- Horizontal scaling (sharding)
- Rich query language (aggregation pipeline)
- Official Node.js driver (Mongoose)

**When to Use**:
- User profiles, temples, bookings (structured documents)
- Historical crowd data (can aggregate by date, zone)
- Alerts, logs (append-only with TTL indexes)

**Indexing Strategy**:
```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1, temples: 1 });

// Crowd history
db.crowd_history.createIndex({ templeId: 1, timestamp: -1 });
db.crowd_history.createIndex({ timestamp: 1 }, { expireAfterSeconds: 2592000 });  // 30 days TTL

// Bookings
db.bookings.createIndex({ userId: 1, slotTime: -1 });
db.bookings.createIndex({ templeId: 1, slotTime: 1 });
```

#### Firebase Realtime Database
**Why Firebase?**
- True real-time sync (<100ms latency)
- Offline support (mobile apps)
- Simple REST API
- No server management

**When to Use**:
- Live crowd counts (updates every 5 seconds)
- Active alerts (instant notifications)
- Chat/messaging (future feature)

**Security Rules**:
```json
{
  "rules": {
    "temples": {
      "$templeId": {
        ".read": "auth != null",
        "zones": {
          ".read": "auth != null",
          ".write": "root.child('users').child(auth.uid).child('role').val() === 'admin'"
        }
      }
    }
  }
}
```

#### Redis
**Why Redis?**
- In-memory storage (sub-millisecond latency)
- Built-in data structures (strings, hashes, sets, sorted sets)
- TTL support (automatic expiration)
- Pub/Sub for real-time messaging

**When to Use**:
- Session storage (JWT refresh tokens)
- Rate limiting counters
- Caching API responses (temple info, forecasts)
- Leaderboards (future: most visited temples)

---

## 6. Development Phases

### Phase 1: Foundation & MVP (Months 1-3)

#### Month 1: Setup & Core Backend
**Week 1-2: Project Setup**
- [ ] Initialize Git repository
- [ ] Setup development environment (Docker Compose)
- [ ] Configure MongoDB, Redis, RabbitMQ
- [ ] Create project structure (monorepo with Nx or Lerna)
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Write development documentation

**Week 3-4: Authentication & User Management**
- [ ] Implement user registration/login (JWT)
- [ ] Role-based access control (admin, staff, devotee)
- [ ] Password reset flow (email OTP)
- [ ] User profile CRUD APIs
- [ ] Unit tests (Jest) for auth logic

#### Month 2: Temple & Crowd Services
**Week 1-2: Temple Management**
- [ ] Temple CRUD APIs
- [ ] Zone configuration endpoints
- [ ] Facility listings
- [ ] Image uploads (AWS S3 or local storage)
- [ ] Google Maps integration for location

**Week 3-4: Crowd Monitoring Backend**
- [ ] MongoDB schema for crowd_history
- [ ] Firebase integration for real-time counts
- [ ] REST APIs to fetch live/historical crowd data
- [ ] WebSocket server for live updates
- [ ] Alert threshold monitoring logic

#### Month 3: ML Detection Service & Dashboard
**Week 1-2: YOLOv8 Integration**
- [ ] Setup Python environment (Docker container)
- [ ] Download/train YOLOv8 model
- [ ] Build FastAPI service for person detection
- [ ] RTSP stream ingestion (OpenCV)
- [ ] RabbitMQ integration (publish counts)
- [ ] Dockerize ML service

**Week 3-4: Web Dashboard (MVP)**
- [ ] React app scaffold (Create React App)
- [ ] Login/logout UI
- [ ] Live monitoring page (fetch from WebSocket)
- [ ] Simple crowd count display (numbers + bar charts)
- [ ] Temple selection dropdown
- [ ] Responsive design (mobile-first)

**Milestone 1 Demo**: Admin can log in, view live crowd counts from 1-2 test cameras

---

### Phase 2: Booking & Forecasting (Months 4-6)

#### Month 4: Booking System
**Week 1-2: Backend Booking Logic**
- [ ] Slot generation algorithm (based on capacity, duration)
- [ ] Booking creation/cancellation APIs
- [ ] QR code generation (qrcode library)
- [ ] Booking verification endpoint
- [ ] Overbooking prevention (pessimistic locking)

**Week 3-4: Mobile App Foundation**
- [ ] React Native project setup (Expo)
- [ ] Navigation structure (React Navigation)
- [ ] Temple browsing UI
- [ ] Booking flow screens (date → slot → confirm)
- [ ] QR code display screen
- [ ] Push notification setup (Firebase Cloud Messaging)

#### Month 5: Forecasting Models
**Week 1-2: Data Collection & Preprocessing**
- [ ] Scrape historical footfall data (if available)
- [ ] Fetch weather data (OpenWeatherMap API)
- [ ] Create training datasets (CSV with features)
- [ ] Data normalization/scaling
- [ ] Train/test split (80/20)

**Week 3-4: LSTM Implementation**
- [ ] Build PyTorch LSTM model
- [ ] Train on historical data (100 epochs)
- [ ] Evaluate metrics (MAE, RMSE, MAPE)
- [ ] Save trained model (.pt file)
- [ ] FastAPI endpoint for predictions
- [ ] Integrate with backend (scheduled daily job)

#### Month 6: Anomaly Detection & Alerts
**Week 1-2: Isolation Forest**
- [ ] Feature engineering (density, velocity, dwell time)
- [ ] Train Isolation Forest on normal patterns
- [ ] Tune contamination parameter (validation set)
- [ ] FastAPI endpoint for anomaly checks
- [ ] Real-time anomaly monitoring (poll every 30s)

**Week 3-4: Alert System**
- [ ] Twilio integration (SMS alerts)
- [ ] Firebase Cloud Messaging (push notifications)
- [ ] Email alerts (SendGrid or Nodemailer)
- [ ] Alert dashboard UI (admin can view/acknowledge)
- [ ] Alert history logs

**Milestone 2 Demo**: Devotees can book slots via mobile app; admins see 7-day forecasts and receive SMS alerts

---

### Phase 3: Advanced Features (Months 7-9)

#### Month 7: Heatmaps & Analytics
**Week 1-2: Crowd Density Heatmap**
- [ ] Spatial density calculation (Gaussian kernel)
- [ ] Leaflet.js heatmap layer (leaflet.heat plugin)
- [ ] Color-coded zones (green, yellow, red)
- [ ] Time-slider to replay historical heatmaps

**Week 3-4: Analytics Dashboard**
- [ ] Daily/weekly/monthly footfall reports
- [ ] Peak hour charts (Recharts bar/line charts)
- [ ] Year-over-year comparison
- [ ] Export to PDF (jsPDF) and Excel (xlsx library)

#### Month 8: Multi-Camera Tracking
**Week 1-2: Person Re-Identification**
- [ ] Integrate ByteTrack or DeepSORT
- [ ] Track persons across multiple cameras
- [ ] Estimate flow direction (entry vs exit)
- [ ] Average dwell time per zone

**Week 3-4: Advanced Forecasting**
- [ ] Prophet model implementation
- [ ] Ensemble forecasting (LSTM + Prophet + XGBoost)
- [ ] Model comparison UI (which model is most accurate)
- [ ] Confidence intervals visualization

#### Month 9: Mobile App Enhancements
**Week 1-2: Navigation & Maps**
- [ ] In-app Google/OpenStreetMap integration
- [ ] Turn-by-turn directions (parking → entry)
- [ ] Facility markers (toilets, water, first-aid)
- [ ] Offline map caching

**Week 3-4: User Experience**
- [ ] Multilingual support (Hindi, Gujarati, English)
- [ ] Dark mode
- [ ] Accessibility (screen reader support)
- [ ] SOS button (call emergency contact)

**Milestone 3 Demo**: Full-featured platform with heatmaps, analytics, multi-camera tracking, and polished mobile app

---

### Phase 4: IoT & Scale (Months 10-12)

#### Month 10: IoT Integration
**Week 1-2: RFID Wristbands**
- [ ] RFID reader integration (MQTT protocol)
- [ ] Wristband data ingestion (pilgrim ID, entry time)
- [ ] Real-time location tracking (if UHF RFID)
- [ ] Lost pilgrim alerts

**Week 3-4: Environmental Sensors**
- [ ] Temperature/humidity sensors (DHT22)
- [ ] Noise level sensors (sound pressure)
- [ ] Air quality sensors (PM2.5, CO2)
- [ ] Dashboard widgets for sensor data

#### Month 11: Edge Deployment
**Week 1-2: Edge Computing Setup**
- [ ] Deploy ML models on NVIDIA Jetson Nano
- [ ] Optimize models (TensorRT, ONNX)
- [ ] Local video processing (reduce bandwidth)
- [ ] Sync results to cloud periodically

**Week 3-4: Smart Turnstiles**
- [ ] Integrate turnstile counters (REST API or serial)
- [ ] Validate booking QR codes at gates
- [ ] Auto-increment crowd counts
- [ ] Generate entry/exit logs

#### Month 12: Multi-Tenancy & Scale
**Week 1-2: Multi-Temple Support**
- [ ] Refactor database schema (tenant isolation)
- [ ] Subdomain-based routing (somnath.app.com, dwarka.app.com)
- [ ] White-label mobile app (custom branding per temple)
- [ ] Central admin portal (super-admin role)

**Week 3-4: Performance Optimization**
- [ ] Database query optimization (indexes, aggregation)
- [ ] API caching (Redis)
- [ ] CDN for static assets (Cloudflare)
- [ ] Load testing (Apache JMeter, k6)
- [ ] Kubernetes deployment (auto-scaling)

**Milestone 4 Demo**: Platform scaled to 20+ temples with IoT sensors, edge ML processing, and white-label apps

---

## 7. ML Model Development Pipeline

### 7.1 YOLOv8 Person Detection

#### Dataset Preparation
**Sources**:
1. **COCO Dataset** (pre-training): 330,000 images, 80 classes
2. **Custom Temple Footage**: Record 50+ hours from Somnath, Dwarka
3. **ShanghaiTech Crowd Dataset**: 1,198 images with crowd annotations
4. **Mall Dataset**: 2,000 frames from shopping mall CCTVs

**Annotation Process**:
```bash
# Install LabelImg
pip install labelImg

# Annotate images
labelImg ./datasets/raw/temple_images/ ./datasets/annotations/

# Convert to YOLO format
python scripts/convert_to_yolo.py
```

**YOLO Format** (one .txt per image):
```
0 0.5 0.5 0.2 0.3
0 0.7 0.4 0.15 0.25
# class_id x_center y_center width height (normalized 0-1)
```

**Dataset Split**:
- Train: 70% (3,500 images)
- Validation: 20% (1,000 images)
- Test: 10% (500 images)

#### Training
```python
# train_yolo.py
from ultralytics import YOLO

# Start from pretrained COCO weights
model = YOLO('yolov8n.pt')

results = model.train(
    data='temple_dataset.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    device=0,  # GPU
    project='temple_detection',
    name='yolov8n_v1',
    patience=10,  # Early stopping
    save=True,
    plots=True
)

# Validate
metrics = model.val()
print(f"mAP50: {metrics.box.map50}")
print(f"Precision: {metrics.box.p}")
print(f"Recall: {metrics.box.r}")

# Export to ONNX (for faster inference)
model.export(format='onnx')
```

**Expected Results**:
- **mAP@50**: 0.92+
- **Precision**: 0.89+
- **Recall**: 0.87+
- **Inference Speed**: 45 FPS on RTX 3060, 5 FPS on CPU

#### Deployment
```python
# detector.py
from ultralytics import YOLO
import cv2

class PersonDetector:
    def __init__(self, model_path='yolov8n.pt', conf=0.5):
        self.model = YOLO(model_path)
        self.conf = conf
    
    def detect(self, frame):
        results = self.model(frame, classes=[0], conf=self.conf, verbose=False)
        boxes = results[0].boxes
        count = len(boxes)
        
        # Draw bounding boxes (optional, for visualization)
        annotated = results[0].plot()
        
        return count, annotated
    
    def process_stream(self, rtsp_url, fps=5):
        cap = cv2.VideoCapture(rtsp_url)
        frame_counter = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_counter += 1
            if frame_counter % (30 // fps) == 0:  # Process every Nth frame
                count, _ = self.detect(frame)
                yield count, frame_counter
        
        cap.release()
```

### 7.2 LSTM Crowd Forecasting

#### Dataset Preparation
**Historical Data Collection**:
- Scrape footfall data from temple websites (if available)
- Use manual gate counters (digitize Excel sheets)
- Estimate from past booking records
- Collect for 2+ years (capture yearly seasonality)

**Feature Engineering**:
```python
import pandas as pd
import numpy as np

def create_features(df):
    df = df.copy()
    
    # Time-based features
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['day_of_month'] = df['timestamp'].dt.day
    df['month'] = df['timestamp'].dt.month
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    
    # Cyclical encoding
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
    df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
    
    # Lag features
    df['count_lag_1h'] = df['count'].shift(1)
    df['count_lag_24h'] = df['count'].shift(24)
    df['count_lag_7d'] = df['count'].shift(24 * 7)
    
    # Rolling statistics
    df['count_rolling_mean_24h'] = df['count'].rolling(24).mean()
    df['count_rolling_std_24h'] = df['count'].rolling(24).std()
    
    # External features
    df['temperature'] = df['temperature'].fillna(df['temperature'].mean())
    df['is_holiday'] = df['timestamp'].apply(lambda x: is_indian_holiday(x))
    df['is_festival'] = df['timestamp'].apply(lambda x: is_festival_day(x))
    
    return df.dropna()

# Load data
df = pd.read_csv('datasets/processed/footfall_hourly.csv', parse_dates=['timestamp'])
df = create_features(df)

# Save processed data
df.to_csv('datasets/processed/footfall_features.csv', index=False)
```

#### Model Architecture
```python
import torch
import torch.nn as nn

class CrowdLSTM(nn.Module):
    def __init__(self, input_size=15, hidden_size=128, num_layers=3, dropout=0.2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size, 
            hidden_size, 
            num_layers, 
            batch_first=True, 
            dropout=dropout
        )
        self.fc1 = nn.Linear(hidden_size, 64)
        self.dropout = nn.Dropout(dropout)
        self.fc2 = nn.Linear(64, 1)
    
    def forward(self, x):
        # x shape: (batch, sequence_length, input_size)
        lstm_out, (h_n, c_n) = self.lstm(x)
        
        # Use last time step output
        last_output = lstm_out[:, -1, :]
        
        # Fully connected layers
        out = torch.relu(self.fc1(last_output))
        out = self.dropout(out)
        out = self.fc2(out)
        
        return out
```

#### Training Script
```python
# train_lstm.py
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import MinMaxScaler
import numpy as np

class CrowdDataset(Dataset):
    def __init__(self, data, sequence_length=24):
        self.data = data
        self.seq_len = sequence_length
    
    def __len__(self):
        return len(self.data) - self.seq_len
    
    def __getitem__(self, idx):
        X = self.data[idx:idx+self.seq_len, :-1]  # All features except target
        y = self.data[idx+self.seq_len, -1]  # Target (next hour count)
        return torch.FloatTensor(X), torch.FloatTensor([y])

# Load and prepare data
df = pd.read_csv('datasets/processed/footfall_features.csv')
data = df[['hour_sin', 'hour_cos', 'day_sin', 'day_cos', 
           'count_lag_1h', 'count_lag_24h', 'count_lag_7d',
           'count_rolling_mean_24h', 'temperature', 
           'is_weekend', 'is_holiday', 'is_festival', 'count']].values

# Normalize
scaler = MinMaxScaler()
data_scaled = scaler.fit_transform(data)

# Train/val split
train_size = int(0.8 * len(data_scaled))
train_data = data_scaled[:train_size]
val_data = data_scaled[train_size:]

# Create datasets
train_dataset = CrowdDataset(train_data, sequence_length=24)
val_dataset = CrowdDataset(val_data, sequence_length=24)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

# Initialize model
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = CrowdLSTM(input_size=12).to(device)
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# Training loop
num_epochs = 100
best_val_loss = float('inf')

for epoch in range(num_epochs):
    # Train
    model.train()
    train_loss = 0
    for X_batch, y_batch in train_loader:
        X_batch, y_batch = X_batch.to(device), y_batch.to(device)
        
        optimizer.zero_grad()
        outputs = model(X_batch)
        loss = criterion(outputs, y_batch)
        loss.backward()
        optimizer.step()
        
        train_loss += loss.item()
    
    # Validate
    model.eval()
    val_loss = 0
    with torch.no_grad():
        for X_batch, y_batch in val_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            outputs = model(X_batch)
            loss = criterion(outputs, y_batch)
            val_loss += loss.item()
    
    train_loss /= len(train_loader)
    val_loss /= len(val_loader)
    
    print(f'Epoch {epoch+1}/{num_epochs}, Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}')
    
    # Save best model
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        torch.save(model.state_dict(), 'ml-services/crowd-forecasting/models/lstm_best.pt')

# Save scaler
import joblib
joblib.dump(scaler, 'ml-services/crowd-forecasting/models/scaler.pkl')
```

#### Inference
```python
# predictor.py
import torch
import joblib

class CrowdPredictor:
    def __init__(self, model_path, scaler_path):
        self.model = CrowdLSTM()
        self.model.load_state_dict(torch.load(model_path))
        self.model.eval()
        self.scaler = joblib.load(scaler_path)
    
    def predict(self, history, exog_features):
        """
        Args:
            history: Last 24 hours of data (list of dicts)
            exog_features: Future 7 days of external features (weather, holidays)
        
        Returns:
            predictions: Next 168 hours (7 days) of crowd counts
        """
        # Prepare input sequence
        X = self.prepare_sequence(history)
        X_scaled = self.scaler.transform(X)
        
        predictions = []
        current_seq = torch.FloatTensor(X_scaled[-24:]).unsqueeze(0)  # Last 24 hours
        
        # Iterative prediction
        for i in range(168):  # 7 days * 24 hours
            with torch.no_grad():
                pred = self.model(current_seq)
            
            pred_value = pred.item()
            predictions.append(pred_value)
            
            # Update sequence (rolling window)
            new_features = self.create_features(exog_features[i], pred_value)
            new_features_scaled = self.scaler.transform([new_features])
            current_seq = torch.cat([
                current_seq[:, 1:, :],  # Remove oldest
                torch.FloatTensor(new_features_scaled).unsqueeze(0)  # Add newest
            ], dim=1)
        
        # Inverse transform predictions
        predictions = self.scaler.inverse_transform(
            np.array(predictions).reshape(-1, 1)
        )
        
        return predictions.flatten()
```

**Expected Performance**:
- **MAE**: 45-55 (mean absolute error in person count)
- **RMSE**: 90-110
- **MAPE**: 10-15%
- **R²**: 0.85-0.90

### 7.3 Anomaly Detection

#### Training
```python
# train_anomaly_detector.py
from sklearn.ensemble import IsolationForest
import joblib

# Load normal crowd data (exclude incidents, stampedes)
normal_data = pd.read_csv('datasets/processed/normal_patterns.csv')

# Features
features = ['density', 'avg_velocity', 'dwell_time', 'occupancy_rate']
X = normal_data[features].values

# Train Isolation Forest
model = IsolationForest(
    contamination=0.05,  # 5% of data assumed anomalous (tune on validation)
    random_state=42,
    n_estimators=100,
    max_samples='auto'
)
model.fit(X)

# Determine threshold
scores = model.decision_function(X)
threshold = np.percentile(scores, 5)  # 5th percentile

# Save model and threshold
joblib.dump(model, 'ml-services/anomaly-detection/models/isolation_forest.pkl')
joblib.dump(threshold, 'ml-services/anomaly-detection/models/threshold.pkl')

print(f"Model trained. Threshold: {threshold}")
```

#### Inference
```python
# detector.py
class AnomalyDetector:
    def __init__(self, model_path, threshold_path):
        self.model = joblib.load(model_path)
        self.threshold = joblib.load(threshold_path)
    
    def detect(self, density, avg_velocity, dwell_time, occupancy_rate):
        features = [[density, avg_velocity, dwell_time, occupancy_rate]]
        score = self.model.decision_function(features)[0]
        is_anomaly = score < self.threshold
        
        # Calculate severity (0-100)
        severity = max(0, min(100, (self.threshold - score) * 10))
        
        return {
            'is_anomaly': bool(is_anomaly),
            'score': float(score),
            'severity': int(severity),
            'threshold': float(self.threshold)
        }
```

---

## 8. Data Collection & Management

### 8.1 Data Sources

#### Primary Sources
1. **CCTV Cameras**: 100+ cameras per temple site
   - Location: Entry gates, main halls, corridors, parking
   - Specs: 1080p, 25 FPS, H.264 encoding
   - Protocol: RTSP streams

2. **IoT Sensors** (Phase 3)
   - RFID readers (entry/exit gates)
   - Environmental sensors (temperature, humidity, noise, air quality)
   - Smart turnstiles (mechanical counters)
   - Parking sensors (ultrasonic or magnetic)

3. **Manual Counters**
   - Gate staff with clickers (backup)
   - Booking records (digital tokens)

#### External APIs
1. **Weather Data**: OpenWeatherMap API
   - Endpoint: `https://api.openweathermap.org/data/2.5/forecast`
   - Features: Temperature, precipitation, humidity, wind speed
   - Update frequency: Every 3 hours

2. **Holiday/Festival Calendar**
   - Indian Government Holiday API (if available)
   - Manual JSON file: `config/festivals.json`
   ```json
   {
     "festivals": [
       {"name": "Mahashivratri", "date": "2026-03-08", "impact": "high"},
       {"name": "Navratri", "dates": ["2026-10-13", "2026-10-21"], "impact": "critical"}
     ]
   }
   ```

3. **Social Media** (Future)
   - Twitter API (search for temple mentions, sentiment analysis)
   - Instagram API (user-generated photos → estimate crowd visually)

### 8.2 Data Pipelines

#### Real-Time Ingestion (Video Streams)
```
CCTV (RTSP) → OpenCV Capture → YOLOv8 Inference → RabbitMQ Queue 
→ Backend Listener → Firebase (real-time) + MongoDB (historical)
```

**Implementation** (`ml-services/crowd-detection/src/stream_handler.py`):
```python
import cv2
import pika
import json
from detector import PersonDetector

class StreamIngestion:
    def __init__(self, rtsp_url, camera_id, rabbitmq_url):
        self.cap = cv2.VideoCapture(rtsp_url)
        self.camera_id = camera_id
        self.detector = PersonDetector()
        
        # RabbitMQ connection
        self.connection = pika.BlockingConnection(pika.URLParameters(rabbitmq_url))
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue='crowd_counts')
    
    def start(self, fps=5):
        frame_counter = 0
        
        while self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret:
                print("Stream ended or error")
                break
            
            frame_counter += 1
            if frame_counter % (25 // fps) == 0:  # Process every Nth frame
                count, _ = self.detector.detect(frame)
                
                # Publish to RabbitMQ
                message = {
                    'camera_id': self.camera_id,
                    'count': count,
                    'timestamp': datetime.now().isoformat()
                }
                self.channel.basic_publish(
                    exchange='',
                    routing_key='crowd_counts',
                    body=json.dumps(message)
                )
                
                print(f"Camera {self.camera_id}: {count} persons detected")
        
        self.cap.release()
        self.connection.close()
```

#### Batch Data Collection (Historical)
```bash
# Collect past footfall data from Excel/CSV
python scripts/import_historical_data.py --input data/temple_footfall_2022-2024.csv

# Fetch weather history
python scripts/fetch_weather_history.py --location "Somnath, Gujarat" --start 2022-01-01 --end 2024-12-31
```

### 8.3 Data Storage

#### Hot Storage (Last 30 days)
- **MongoDB** (`crowd_history` collection): 
  - Size: ~50 MB per temple per month (assuming 1 record/5sec)
  - Retention: 30 days (TTL index)

- **Firebase Realtime Database**:
  - Size: ~5 MB per temple (current snapshot only)
  - Update frequency: Every 5 seconds

#### Cold Storage (> 30 days)
- **AWS S3** or **Azure Blob Storage**:
  - Compress and archive daily aggregates
  - Format: Parquet (efficient for analytics)
  - Cost: ~$0.023 per GB/month

#### Backup Strategy
- **MongoDB**: Daily backups to S3 (mongodump)
- **Firebase**: Export JSON weekly
- **Model Files**: Version control with DVC (Data Version Control)

### 8.4 Data Privacy & Anonymization

#### Video Footage
- **Storage**: Encrypt with AES-256
- **Retention**: 30 days, then auto-delete (unless incident)
- **Access**: Restricted to authorized admins (audit logs)

#### Crowd Counts
- **Anonymized**: No PII stored (only counts, not identities)
- **Aggregated**: Export only zone-level or temple-level stats

#### RFID Wristbands (Future)
- **Opt-in**: Pilgrims consent at registration
- **Data**: Pilgrim ID (hashed), entry/exit timestamps, emergency contact
- **Retention**: Delete after pilgrimage ends (or 7 days)

---

## 9. Security & Privacy Framework

### 9.1 Authentication & Authorization

#### JWT-Based Auth
```javascript
// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];  // Bearer <token>
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // { userId, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
```

**Usage**:
```javascript
router.get('/admin/users', authenticate, authorize('admin'), getUsersController);
```

#### OAuth 2.0 (Google, Facebook)
- Use **Passport.js** strategies
- Store OAuth tokens securely (encrypted in DB)
- Refresh tokens before expiry

### 9.2 Data Encryption

#### At Rest
- **MongoDB**: Enable encryption at rest (Enterprise feature or AWS DocumentDB)
- **Redis**: Use RDB/AOF persistence with encryption
- **S3**: Enable server-side encryption (SSE-S3 or SSE-KMS)

#### In Transit
- **HTTPS**: TLS 1.3 for all web/API traffic
- **RTSP over TLS**: Secure CCTV streams (if supported)
- **Database Connections**: TLS/SSL for MongoDB, Redis connections

### 9.3 Input Validation & Sanitization

```javascript
// backend/src/middleware/validation.js
const Joi = require('joi');

const bookingSchema = Joi.object({
  templeId: Joi.string().required(),
  slotTime: Joi.date().iso().required(),
  userId: Joi.string().required()
});

function validateBooking(req, res, next) {
  const { error } = bookingSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
}
```

### 9.4 Rate Limiting

```javascript
// backend/src/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,  // 100 requests per minute
  message: 'Too many requests, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 login attempts
  message: 'Too many login attempts, please try again after 15 minutes.'
});

module.exports = { apiLimiter, authLimiter };
```

### 9.5 Security Headers (Helmet.js)

```javascript
const helmet = require('helmet');

app.use(helmet());  // Sets multiple security headers:
// - Content-Security-Policy
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - Strict-Transport-Security
```

### 9.6 GDPR-like Compliance (Future DPDP Act)

#### User Rights
1. **Right to Access**: Users can download their data (bookings, profile)
2. **Right to Deletion**: Users can request account deletion
3. **Right to Rectification**: Users can update profile info
4. **Data Portability**: Export data in JSON/CSV format

#### Implementation
```javascript
// backend/src/routes/user.routes.js
router.delete('/me', authenticate, async (req, res) => {
  const userId = req.user.userId;
  
  // Delete user data
  await User.findByIdAndDelete(userId);
  await Booking.deleteMany({ userId });
  
  res.json({ message: 'Account deleted successfully' });
});

router.get('/me/export', authenticate, async (req, res) => {
  const userId = req.user.userId;
  
  const userData = await User.findById(userId).lean();
  const bookings = await Booking.find({ userId }).lean();
  
  res.json({ user: userData, bookings });
});
```

---

## 10. Testing Strategy

### 10.1 Unit Testing

#### Backend (Jest + Supertest)
```javascript
// backend/tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });
  
  it('should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User'
      });
    
    expect(res.statusCode).toBe(400);
  });
});
```

#### ML Services (pytest)
```python
# ml-services/crowd-detection/tests/test_detector.py
import pytest
from src.detector import PersonDetector

def test_person_detection():
    detector = PersonDetector(model_path='models/yolov8n.pt')
    
    # Load test image
    import cv2
    frame = cv2.imread('tests/fixtures/crowd_sample.jpg')
    
    count, boxes = detector.detect(frame)
    
    assert count > 0, "Should detect at least 1 person"
    assert len(boxes) == count, "Box count should match person count"

def test_empty_frame():
    detector = PersonDetector()
    
    import numpy as np
    empty_frame = np.zeros((640, 640, 3), dtype=np.uint8)
    
    count, _ = detector.detect(empty_frame)
    
    assert count == 0, "Should detect 0 persons in empty frame"
```

### 10.2 Integration Testing

#### API Integration
```javascript
// backend/tests/integration/booking.test.js
describe('Booking Flow', () => {
  let authToken;
  let templeId;
  
  beforeAll(async () => {
    // Setup: Register user, get token, create temple
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'devotee@example.com', password: 'Pass123!', name: 'Devotee' });
    authToken = registerRes.body.token;
    
    const templeRes = await request(app)
      .post('/api/v1/temples')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Temple', location: { lat: 20.8, lng: 70.4 } });
    templeId = templeRes.body.temple._id;
  });
  
  it('should book a slot successfully', async () => {
    const slotTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();  // Tomorrow
    
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ templeId, slotTime });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.booking).toHaveProperty('qrCode');
  });
});
```

### 10.3 End-to-End Testing

#### Frontend (Cypress)
```javascript
// frontend/cypress/e2e/booking_flow.cy.js
describe('Devotee Booking Flow', () => {
  it('should allow user to book a slot', () => {
    // Visit app
    cy.visit('http://localhost:3000');
    
    // Login
    cy.get('[data-testid=email-input]').type('devotee@example.com');
    cy.get('[data-testid=password-input]').type('Pass123!');
    cy.get('[data-testid=login-button]').click();
    
    // Navigate to booking page
    cy.contains('Book Darshan').click();
    
    // Select temple
    cy.get('[data-testid=temple-select]').click();
    cy.contains('Somnath Temple').click();
    
    // Select date
    cy.get('[data-testid=date-picker]').click();
    cy.contains('25').click();  // Tomorrow's date
    
    // Select time slot
    cy.contains('10:00 AM - 10:30 AM').click();
    
    // Confirm booking
    cy.get('[data-testid=confirm-booking-button]').click();
    
    // Verify success message
    cy.contains('Booking Confirmed').should('be.visible');
    cy.get('[data-testid=qr-code]').should('exist');
  });
});
```

### 10.4 Performance Testing

#### Load Testing (k6)
```javascript
// tests/load/api_load_test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% errors
  },
};

export default function () {
  // Test GET /api/v1/temples
  let res = http.get('http://localhost:5000/api/v1/temples');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

**Run**: `k6 run tests/load/api_load_test.js`

### 10.5 Security Testing

#### Penetration Testing
- Use **OWASP ZAP** (Zed Attack Proxy) for automated scans
- Test for SQL injection, XSS, CSRF vulnerabilities
- Perform manual testing of authentication flows

#### Dependency Scanning
```bash
# Node.js (backend)
npm audit
npm audit fix

# Python (ML services)
pip install safety
safety check
```

---

## 11. Deployment Strategy

### 11.1 Development Environment (Docker Compose)

**File**: `infra/docker-compose.yml`
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7.0-alpine
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3.12-management
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password123

  backend:
    build: ../backend
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://admin:password123@mongodb:27017/temple_crowd_management?authSource=admin
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://admin:password123@rabbitmq:5672
      JWT_SECRET: dev_secret_key
    depends_on:
      - mongodb
      - redis
      - rabbitmq
    volumes:
      - ../backend:/app
    command: npm run dev

  ml-detection:
    build: ../ml-services/crowd-detection
    ports:
      - "8001:8001"
    environment:
      RABBITMQ_URL: amqp://admin:password123@rabbitmq:5672
    depends_on:
      - rabbitmq
    volumes:
      - ../ml-services/crowd-detection:/app
    command: uvicorn src.api:app --host 0.0.0.0 --port 8001 --reload

  ml-forecasting:
    build: ../ml-services/crowd-forecasting
    ports:
      - "8002:8002"
    environment:
      MONGODB_URI: mongodb://admin:password123@mongodb:27017/temple_crowd_management?authSource=admin
    depends_on:
      - mongodb
    volumes:
      - ../ml-services/crowd-forecasting:/app
    command: uvicorn src.api:app --host 0.0.0.0 --port 8002 --reload

  frontend:
    build: ../frontend
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:5000/api/v1
      REACT_APP_WS_URL: ws://localhost:5000
    volumes:
      - ../frontend:/app
      - /app/node_modules
    command: npm start

volumes:
  mongo_data:
```

**Usage**:
```bash
cd infra
docker-compose up -d
docker-compose logs -f backend  # View logs
docker-compose down  # Stop all services
```

### 11.2 Production Deployment (Kubernetes)

#### Architecture
```
Cloud Load Balancer (HTTPS)
        │
        ▼
Ingress Controller (NGINX)
        │
        ├── /api/** → Backend Service (Node.js Pods)
        ├── /ml/** → ML Service (Python Pods)
        └── /** → Frontend Service (React static files on NGINX)
```

#### Kubernetes Manifests

**Backend Deployment** (`infra/kubernetes/backend-deployment.yaml`):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: yourregistry/temple-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: mongodb-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: ClusterIP
```

**ML Detection Deployment** (`infra/kubernetes/ml-detection-deployment.yaml`):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-detection-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ml-detection
  template:
    metadata:
      labels:
        app: ml-detection
    spec:
      containers:
      - name: ml-detection
        image: yourregistry/temple-ml-detection:latest
        ports:
        - containerPort: 8001
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
            nvidia.com/gpu: 1  # Request GPU
          limits:
            memory: "4Gi"
            cpu: "2000m"
            nvidia.com/gpu: 1
---
apiVersion: v1
kind: Service
metadata:
  name: ml-detection-service
spec:
  selector:
    app: ml-detection
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8001
```

**Horizontal Pod Autoscaler** (`infra/kubernetes/backend-hpa.yaml`):
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-deployment
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### Deploy to Kubernetes
```bash
# Build Docker images
docker build -t yourregistry/temple-backend:latest ./backend
docker build -t yourregistry/temple-ml-detection:latest ./ml-services/crowd-detection

# Push to registry
docker push yourregistry/temple-backend:latest
docker push yourregistry/temple-ml-detection:latest

# Apply Kubernetes manifests
kubectl apply -f infra/kubernetes/

# Check status
kubectl get deployments
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/backend-deployment
```

### 11.3 CI/CD Pipeline (GitHub Actions)

**File**: `.github/workflows/deploy.yml`
```yaml
name: Build and Deploy

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install backend dependencies
        run: cd backend && npm ci
      
      - name: Run backend tests
        run: cd backend && npm test
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      
      - name: Install ML service dependencies
        run: cd ml-services/crowd-detection && pip install -r requirements.txt
      
      - name: Run ML tests
        run: cd ml-services/crowd-detection && pytest

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push backend
        run: |
          docker build -t yourregistry/temple-backend:${{ github.sha }} ./backend
          docker tag yourregistry/temple-backend:${{ github.sha }} yourregistry/temple-backend:latest
          docker push yourregistry/temple-backend:${{ github.sha }}
          docker push yourregistry/temple-backend:latest
      
      - name: Build and push ML detection
        run: |
          docker build -t yourregistry/temple-ml-detection:${{ github.sha }} ./ml-services/crowd-detection
          docker tag yourregistry/temple-ml-detection:${{ github.sha }} yourregistry/temple-ml-detection:latest
          docker push yourregistry/temple-ml-detection:${{ github.sha }}
          docker push yourregistry/temple-ml-detection:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Set Kubernetes context
        run: |
          echo "${{ secrets.KUBECONFIG }}" > kubeconfig.yaml
          export KUBECONFIG=kubeconfig.yaml
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/backend-deployment backend=yourregistry/temple-backend:${{ github.sha }}
          kubectl set image deployment/ml-detection-deployment ml-detection=yourregistry/temple-ml-detection:${{ github.sha }}
          kubectl rollout status deployment/backend-deployment
          kubectl rollout status deployment/ml-detection-deployment
```

---

## 12. Monitoring & Maintenance

### 12.1 Monitoring Stack

#### Prometheus (Metrics)
- **Metrics Collected**:
  - API request rates, latencies (p50, p95, p99)
  - Error rates (4xx, 5xx)
  - Database query times
  - ML inference times
  - System resources (CPU, memory, disk)

**Node.js Exporter** (backend):
```javascript
const promClient = require('prom-client');

// Default metrics (CPU, memory)
promClient.collectDefaultMetrics();

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

// Middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path, status_code: res.statusCode });
  });
  next();
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

#### Grafana (Visualization)
- **Dashboards**:
  1. **API Performance**: Request rates, latencies, errors
  2. **ML Services**: Inference times, model accuracy, GPU utilization
  3. **Database**: Query performance, connection pools
  4. **Business Metrics**: Live crowd counts, bookings per hour

**Example Queries**:
```promql
# Average API response time
avg(http_request_duration_seconds)

# 95th percentile latency
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])

# Crowd count trend
avg(crowd_count{temple="somnath"}) by (zone)
```

#### ELK Stack (Logging)
- **Elasticsearch**: Store logs
- **Logstash**: Aggregate logs from all services
- **Kibana**: Search and visualize logs

**Structured Logging** (Winston):
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage
logger.info('Booking created', { userId: '123', templeId: 'somnath', slotTime: '2026-01-25T10:00:00Z' });
logger.error('Database connection failed', { error: err.message, stack: err.stack });
```

### 12.2 Alerting Rules

**Prometheus Alertmanager**:
```yaml
# alerts.yml
groups:
  - name: api_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on API"
          description: "{{ $value }}% of requests are failing"

      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API latency is high"
          description: "95th percentile latency is {{ $value }}s"

  - name: crowd_alerts
    rules:
      - alert: CrowdThresholdExceeded
        expr: crowd_count > crowd_capacity * 0.9
        for: 2m
        labels:
          severity: high
        annotations:
          summary: "Crowd capacity almost reached"
          description: "{{ $labels.temple }} {{ $labels.zone }} is at {{ $value }} persons"
```

**Notification Channels**:
- **Email**: Send to admins, temple staff
- **SMS**: Twilio integration for critical alerts
- **Slack/Discord**: Team notifications
- **PagerDuty**: On-call engineer escalation

### 12.3 Maintenance Tasks

#### Daily
- [ ] Check dashboard for anomalies
- [ ] Review error logs (Kibana)
- [ ] Monitor alert channels

#### Weekly
- [ ] Database backups (verify integrity)
- [ ] Review performance metrics (Grafana)
- [ ] Update dependencies (security patches)
- [ ] Model retraining (if new data available)

#### Monthly
- [ ] Capacity planning (scale resources if needed)
- [ ] Security audits (npm audit, safety check)
- [ ] User feedback review (mobile app ratings)
- [ ] Generate monthly reports (footfall trends)

#### Quarterly
- [ ] Major version updates (Node.js, Python, libraries)
- [ ] Penetration testing (external audit)
- [ ] Model A/B testing (compare LSTM vs Prophet)
- [ ] Infrastructure cost optimization

---

## 13. Budget & Resource Allocation

### 13.1 Development Team (6-12 months)

| Role | Count | Salary (₹/month) | Total (₹/year) |
|------|-------|------------------|----------------|
| Project Manager | 1 | 1,00,000 | 12,00,000 |
| Full-Stack Developer (Senior) | 2 | 80,000 | 19,20,000 |
| Frontend Developer (React/React Native) | 2 | 60,000 | 14,40,000 |
| Backend Developer (Node.js) | 2 | 60,000 | 14,40,000 |
| ML Engineer (Python/PyTorch) | 2 | 80,000 | 19,20,000 |
| Computer Vision Engineer | 1 | 80,000 | 9,60,000 |
| QA Engineer | 1 | 50,000 | 6,00,000 |
| DevOps Engineer | 1 | 70,000 | 8,40,000 |
| UI/UX Designer | 1 | 50,000 | 6,00,000 |
| **Total** | **13** | - | **₹1,09,20,000** |

### 13.2 Infrastructure Costs (Annual)

#### Cloud Services (AWS)

| Service | Specs | Cost ($/month) | Cost (₹/year) |
|---------|-------|----------------|---------------|
| EC2 (Backend) | 3x t3.large | $150 | ₹1,50,000 |
| EC2 (ML) | 2x g4dn.xlarge (GPU) | $600 | ₹6,00,000 |
| MongoDB Atlas | M30 cluster | $300 | ₹3,00,000 |
| Redis (ElastiCache) | cache.m5.large | $100 | ₹1,00,000 |
| S3 (Storage) | 500 GB | $15 | ₹15,000 |
| CloudFront (CDN) | 1 TB transfer | $85 | ₹85,000 |
| RabbitMQ (CloudAMQP) | Lemur plan | $99 | ₹1,00,000 |
| Load Balancer (ALB) | 1x | $30 | ₹30,000 |
| Firebase (Realtime DB) | Blaze plan | $50 | ₹50,000 |
| Domain + SSL | .in domain | $20 | ₹20,000 |
| **Total Infrastructure** | - | **$1,449/mo** | **₹17,50,000/year** |

#### Alternative (Self-Hosted)

| Item | Specs | Cost (₹, one-time) |
|------|-------|-------------------|
| Servers | 3x Dell PowerEdge R740 | ₹15,00,000 |
| GPU Workstation | 2x NVIDIA RTX 3090 | ₹3,50,000 |
| Storage | 10 TB SSD RAID | ₹2,00,000 |
| Networking | Switches, routers | ₹1,00,000 |
| UPS | 10 KVA | ₹2,00,000 |
| **Total (One-time)** | - | **₹23,50,000** |
| Electricity (Annual) | 10 KW @ ₹6/unit | ₹5,25,600 |
| Maintenance (Annual) | - | ₹2,00,000 |

### 13.3 Software Licenses & APIs

| Service | Plan | Cost (₹/year) |
|---------|------|---------------|
| GitHub Enterprise | 10 users | ₹50,000 |
| Twilio (SMS) | 10,000 SMS/month | ₹1,20,000 |
| Google Maps API | 100K requests/day | ₹2,00,000 |
| OpenWeatherMap API | Professional plan | ₹30,000 |
| Sentry (Error Monitoring) | Team plan | ₹40,000 |
| **Total Licenses** | - | **₹4,40,000** |

### 13.4 Miscellaneous

| Item | Cost (₹) |
|------|----------|
| Legal (Privacy Policy, TOS) | ₹50,000 |
| Security Audit (External) | ₹2,00,000 |
| Training Materials | ₹30,000 |
| Contingency (10%) | ₹14,00,000 |
| **Total Misc** | **₹16,80,000** |

### 13.5 Grand Total (Year 1)

| Category | Cost (₹) |
|----------|----------|
| Development Team | 1,09,20,000 |
| Infrastructure (Cloud) | 17,50,000 |
| Software Licenses & APIs | 4,40,000 |
| Miscellaneous | 16,80,000 |
| **TOTAL** | **₹1,47,90,000** |

**Approximately ₹1.5 Crores (~$180K USD) for Year 1**

### 13.6 Funding Sources

1. **Government Grants**:
   - PRASAD Scheme (Ministry of Tourism)
   - Smart City Mission grants
   - Startup India Seed Fund

2. **Temple Trusts**:
   - Somnath Trust, Dwarkadhish Temple Board
   - Joint funding model (4 temples × ₹40 lakhs each)

3. **Private Investment**:
   - Angel investors (temple tourism tech startups)
   - CSR funds from corporations

4. **Revenue Models** (Post-MVP):
   - Subscription from temples (₹1 lakh/month per temple)
   - Premium features for devotees (priority booking: ₹50/slot)
   - Data analytics for government agencies

---

## 14. Risk Management

### 14.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Model inaccuracy (false alerts) | Medium | High | Continuous retraining, ensemble models, human oversight |
| Camera failures | Medium | Medium | Redundant cameras, auto-failover, manual counters as backup |
| Server downtime | Low | Critical | Multi-region deployment, load balancing, 99.9% SLA with cloud provider |
| Data breach | Low | Critical | Encryption, security audits, penetration testing, RBAC |
| Scalability issues (peak festivals) | Medium | High | Auto-scaling (K8s HPA), load testing, CDN for static assets |

### 14.2 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Staff resistance to new tech | Medium | Medium | Training programs, phased rollout, involve staff in design |
| Insufficient training data | Medium | High | Partner with research institutions, crowdsource annotations, synthetic data |
| Vendor lock-in (cloud) | Low | Medium | Multi-cloud strategy, containerization (Docker), avoid proprietary services |
| Internet connectivity issues | High | High | Edge computing (local processing), offline mode for mobile app, satellite backup |

### 14.3 Social & Cultural Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Privacy concerns (surveillance) | Medium | High | Transparent signage, anonymized data, opt-in for mobile tracking, no facial recognition |
| Religious objections | Low | High | Consult with temple priests, install cameras outside sanctum, respectful communication |
| Digital divide (elderly devotees) | High | Medium | Maintain traditional queues, volunteer assistance, voice-based UI in local languages |
| Misinformation (social media) | Medium | Medium | Public awareness campaigns, official social media channels, FAQ section |

### 14.4 Financial Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Budget overrun | Medium | High | Detailed project plan, phased development, contingency fund (10%) |
| Delayed funding | Medium | Medium | Milestone-based disbursement, diversify funding sources |
| Low adoption (mobile app) | Medium | Medium | User-centric design, incentives (fast-track darshan), marketing campaigns |

---

## 15. Success Metrics & KPIs

### 15.1 Technical KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| System Uptime | 99.5% | Prometheus uptime checks |
| API Response Time (p95) | <500ms | Grafana dashboard |
| ML Inference Speed | <100ms per image | MLflow metrics |
| Crowd Forecast Accuracy (MAE) | <50 persons | Weekly model evaluation |
| Anomaly Detection Precision | >90% | Manual verification of alerts |

### 15.2 Business KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Mobile App Downloads | 100K in 6 months | Google Play/App Store analytics |
| Daily Active Users (Mobile) | 10K after 1 year | Firebase Analytics |
| Booking Conversion Rate | >60% (view → book) | Backend analytics |
| Queue Wait Time Reduction | 70% (vs baseline) | Time-series comparison |
| Incident Reduction | 90% (vs previous year) | Temple records |

### 15.3 User Satisfaction KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Mobile App Rating | >4.0 stars | Play Store/App Store |
| Net Promoter Score (NPS) | >50 | In-app surveys |
| Admin Dashboard Satisfaction | >80% positive | Quarterly surveys |
| Support Ticket Volume | <50/month | Helpdesk system |

### 15.4 Social Impact KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Temples Onboarded | 20+ by end of Year 2 | Partnership agreements |
| Devotees Served | 10M+ annually | Aggregate booking + live count data |
| Stampede Incidents | 0 | News monitoring, temple reports |
| Positive Media Coverage | 10+ articles/year | Media tracking |

---

## 16. Timeline & Milestones

### Gantt Chart Overview

```
Month   1   2   3   4   5   6   7   8   9   10  11  12
Phase 1 [███████████████]
Phase 2             [███████████████]
Phase 3                         [███████████████]
Phase 4                                     [███████████████]
```

### Detailed Timeline

#### Phase 1: Foundation (Months 1-3)

**Month 1: Setup & Backend Core**
- Week 1: Project setup, Git repo, Docker Compose
- Week 2: Auth service (JWT, login/register)
- Week 3: Temple management APIs
- Week 4: Crowd monitoring APIs (MongoDB, Firebase)

**Milestone 1A (End of Month 1)**: Backend APIs functional, documented (Swagger)

**Month 2: ML Detection Service**
- Week 1: YOLOv8 fine-tuning on custom dataset
- Week 2: FastAPI service for person detection
- Week 3: RTSP stream ingestion, RabbitMQ integration
- Week 4: Dockerize ML service

**Milestone 1B (End of Month 2)**: ML service processes test CCTV streams, publishes counts

**Month 3: Web Dashboard MVP**
- Week 1-2: React app scaffold, login UI, live monitoring page
- Week 3: WebSocket integration, real-time updates
- Week 4: Basic charts (crowd counts over time)

**Milestone 1 (End of Month 3)**: Demo to stakeholders - Admin views live crowd from 2 cameras

---

#### Phase 2: Booking & Forecasting (Months 4-6)

**Month 4: Booking System**
- Week 1: Slot generation algorithm
- Week 2: Booking APIs (create, cancel, verify)
- Week 3: Mobile app scaffold (React Native)
- Week 4: Booking flow UI (date picker, slot selection, QR code)

**Milestone 2A (End of Month 4)**: Devotees can book slots via mobile app (TestFlight/APK)

**Month 5: LSTM Forecasting**
- Week 1: Data collection, preprocessing
- Week 2: LSTM model training (PyTorch)
- Week 3: FastAPI endpoint, integrate with backend
- Week 4: Forecasting dashboard UI

**Milestone 2B (End of Month 5)**: Dashboard shows 7-day crowd predictions

**Month 6: Anomaly Detection & Alerts**
- Week 1-2: Isolation Forest training, API
- Week 3: Alert system (Twilio SMS, FCM push)
- Week 4: Alert dashboard (view, acknowledge)

**Milestone 2 (End of Month 6)**: Full MVP - Booking, forecasting, alerts working

**Major Demo**: Invite temple authorities, government officials, press

---

#### Phase 3: Advanced Features (Months 7-9)

**Month 7: Heatmaps & Analytics**
- Week 1-2: Crowd density heatmap (Leaflet.js)
- Week 3-4: Analytics dashboard (reports, exports)

**Month 8: Multi-Camera Tracking**
- Week 1-2: ByteTrack integration
- Week 3-4: Prophet forecasting, ensemble models

**Month 9: Mobile App Polish**
- Week 1-2: In-app maps, navigation
- Week 3-4: Multilingual support, accessibility

**Milestone 3 (End of Month 9)**: Feature-complete platform, ready for pilot deployment

---

#### Phase 4: IoT & Scale (Months 10-12)

**Month 10: IoT Integration**
- Week 1-2: RFID wristbands, MQTT protocol
- Week 3-4: Environmental sensors (temperature, air quality)

**Month 11: Edge Deployment**
- Week 1-2: NVIDIA Jetson setup, model optimization
- Week 3-4: Smart turnstiles integration

**Month 12: Multi-Tenancy & Scale**
- Week 1-2: Refactor for multi-temple support
- Week 3: Load testing, optimization
- Week 4: Kubernetes deployment, documentation

**Milestone 4 (End of Month 12)**: Platform scaled to 20+ temples, production-ready

**Final Launch Event**: Public announcement, media coverage, government endorsement

---

## 17. Next Steps (Post-Plan)

### Immediate Actions (Week 1-2)

1. **Stakeholder Meetings**:
   - Present this plan to temple authorities
   - Get approvals and MoUs signed
   - Secure initial funding (at least 30% upfront)

2. **Team Hiring**:
   - Post job listings (LinkedIn, AngelList, Naukri)
   - Interview candidates (technical + cultural fit)
   - Onboard team (set up dev environments)

3. **Infrastructure Setup**:
   - Create AWS/Azure accounts
   - Setup MongoDB Atlas, Firebase projects
   - Configure CI/CD (GitHub Actions)

4. **Legal & Compliance**:
   - Draft Privacy Policy, Terms of Service
   - Consult lawyer on data protection regulations
   - Apply for government grants (PRASAD scheme)

5. **Data Collection**:
   - Install test CCTV cameras at 1-2 temple sites
   - Start recording footage (with permissions)
   - Begin manual annotation for YOLOv8 training

### Long-Term Vision (2027+)

1. **National Expansion**:
   - Scale to 100+ temples across India
   - Partner with Tirumala Tirupati Devasthanams (TTD), Vaishno Devi Shrine Board

2. **International Replication**:
   - Adapt platform for Hajj (Saudi Arabia), Kumbh Mela
   - Collaborate with UNESCO for heritage site management

3. **Advanced AI**:
   - Crowd behavior prediction (detect potential stampedes 10 minutes in advance)
   - Sentiment analysis from social media
   - VR/AR virtual darshan for remote devotees

4. **Sustainability**:
   - Carbon footprint tracking (pilgrim travel, temple energy use)
   - Promote eco-friendly transportation (shared shuttles, electric vehicles)

5. **Open Source**:
   - Release core platform as open source (after stabilization)
   - Build developer community for contributions
   - Create API marketplace for third-party apps

---

## 18. Conclusion

This comprehensive project plan outlines a **12-month roadmap** to build an **AI-powered, scalable, and culturally sensitive crowd management system** for Indian temple sites. By combining **real-time computer vision (YOLOv8)**, **predictive ML (LSTM, Prophet)**, and **modern full-stack technologies (MERN + Python)**, we aim to:

- **Ensure safety** for millions of devotees
- **Enhance experience** through smart booking and navigation
- **Empower temple authorities** with data-driven decision-making
- **Preserve sanctity** while introducing cutting-edge technology

### Key Success Factors

1. **Stakeholder Buy-In**: Active collaboration with temple boards, police, government
2. **User-Centric Design**: Simple, respectful, accessible to all devotees
3. **Data Quality**: Accurate, diverse training datasets for ML models
4. **Phased Rollout**: Start small (4 temples), learn, scale carefully
5. **Continuous Improvement**: Weekly model retraining, user feedback loops

### Call to Action

**For Temple Authorities**: Partner with us to make your temples safer and more welcoming.

**For Developers**: Join our mission to blend technology with tradition.

**For Investors**: Support a high-impact project serving 50M+ pilgrims annually.

**For Devotees**: Experience hassle-free darshan with our mobile app.

---

**Let's build the future of pilgrimage management, together.**

🕉️ **Har Har Mahadev** 🕉️

---

*For questions, feedback, or collaboration inquiries:*  
**Email**: project@templecrowdmanagement.com  
**Website**: [www.templecrowdmanagement.com](https://www.templecrowdmanagement.com)  
**GitHub**: [github.com/temple-crowd-management](https://github.com/temple-crowd-management)

---

**Document Version**: 1.0  
**Last Updated**: January 20, 2026  
**Author**: Project Planning Team
