# 🕉️ Temple Smart E-Pass & AI Crowd Control
### *Somnath • Dwarka • Ambaji • Pavagadh*

> **AI-Optimized Digital Queuing Platform for Safer Pilgrimages**

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Stack](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![AI Powered](https://img.shields.io/badge/AI-Forecasting-purple?style=for-the-badge&logo=python)](https://scikit-learn.org/)
[![System](https://img.shields.io/badge/System-QR%20Access-red?style=for-the-badge&logo=qrcode)](https://github.com/kozakurasee/react-qr-code)
[![Infrastructure](https://img.shields.io/badge/Infra-Docker-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![Real-Time](https://img.shields.io/badge/Live-Redis-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)

</div>

---

## 🧠 The "Smart" Difference

Traditional ticketing systems are static. **This system is Intelligent.**
It doesn't just issue tickets; it uses **AI Demand Forecasting** to dynamically adjust slot capacities and **Real-Time Redis Counters** to ensure the crowd *never* exceeds safe limits, even during festivals.

---

## ✨ Features

### 1. 🛡️ Real-Time Safety Layer (Redis)
*   **Context**: Stampedes happen when "Ticketed" people mix with "Walk-ins".
*   **Solution**: **Atomic Redis Counters** track every entry/exit in milliseconds.
*   **Live Dashboard**: A "Traffic Light" system (GREEN/ORANGE/RED) alerts admins instantly when capacity breaches 85%.

### 2. 🔮 Predictive Slot Allocation (AI Engine)
*   **The Problem**: A flat "500 tickets/hour" rule fails during sudden rain or VIP visits.
*   **The AI Solution**: Our Python ML model (XGBoost) analyzes **Holidays, Weather, and Historical Trends** to recommend dynamic caps.
    *   *Example*: "Heavy rain predicted at 5 PM -> AI increases 2 PM capacity to shift the crowd earlier."

### 3. 🤖 AI Help Bot (RAG)
*   **Devotee Support**: A built-in chatbot answers queries like *"Is it crowded right now?"* or *"What are the timings?"*.
*   **Smart**: It combines static knowledge with **Live Crowd Data** to give accurate, real-time answers.

### 4. 🔒 Enterprise-Grade Security
*   **RBAC**: Distinct roles for **Devotees**, **Gatekeepers**, and **Admins**.
*   **JWT Auth**: Stateless, secure authentication for all API interactions.

---

## 🏗️ Architecture

```mermaid
graph TD
    subgraph "The Brain (AI Layer)"
        Data[History + Weather] -->|Train| Model[Python/XGBoost]
        Model -->|Forecast| DB[(MongoDB)]
    end

    subgraph "The Body (Backend Layer)"
        User[Devotee] -->|Books Slot| API[Node.js Express]
        Staff[Gatekeeper] -->|Scans QR| API
        API -->|Atomic Counts| Redis[(Redis Costore)]
        API -->|Queries| Model
        API -->|Stores| DB
    end

    subgraph "The Interface (Frontend Layer)"
        API -->|Live Status| Dashboard[Admin Panel]
        API -->|E-Pass| App[React Native/Web]
    end
```

---

## 🚀 Getting Started

### Prerequisites
*   Docker & Docker Compose

### Fast Start (Recommended)
Run the entire stack (Backend, AI Service, Redis, Mongo) with one command:
```bash
docker-compose up --build
```

### Manual Setup
1.  **AI Service**:
    ```bash
    cd ml-services/demand-forecasting && pip install -r requirements.txt && python src/api.py
    ```
2.  **Backend**:
    ```bash
    cd backend && npm install && npm run dev
    ```

---

## 🧪 Testing
We include an automated E2E test suite.
```bash
cd backend
node test_api.js
```
*   Verifies: Registration -> Login -> AI Prediction -> Booking -> Live Entry -> Bot Query.

---

## 🛠️ Stack
- **Core**: Node.js, Express, MongoDB Mongoose
- **Intelligence**: Python (FastAPI, XGBoost)
- **Speed**: Redis (ioredis)
- **Infra**: Docker, Docker Compose
