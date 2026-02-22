# 🏛️ Temple Management API - Quick Reference

## Base URL
```
http://localhost:5000/api/v1/temples
```

---

## 📝 API Endpoints

### 1. Get All Temples (Public)
```powershell
curl http://localhost:5000/api/v1/temples
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "65f1a...",
      "name": "Somnath Temple",
      "location": {
        "city": "Veraval",
        "state": "Gujarat"
      },
      "capacity": {
        "total": 10000,
        "per_slot": 500
      },
      "live_count": 0,
      "capacity_percentage": "0.0",
      "traffic_status": "GREEN",
      "status": "OPEN"
    }
  ]
}
```

---

### 2. Create Temple (Admin Only)
```powershell
$token = "YOUR_ADMIN_JWT_TOKEN"

curl -X POST http://localhost:5000/api/v1/temples `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{
    "name": "Somnath Temple",
    "location": {
      "city": "Veraval",
      "state": "Gujarat",
      "address": "Veraval, Prabhas Patan",
      "coordinates": {
        "latitude": 20.8880,
        "longitude": 70.4013
      }
    },
    "capacity": {
      "total": 10000,
      "per_slot": 500,
      "threshold_warning": 85,
      "threshold_critical": 95
    },
    "slots": [
      {"time": "06:00 AM - 08:00 AM", "max_capacity": 500, "is_active": true},
      {"time": "08:00 AM - 10:00 AM", "max_capacity": 500, "is_active": true},
      {"time": "10:00 AM - 12:00 PM", "max_capacity": 500, "is_active": true}
    ],
    "contact": {
      "phone": "+91-9876543210",
      "email": "info@somnath.com",
      "website": "https://somnath.org"
    },
    "status": "OPEN"
  }'
```

---

### 3. Get Single Temple (Public)
```powershell
curl http://localhost:5000/api/v1/temples/TEMPLE_ID
```

---

### 4. Update Temple (Admin Only)
```powershell
$token = "YOUR_ADMIN_JWT_TOKEN"

curl -X PUT http://localhost:5000/api/v1/temples/TEMPLE_ID `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{
    "status": "OPEN",
    "capacity": {
      "total": 15000
    }
  }'
```

---

### 5. Delete Temple (Admin Only)
```powershell
$token = "YOUR_ADMIN_JWT_TOKEN"

curl -X DELETE http://localhost:5000/api/v1/temples/TEMPLE_ID `
  -H "Authorization: Bearer $token"
```

---

### 6. Get Live Crowd Status (Public)
```powershell
curl http://localhost:5000/api/v1/temples/TEMPLE_ID/live
```

**Response:**
```json
{
  "success": true,
  "data": {
    "temple_id": "65f1a...",
    "temple_name": "Somnath Temple",
    "live_count": 8500,
    "total_capacity": 10000,
    "percentage": "85.0",
    "status": "ORANGE",
    "last_updated": "2026-02-03T..."
  }
}
```

**Traffic Light Status:**
- 🟢 **GREEN** - Below 85% capacity (safe)
- 🟡 **ORANGE** - 85-95% capacity (warning)
- 🔴 **RED** - Above 95% capacity (critical)

---

### 7. Filter Temples by Status
```powershell
# Get only open temples
curl http://localhost:5000/api/v1/temples?status=OPEN

# Get temples by city
curl http://localhost:5000/api/v1/temples?city=Veraval
```

---

## 🔐 Authentication

**Get Admin Token:**
```powershell
curl -X POST http://localhost:5000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@temple.com",
    "password": "Admin@123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@temple.com",
    "role": "admin"
  }
}
```

---

## 🧪 Automated Testing

**Test all temple endpoints:**
```powershell
.\test-temples.ps1
```

**Full automated test (Docker + Tests):**
```powershell
.\test-all.ps1
```

---

## 📊 Temple Model Schema

```javascript
{
  name: String (unique, required),
  location: {
    address: String,
    city: String (required),
    state: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  capacity: {
    total: Number (required),
    per_slot: Number (default: 500),
    threshold_warning: Number (default: 85),
    threshold_critical: Number (default: 95)
  },
  slots: [{
    time: String,
    max_capacity: Number,
    is_active: Boolean
  }],
  contact: {
    phone: String,
    email: String,
    website: String
  },
  live_count: Number (default: 0),
  status: 'OPEN' | 'CLOSED' | 'MAINTENANCE',
  createdAt: Date,
  updatedAt: Date
}
```

**Virtual Properties** (calculated, not stored):
- `capacity_percentage` - Current % of capacity (e.g., "85.0")
- `traffic_status` - GREEN / ORANGE / RED

---

## 🚦 Traffic Light Logic

```javascript
if (percentage >= 95) {
  status = 'RED';    // Critical - block new entries
} else if (percentage >= 85) {
  status = 'ORANGE'; // Warning - approaching capacity
} else {
  status = 'GREEN';  // Normal - safe to enter
}
```

---

## 🔧 Troubleshooting

**Temple already exists error:**
- Each temple name must be unique
- Change temple name or update existing temple instead

**Unauthorized error:**
- Make sure you're logged in as admin
- Check JWT token is valid and included in Authorization header

**Validation errors:**
- Temple name is required
- City is required
- Total capacity must be at least 50
