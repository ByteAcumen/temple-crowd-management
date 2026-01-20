# 🕉️ Temple & Pilgrimage Crowd Management System

> AI-Powered Real-Time Crowd Monitoring and Management Platform for Indian Temple Sites (Somnath, Dwarka, Ambaji, Pavagadh)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [ML Models](#ml-models)
- [Datasets & Training](#datasets--training)
- [Deployment](#deployment)
- [Legal & Ethical Considerations](#legal--ethical-considerations)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## 🌟 Overview

The **Temple & Pilgrimage Crowd Management System** is an intelligent, scalable platform designed to monitor, predict, and manage crowd flows at major pilgrimage sites in India. Built with modern MERN stack and cutting-edge AI/ML technologies, this system addresses the critical challenge of managing millions of devotees safely and efficiently.

### Problem Statement

Indian temples and pilgrimage sites face unprecedented crowd management challenges:
- **50+ million** annual visitors to major temples
- Stampede risks during festivals and peak seasons
- Limited real-time visibility into crowd density
- Inadequate predictive capabilities for crowd surges
- Manual queue management inefficiencies

### Solution

Our system leverages:
- **Real-time AI-powered video analytics** for crowd counting and density mapping
- **Predictive ML models** (LSTM, Prophet) for crowd forecasting
- **Smart queue management** with virtual booking and token systems
- **Multi-channel alerting** for authorities and pilgrims
- **Mobile apps** for devotees with live updates and slot booking

---

## ✨ Key Features

### 🎥 Real-Time Monitoring
- **AI-Powered CCTV Analysis**: YOLOv8-based person detection and counting
- **Crowd Density Heatmaps**: Visual representation of congestion zones
- **Live Dashboard**: Real-time metrics for temple authorities
- **Multi-Camera Integration**: Support for 100+ CCTV feeds per site

### 📊 Predictive Analytics
- **Crowd Forecasting**: LSTM/GRU models predicting footfall 7 days ahead
- **Anomaly Detection**: Isolation Forest algorithms for unusual crowd behavior
- **Festival Planning**: Historical data analysis with seasonal patterns
- **Weather Integration**: OpenWeather API for weather-based predictions

### 📱 Mobile Applications
- **Devotee App**: Token booking, live wait times, navigation
- **Admin App**: Real-time alerts, crowd control, emergency response
- **Virtual Queue System**: Reduce on-site crowds by 60-70%
- **Multi-language Support**: Hindi, Gujarati, English

### 🚨 Smart Alerting
- **Threshold-Based Alerts**: SMS/WhatsApp notifications for crowd limits
- **Emergency Broadcasting**: Instant alerts to authorities and volunteers
- **Predictive Warnings**: Early alerts before crowd surges
- **Integration**: Twilio, Firebase Cloud Messaging, Telegram

### 🗺️ Spatial Intelligence
- **Interactive Maps**: OpenStreetMap integration with POI markers
- **Route Optimization**: Guided pathways to reduce congestion
- **Parking Management**: Real-time parking availability
- **Accessibility Features**: Facilities for elderly and disabled pilgrims

### 📈 Analytics & Reporting
- **Historical Trends**: Yearly/monthly/daily footfall patterns
- **Performance Metrics**: Queue wait times, peak hours analysis
- **Compliance Reports**: Safety standards and capacity utilization
- **Export Options**: PDF, Excel, CSV reports

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACES                             │
├──────────────────────┬──────────────────────┬──────────────────────┤
│   Web Dashboard      │   Mobile App         │   Admin Portal       │
│   (React.js)         │   (React Native)     │   (React.js)         │
└──────────┬───────────┴──────────┬───────────┴──────────┬───────────┘
           │                      │                      │
           └──────────────────────┼──────────────────────┘
                                  │
                         ┌────────▼────────┐
                         │   API GATEWAY   │
                         │  (Node.js +     │
                         │   Express)      │
                         └────────┬────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
        ┌────────▼────────┐ ┌────▼─────┐ ┌───────▼────────┐
        │   REST APIs      │ │WebSocket │ │  Auth Service  │
        │   (CRUD)         │ │(Real-time│ │  (JWT + OAuth) │
        └────────┬─────────┘ └────┬─────┘ └───────┬────────┘
                 │                │                │
                 └────────────────┼────────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              │                                        │
     ┌────────▼────────┐                    ┌────────▼────────┐
     │   DATABASES      │                    │  ML SERVICES     │
     ├──────────────────┤                    ├─────────────────┤
     │ MongoDB          │                    │ Python FastAPI  │
     │ (Historical)     │◄───────────────────┤ Services        │
     ├──────────────────┤                    ├─────────────────┤
     │ Redis            │                    │ • YOLOv8        │
     │ (Caching)        │                    │ • LSTM/Prophet  │
     ├──────────────────┤                    │ • Isolation     │
     │ Firebase         │                    │   Forest        │
     │ (Real-time sync) │                    │ • OpenCV        │
     └────────┬─────────┘                    └────────┬────────┘
              │                                        │
              │         ┌──────────────────────────────┘
              │         │
     ┌────────▼─────────▼──────┐
     │   MESSAGE QUEUE          │
     │   (RabbitMQ / Kafka)     │
     └────────┬─────────────────┘
              │
     ┌────────▼─────────────────┐
     │   DATA INGESTION          │
     ├───────────────────���──────┤
     │ • CCTV Streams (RTSP)    │
     │ • IoT Sensors (MQTT)     │
     │ • Turnstile Counters     │
     │ • Weather API            │
     │ • Social Media Feeds     │
     └──────────────────────────┘
```

### Data Flow

1. **Video Input**: CCTV cameras stream via RTSP to ML services
2. **AI Processing**: YOLOv8 counts people, generates density maps
3. **Data Storage**: Real-time counts → Firebase; Historical → MongoDB
4. **Prediction**: LSTM models consume historical data, output forecasts
5. **Alert Generation**: Threshold violations trigger multi-channel alerts
6. **User Display**: WebSocket pushes live updates to dashboards/apps

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React.js 18+ (Web), React Native 0.72+ (Mobile)
- **UI Library**: Material-UI (MUI) v5, Tailwind CSS
- **State Management**: Redux Toolkit, React Query
- **Maps**: Leaflet.js with OpenStreetMap tiles
- **Charts**: Recharts, Chart.js
- **Real-time**: Socket.io-client, Firebase SDK

### Backend
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js 4.18+
- **Authentication**: JWT, Passport.js, OAuth 2.0
- **Validation**: Joi, express-validator
- **File Upload**: Multer, AWS S3
- **Scheduling**: node-cron, Bull (job queues)

### ML/AI Services
- **Language**: Python 3.9+
- **Framework**: FastAPI, Flask
- **Computer Vision**: 
  - YOLOv8 (Ultralytics)
  - OpenCV 4.8+
  - TensorFlow 2.13+ / PyTorch 2.0+
- **Time-Series**: 
  - LSTM/GRU (PyTorch/TensorFlow)
  - Prophet (Facebook)
  - statsmodels (ARIMA, SARIMA)
- **Anomaly Detection**: 
  - Isolation Forest (scikit-learn)
  - Autoencoders (TensorFlow)
- **ML Ops**: MLflow, DVC (Data Version Control)

### Databases
- **Primary**: MongoDB 6.0+ (Atlas or self-hosted)
- **Real-time**: Firebase Realtime Database / Firestore
- **Cache**: Redis 7.0+
- **Time-Series** (optional): InfluxDB, TimescaleDB

### Message Queue
- **Options**: RabbitMQ, Apache Kafka, AWS SQS
- **Protocol**: AMQP, MQTT (for IoT sensors)

### DevOps & Deployment
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes (K8s), Docker Swarm
- **CI/CD**: GitHub Actions, Jenkins
- **Cloud**: AWS (EC2, S3, Lambda), Azure, Google Cloud
- **Monitoring**: Grafana, Prometheus, ELK Stack
- **Logging**: Winston (Node.js), Python logging

### External APIs & Services
- **Maps**: Google Maps API, OpenStreetMap (Overpass API)
- **Weather**: OpenWeatherMap API, Weatherstack
- **SMS/Notifications**: Twilio, AWS SNS, Firebase Cloud Messaging
- **Payments** (optional): Razorpay, Stripe (for donations/bookings)

---

## 📁 Project Structure

```
temple-crowd-management/
│
├── backend/                      # Node.js + Express Backend
│   ├── src/
│   │   ├── config/              # Configuration files (DB, Redis, JWT)
│   │   ├── controllers/         # Route controllers
│   │   ├── models/              # Mongoose schemas
│   │   ├── routes/              # API routes
│   │   ├── middleware/          # Auth, validation, error handlers
│   │   ├── services/            # Business logic
│   │   ├── utils/               # Helper functions
│   │   └── app.js               # Express app setup
│   ├── tests/                   # Unit & integration tests
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/                     # React.js Web Dashboard
│   ├── public/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API calls
│   │   ├── store/               # Redux store & slices
│   │   ├── utils/               # Helper functions
│   │   ├── styles/              # Global styles
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── mobile/                       # React Native Mobile App
│   ├── android/                 # Android native code
│   ├── ios/                     # iOS native code
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   ├── package.json
│   └── app.json
│
├── ml-services/                  # Python ML/AI Microservices
│   ├── crowd-detection/         # YOLOv8 person detection service
│   │   ├── models/              # Trained model files
│   │   ├── src/
│   │   │   ├── detector.py      # YOLOv8 inference
│   │   │   ├── stream_handler.py# RTSP stream processing
│   │   │   └── api.py           # FastAPI endpoints
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── crowd-forecasting/       # LSTM/Prophet forecasting service
│   │   ├── models/              # Trained LSTM/Prophet models
│   │   ├── src/
│   │   │   ├── trainer.py       # Model training scripts
│   │   │   ├── predictor.py     # Inference
│   │   │   └── api.py           # FastAPI endpoints
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── anomaly-detection/       # Isolation Forest service
│   │   ├── models/
│   │   ├── src/
│   │   │   ├── detector.py
│   │   │   └── api.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   └── common/                  # Shared utilities
│       ├── preprocessing.py
│       ├── visualizations.py
│       └── config.py
│
├── docs/                         # Documentation
│   ├── API.md                   # API documentation
│   ├── ARCHITECTURE.md          # System architecture details
│   ├── DEPLOYMENT.md            # Deployment guide
│   ├── ML_MODELS.md             # ML model documentation
│   ├── DATASETS.md              # Dataset sources & preparation
│   ├── LEGAL_ETHICS.md          # Legal & ethical guidelines
│   └── USER_GUIDE.md            # End-user documentation
│
├── datasets/                     # Training datasets (gitignored)
│   ├── raw/                     # Raw collected data
│   ├── processed/               # Preprocessed data
│   └── annotations/             # Image annotations for YOLO
│
├── scripts/                      # Utility scripts
│   ├── data_collection.py       # Data scraping/collection
│   ├── model_training.py        # Batch training scripts
│   ├── db_migration.js          # Database migrations
│   └── deploy.sh                # Deployment automation
│
├── infra/                        # Infrastructure as Code
│   ├── docker-compose.yml       # Local development setup
│   ├── docker-compose.prod.yml  # Production setup
│   ├── kubernetes/              # K8s manifests
│   │   ├── backend-deployment.yaml
│   │   ├── ml-deployment.yaml
│   │   └── services.yaml
│   └── terraform/               # Cloud provisioning
│
├── .gitignore
├── .env.example                  # Environment variables template
├── LICENSE
├── README.md                     # This file
├── PROJECT_PLAN.md              # Detailed project plan
└── package.json                  # Root-level scripts

```

---

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js**: v18+ LTS ([Download](https://nodejs.org/))
- **Python**: 3.9+ ([Download](https://www.python.org/))
- **MongoDB**: 6.0+ ([Download](https://www.mongodb.com/try/download/community) or use Atlas)
- **Redis**: 7.0+ ([Download](https://redis.io/download) or use Docker)
- **Git**: Latest version ([Download](https://git-scm.com/))

### Optional (for production)
- **Docker**: 20.10+ ([Download](https://www.docker.com/))
- **Kubernetes**: minikube or cloud K8s cluster
- **NVIDIA GPU**: For ML model training (CUDA 11.8+)

### API Keys (Free Tier Available)
- **OpenWeatherMap API**: [Sign up](https://openweathermap.org/api)
- **Google Maps API** (optional): [Get key](https://developers.google.com/maps)
- **Twilio**: [Sign up](https://www.twilio.com/try-twilio) (for SMS alerts)
- **Firebase**: [Create project](https://console.firebase.google.com/)

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/temple-crowd-management.git
cd temple-crowd-management
```

### 2. Setup Backend

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configurations (MongoDB URI, Redis, JWT secret, etc.)

# Run migrations (if any)
npm run migrate

# Start development server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Setup Frontend

```bash
cd ../frontend
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with backend API URL

# Start development server
npm start
```

Frontend will run on `http://localhost:3000`

### 4. Setup ML Services

```bash
cd ../ml-services

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies for each service
cd crowd-detection
pip install -r requirements.txt

cd ../crowd-forecasting
pip install -r requirements.txt

cd ../anomaly-detection
pip install -r requirements.txt

# Download pre-trained models (or train your own - see ML_MODELS.md)
cd ../crowd-detection
python download_models.py

# Start FastAPI services
cd crowd-detection
uvicorn src.api:app --reload --port 8001

# In separate terminals, start other services:
cd crowd-forecasting
uvicorn src.api:app --reload --port 8002

cd anomaly-detection
uvicorn src.api:app --reload --port 8003
```

### 5. Setup Mobile App (Optional)

```bash
cd ../mobile
npm install

# For iOS (macOS only)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### 6. Docker Setup (Alternative)

For a complete setup using Docker:

```bash
# From project root
docker-compose up -d

# This will start:
# - MongoDB (port 27017)
# - Redis (port 6379)
# - Backend API (port 5000)
# - ML Services (ports 8001-8003)
# - Frontend (port 3000)
```

---

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/temple_crowd_management
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-email

# External APIs
OPENWEATHER_API_KEY=your_openweather_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# ML Services
ML_DETECTION_URL=http://localhost:8001
ML_FORECASTING_URL=http://localhost:8002
ML_ANOMALY_URL=http://localhost:8003

# CORS
FRONTEND_URL=http://localhost:3000
```

#### ML Services (.env)
```env
# Model Paths
YOLO_MODEL_PATH=./models/yolov8n.pt
LSTM_MODEL_PATH=./models/lstm_crowd_forecast.h5
ISOLATION_FOREST_PATH=./models/isolation_forest.pkl

# Database
MONGODB_URI=mongodb://localhost:27017/temple_crowd_management

# Performance
BATCH_SIZE=16
DEVICE=cuda  # or 'cpu' if no GPU
CONFIDENCE_THRESHOLD=0.5
```

---

## 🚀 Usage

### For Temple Administrators

1. **Access Dashboard**: Navigate to `http://localhost:3000/admin`
2. **Login**: Use admin credentials (default: admin@temple.in / admin123)
3. **View Live Feeds**: Monitor real-time crowd density across all temple zones
4. **Check Predictions**: Review 7-day crowd forecasts
5. **Manage Alerts**: Configure threshold alerts and view active warnings
6. **Generate Reports**: Export daily/weekly/monthly footfall reports

### For Devotees (Mobile App)

1. **Download App**: Install from Play Store / App Store (in production)
2. **Select Temple**: Choose from Somnath, Dwarka, Ambaji, Pavagadh
3. **View Wait Times**: Check current queue lengths and estimated wait
4. **Book Token**: Reserve a time slot for darshan
5. **Navigate**: Use in-app maps to find parking, facilities, entry gates
6. **Receive Alerts**: Get notifications when your slot approaches

### For Developers

#### Start All Services
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm start

# Terminal 3: ML Detection
cd ml-services/crowd-detection && uvicorn src.api:app --reload --port 8001

# Terminal 4: ML Forecasting
cd ml-services/crowd-forecasting && uvicorn src.api:app --reload --port 8002
```

#### Run Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# ML service tests
cd ml-services/crowd-detection && pytest
```

---

## 📖 API Documentation

### Base URLs
- **Backend API**: `http://localhost:5000/api/v1`
- **ML Detection**: `http://localhost:8001`
- **ML Forecasting**: `http://localhost:8002`

### Key Endpoints

#### Authentication
```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
```

#### Crowd Monitoring
```http
GET  /api/v1/crowds/live                    # Real-time crowd data
GET  /api/v1/crowds/history?from=&to=       # Historical data
GET  /api/v1/crowds/heatmap/:templeId       # Density heatmap
GET  /api/v1/crowds/forecast/:templeId      # 7-day forecast
POST /api/v1/crowds/alert                   # Create alert rule
```

#### Temple Management
```http
GET  /api/v1/temples                        # List all temples
GET  /api/v1/temples/:id                    # Temple details
POST /api/v1/temples                        # Add temple (admin)
PUT  /api/v1/temples/:id                    # Update temple
GET  /api/v1/temples/:id/zones              # Temple zones
```

#### Booking System
```http
POST /api/v1/bookings                       # Create booking
GET  /api/v1/bookings/:id                   # Booking details
GET  /api/v1/bookings/user/:userId          # User bookings
PUT  /api/v1/bookings/:id/cancel            # Cancel booking
GET  /api/v1/slots/available                # Available time slots
```

#### ML Services
```http
POST /api/v1/ml/detect                      # YOLOv8 person detection
POST /api/v1/ml/forecast                    # LSTM crowd forecast
POST /api/v1/ml/anomaly                     # Anomaly detection
GET  /api/v1/ml/models                      # List available models
```

**Full API documentation**: See [docs/API.md](docs/API.md)

---

## 🤖 ML Models

### 1. YOLOv8 Person Detection
- **Purpose**: Real-time person counting from CCTV feeds
- **Architecture**: YOLOv8n (nano - fastest), YOLOv8s (small), YOLOv8m (medium)
- **Input**: Video frames (RTSP stream or video file)
- **Output**: Bounding boxes, person count, confidence scores
- **Performance**: ~45 FPS on GPU, ~5 FPS on CPU
- **Training**: Pre-trained on COCO, fine-tuned on custom temple crowd datasets

### 2. LSTM Crowd Forecasting
- **Purpose**: Predict crowd levels 1-7 days ahead
- **Architecture**: 3-layer LSTM (128, 64, 32 units) + Dense layers
- **Input**: Historical footfall (hourly for past 90 days), weather, festivals
- **Output**: Predicted hourly crowd counts
- **Metrics**: MAE < 50, RMSE < 100, MAPE < 15%
- **Training**: PyTorch, Adam optimizer, MSE loss, 100 epochs

### 3. Facebook Prophet
- **Purpose**: Seasonal trend analysis and long-term forecasting
- **Features**: Handles Indian festivals, weekends, holidays
- **Input**: Daily footfall time-series
- **Output**: Daily predictions with confidence intervals
- **Use Case**: Planning for Navratri, Mahashivratri, etc.

### 4. Isolation Forest (Anomaly Detection)
- **Purpose**: Detect unusual crowd behavior (sudden surges, loitering)
- **Features**: Crowd density, velocity, area occupancy, dwell time
- **Output**: Anomaly score (0-1), binary flag (normal/anomaly)
- **Training**: Unsupervised learning on normal crowd patterns
- **Threshold**: 95th percentile for anomaly classification

**Detailed documentation**: See [docs/ML_MODELS.md](docs/ML_MODELS.md)

---

## 📊 Datasets & Training

### Public Datasets Used
1. **COCO (Person Class)**: Pre-training YOLOv8
2. **ShanghaiTech Crowd Dataset**: Crowd counting benchmarks
3. **Mall Dataset**: Person detection in indoor spaces
4. **Hajj Crowd Dataset** (IEEE Access): Pilgrim movement patterns
5. **Custom Temple Footage**: Collected from Somnath, Dwarka (with permissions)

### Data Collection Guidelines
- **CCTV Footage**: 1080p, 25 FPS minimum
- **Labeling**: Use LabelImg, CVAT for bounding box annotations
- **Privacy**: Anonymize faces, blur identifiable features
- **Storage**: Datasets not included in repo (add to .gitignore)

### Training Workflows
```bash
# YOLOv8 Training
cd ml-services/crowd-detection
python train_yolo.py --data temple_dataset.yaml --epochs 100 --img 640

# LSTM Training
cd ml-services/crowd-forecasting
python train_lstm.py --data ../datasets/processed/footfall_data.csv --epochs 100

# Model Evaluation
python evaluate_models.py --model yolov8n --test-data ../datasets/test/
```

**Full dataset guide**: See [docs/DATASETS.md](docs/DATASETS.md)

---

## 🌐 Deployment

### Docker Production Setup

```bash
# Build all images
docker-compose -f infra/docker-compose.prod.yml build

# Start services
docker-compose -f infra/docker-compose.prod.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### Kubernetes Deployment

```bash
# Apply configurations
kubectl apply -f infra/kubernetes/

# Check deployments
kubectl get deployments
kubectl get services
kubectl get pods

# Scale ML services
kubectl scale deployment ml-detection --replicas=3
```

### Cloud Deployment Options

#### AWS
- **Compute**: EC2 instances (t3.large for backend, g4dn.xlarge for ML)
- **Database**: MongoDB Atlas, Amazon ElastiCache (Redis)
- **Storage**: S3 for model files, CloudFront CDN
- **Load Balancer**: ALB (Application Load Balancer)
- **Monitoring**: CloudWatch

#### Azure
- **Compute**: Azure VMs, AKS (Azure Kubernetes Service)
- **Database**: Azure Cosmos DB, Azure Cache for Redis
- **Storage**: Azure Blob Storage
- **AI**: Azure Machine Learning (for model hosting)

#### Google Cloud Platform
- **Compute**: Google Compute Engine, GKE
- **Database**: MongoDB Atlas, Cloud Memorystore
- **AI**: Vertex AI for model deployment

**Detailed deployment guide**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## ⚖️ Legal & Ethical Considerations

### Privacy & Data Protection
- ✅ **Anonymize Data**: No personally identifiable information stored
- ✅ **Transparent Signage**: Inform devotees of CCTV monitoring
- ✅ **Data Minimization**: Retain footage only 30 days (unless incident)
- ✅ **Encryption**: AES-256 for data at rest, TLS 1.3 for transit
- ✅ **Consent**: Opt-in for mobile app location tracking
- ⚠️ **Compliance**: Awaiting India's Digital Personal Data Protection Act

### Ethical AI
- ✅ **Bias Testing**: Evaluate model accuracy across age, gender, ethnicity
- ✅ **Explainability**: Dashboard shows why alerts are triggered
- ✅ **Human Oversight**: AI recommendations, not automated actions
- ✅ **No Facial Recognition**: System uses person detection, not ID
- ⚠️ **Algorithmic Accountability**: Log all automated decisions

### Cultural Sensitivity
- ✅ **Non-Intrusive**: Cameras outside sanctum sanctorum
- ✅ **Respect Traditions**: No tech in restricted areas (e.g., Dwarkadhish)
- ✅ **Accessibility**: Features for elderly, disabled pilgrims
- ✅ **Multilingual**: Hindi, Gujarati, English interfaces

### Regulatory Compliance
- ✅ **NDMA Guidelines**: Adheres to "Managing Crowds at Public Venues"
- ✅ **PRASAD Scheme**: Aligns with MoT infrastructure standards
- ✅ **Local Coordination**: Police, temple boards, disaster management
- ⚠️ **Pending Regulations**: Monitor evolving surveillance laws

**Full ethical guidelines**: See [docs/LEGAL_ETHICS.md](docs/LEGAL_ETHICS.md)

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### How to Contribute

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit Changes**
   ```bash
   git commit -m "Add: Brief description of your changes"
   ```
4. **Push to Branch**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request**

### Contribution Guidelines
- Follow existing code style (ESLint, Prettier configs provided)
- Write unit tests for new features
- Update documentation (README, API docs)
- Ensure all tests pass before submitting PR
- Add meaningful commit messages

### Areas We Need Help
- [ ] Mobile app UI/UX improvements
- [ ] Additional language translations
- [ ] ML model optimization (edge deployment)
- [ ] Integration with more temple management systems
- [ ] Accessibility features for visually impaired
- [ ] Documentation improvements

---

## 🗺️ Roadmap

### Phase 1: MVP (Completed)
- ✅ Real-time crowd monitoring dashboard
- ✅ YOLOv8 person detection
- ✅ Basic LSTM forecasting
- ✅ Mobile app with token booking
- ✅ SMS alert system

### Phase 2: Enhanced AI (Q1 2026)
- [ ] Spatio-temporal CNN-LSTM models
- [ ] Multi-camera tracking (person re-identification)
- [ ] Advanced anomaly detection (GAN-based)
- [ ] Edge deployment (NVIDIA Jetson)
- [ ] Voice alerts in local languages

### Phase 3: IoT Integration (Q2 2026)
- [ ] RFID wristbands for pilgrims
- [ ] Environmental sensors (temperature, noise)
- [ ] Smart turnstiles with auto-counting
- [ ] Parking occupancy sensors
- [ ] Air quality monitoring

### Phase 4: Scale to 100+ Temples (Q3-Q4 2026)
- [ ] Multi-tenancy architecture
- [ ] White-label mobile apps
- [ ] API marketplace for third-party integrations
- [ ] Blockchain for audit trails (optional)
- [ ] Collaboration with government agencies (PRASAD, NDMA)

### Phase 5: Advanced Features (2027+)
- [ ] Predictive route optimization (Google Maps integration)
- [ ] Virtual darshan (VR/AR for remote devotees)
- [ ] Crowdsourced incident reporting
- [ ] Integration with smart city infrastructure
- [ ] Carbon footprint tracking (sustainable tourism)

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses
- YOLOv8: AGPL-3.0 (Ultralytics)
- React: MIT
- Node.js: MIT
- Python: PSF License
- MongoDB: SSPL (Server Side Public License)

---

## 👥 Team & Acknowledgments

### Project Maintainers
- **Your Name** - Lead Developer
- **Your Team** - ML Engineers, Full-Stack Developers

### Acknowledgments
- **Ministry of Tourism, India** - PRASAD scheme insights
- **NDMA** - Crowd management guidelines
- **Temple Authorities** - Somnath Trust, Dwarkadhish Temple Board, Ambaji Temple Committee
- **Research Papers** - IEEE Access (Hajj crowd), SkyView Research (Skylark Labs)
- **Open-Source Community** - TensorFlow, PyTorch, React, Node.js contributors

---

## 📞 Contact & Support

### Get Help
- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/temple-crowd-management/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/temple-crowd-management/discussions)

### Connect
- **Email**: support@templecrowdmanagement.com
- **Twitter**: [@TempleCrowdAI](https://twitter.com/TempleCrowdAI)
- **LinkedIn**: [Temple Crowd Management](https://linkedin.com/company/temple-crowd-management)

### Report Issues
- **Bugs**: Use [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)
- **Feature Requests**: Use [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)
- **Security Vulnerabilities**: Email security@templecrowdmanagement.com (private disclosure)

---

## 🙏 Support the Project

If this project helps your temple or organization, consider:
- ⭐ **Star this repository**
- 🐦 **Share on social media**
- 💰 **Sponsor development** (GitHub Sponsors)
- 🤝 **Partner with us** for deployment at your site

---

<div align="center">

**Built with ❤️ for the devotees and pilgrims of India**

🕉️ Har Har Mahadev 🕉️

</div>
