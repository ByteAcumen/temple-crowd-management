# 🚦 Live Crowd Tracking API Reference

Complete guide for the real-time crowd monitoring system.

---

## Base URL
```
http://localhost:5000/api/v1/live
```

---

## 🎯 Overview

The Live Crowd Tracking system uses **Redis atomic counters** for real-time people counting with automatic threshold alerts.

**Traffic Light System:**
- 🟢 **GREEN** (0-84%): Safe capacity
- 🟡 **ORANGE** (85-94%): Warning threshold
- 🔴 **RED** (95-100%): Critical - Block new entries

---

## 📝 API Endpoints

### 1. Record Entry (Gatekeeper)

**Endpoint:** `POST /api/v1/live/entry`  
**Access:** Gatekeeper, Admin  
**Purpose:** Record when someone enters the temple (QR scan)

**Request:**
```json
{
  "templeId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "passId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Headers:**
```
Authorization: Bearer GATEKEEPER_TOKEN
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Entry recorded successfully",
  "data": {
    "booking": {
      "id": "...",
      "passId": "550e8400-e29b-41d4-a716-446655440000",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "entryTime": "2026-02-03T10:30:00.000Z"
    },
    "temple": {
      "name": "Somnath Temple",
      "live_count": 8500,
      "capacity_percentage": 85.0,
      "traffic_status": "ORANGE"
    },
    "alert": {
      "level": "WARNING",
      "message": "⚠️ WARNING: Somnath Temple at 85.0% capacity",
      "action": "NOTIFY_ADMINS"
    }
  }
}
```

**Errors:**
- `400`: Invalid pass, already used, or cancelled
- `404`: Temple or booking not found
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (not gatekeeper/admin)

---

### 2. Record Exit (Gatekeeper)

**Endpoint:** `POST /api/v1/live/exit`  
**Access:** Gatekeeper, Admin  
**Purpose:** Record when someone leaves the temple

**Request:**
```json
{
  "templeId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "passId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exit recorded successfully",
  "data": {
    "booking": {
      "id": "...",
      "passId": "...",
      "entryTime": "2026-02-03T10:30:00.000Z",
      "exitTime": "2026-02-03T12:15:00.000Z"
    },
    "temple": {
      "live_count": 8499,
      "capacity_percentage": 84.99,
      "traffic_status": "GREEN"
    }
  }
}
```

---

### 3. Get Live Dashboard Data (Public)

**Endpoint:** `GET /api/v1/live/:templeId`  
**Access:** Public  
**Purpose:** Real-time crowd data for dashboards

**Example:**
```bash
GET /api/v1/live/65f1a2b3c4d5e6f7g8h9i0j1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "temple_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "temple_name": "Somnath Temple",
    "location": "Veraval",
    "live_count": 8500,
    "total_capacity": 10000,
    "available_space": 1500,
    "capacity_percentage": 85.0,
    "traffic_status": "ORANGE",
    "thresholds": {
      "warning": 85,
      "critical": 95
    },
    "last_updated": "2026-02-03T12:15:30.000Z",
    "alert": {
      "level": "WARNING",
      "message": "⚠️ WARNING: Somnath Temple at 85.0% capacity",
      "action": "NOTIFY_ADMINS"
    }
  }
}
```

---

### 4. Reset Temple Count (Admin Only)

**Endpoint:** `POST /api/v1/live/reset/:templeId`  
**Access:** Admin Only  
**Purpose:** Emergency reset count to 0 (end of day or emergency)

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Count reset for Somnath Temple",
  "data": {
    "temple_name": "Somnath Temple",
    "live_count": 0
  }
}
```

---

### 5. Get Current Entries (Admin/Gatekeeper)

**Endpoint:** `GET /api/v1/live/:templeId/entries`  
**Access:** Admin, Gatekeeper  
**Purpose:** See list of people currently inside

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "...",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "passId": "550e8400-...",
      "entryTime": "2026-02-03T10:30:00.000Z"
    },
    {
      "_id": "...",
      "userName": "Jane Smith",
      "userEmail": "jane@example.com",
      "passId": "660f9500-...",
      "entryTime": "2026-02-03T10:45:00.000Z"
    }
  ]
}
```

---

## 🔐 Authentication

All gatekeeper and admin endpoints require JWT authentication:

```bash
curl -X POST http://localhost:5000/api/v1/live/entry \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"templeId": "...", "passId": "..."}'
```

---

## 🧪 Testing

**Automated Test Script:**
```powershell
.\test-live-tracking.ps1
```

**Manual Testing:**

1. **Create Temple**
2. **Create Booking** (get passId)
3. **Record Entry**:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:5000/api/v1/live/entry" `
     -Method Post `
     -Body '{"templeId": "...", "passId": "..."}' `
     -Headers @{ "Authorization" = "Bearer $token" } `
     -ContentType "application/json"
   ```
4. **Get Live Status**:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:5000/api/v1/live/TEMPLE_ID"
   ```
5. **Record Exit**

---

## 🎬 Workflow Examples

### Gatekeeper Use Case

**Morning: Temple Opens**
1. Admin resets count: `POST /live/reset/:templeId`

**Throughout Day: Visitors Arrive**
1. Devotee arrives with booking
2. Gatekeeper scans QR code (passId)
3. System calls: `POST /live/entry`
4. Redis increments count
5. System checks thresholds
6. If ≥85%, alert admins

**Evening: Visitor Leaves**
1. Gatekeeper scans QR
2. System calls: `POST /live/exit`
3. Redis decrements count

---

## 🚨 Alert System

**Warning Alert (85%):**
- Level: `WARNING`
- Action: `NOTIFY_ADMINS`
- Response: Send notifications, monitor closely

**Critical Alert (95%):**
- Level: `CRITICAL`
- Action: `BLOCK_NEW_ENTRIES`
- Response: Stop accepting new bookings, alert security

---

## 🔧 Technical Details

### Redis Keys
```
temple:{templeId}:live_count → Current count (integer)
temple:{templeId}:entries → Set of booking IDs inside
```

### Atomic Operations
- Entry: `INCR` + `SADD`
- Exit: `DECR` + `SREM`
- Guaranteed thread-safe (no race conditions)

### MongoDB Sync
- Every entry/exit updates MongoDB
- Redis = speed, MongoDB = persistence

---

## 🐛 Troubleshooting

**"Pass already used for entry"**
- Booking has already been scanned
- Check `GET /live/:templeId/entries` to see if inside

**"Invalid pass ID"**
- Booking not found
- Check booking exists: `GET /api/v1/bookings/:passId`

**"Count is negative"**
- System auto-corrects to 0
- Use `POST /live/reset/:templeId` if needed

---

## 📊 Dashboard Integration

**Real-time Updates:**
```javascript
setInterval(async () => {
  const data = await fetch(`/api/v1/live/${templeId}`);
  updateDashboard(data);
}, 5000); // Refresh every 5 seconds
```

**Traffic Light Display:**
```javascript
const getColor = (status) => {
  return {
    'GREEN': '#22C55E',   // Safe
    'ORANGE': '#F59E0B',  // Warning
    'RED': '#EF4444'      // Critical
  }[status];
};
```

---

**Next:** Implement WebSocket for real-time push updates (optional enhancement)
