# WebSocket Events Documentation

Socket.IO Server: `http://localhost:5000`

---

## Connection

### Client Connection:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');
```

---

## Rooms

### 1. Temple-Specific Rooms
**Room ID**: `temple:<templeId>`

Join to receive updates for a specific temple:
```javascript
socket.emit('join', { room: `temple:${templeId}` });
```

### 2. Admin Dashboard Room
**Room ID**: `admin:dashboard`

Join to receive all system-wide updates:
```javascript
socket.emit('join', { room: 'admin:dashboard' });
```

---

## Events

### 1. `crowd:update`
Real-time crowd count updates.

**Emitted when**:
- Entry recorded
- Exit recorded

**Payload**:
```javascript
{
  templeId: "temple_id",
  templeName: "Main Temple",
  current_count: 45,
  capacity: 500,
  change: "+1", // or "-1"
  status: "GREEN", // or "ORANGE", "RED"
  timestamp: "2026-02-04T12:00:00.000Z"
}
```

**Listen**:
```javascript
socket.on('crowd:update', (data) => {
  console.log(`Temple ${data.templeName}: ${data.current_count} visitors`);
  updateDashboard(data);
});
```

---

### 2. `threshold:alert`
Capacity threshold warnings.

**Emitted when**:
- Crowd reaches 85% (WARNING)
- Crowd reaches 95% (CRITICAL)

**Payload**:
```javascript
{
  templeId: "temple_id",
  templeName: "Main Temple",
  current_count: 425,
  capacity: 500,
  percentage: 85,
  level: "WARNING", // or "CRITICAL"
  message: "Crowd at 85% capacity",
  timestamp: "2026-02-04T12:00:00.000Z"
}
```

**Listen**:
```javascript
socket.on('threshold:alert', (data) => {
  if (data.level === 'CRITICAL') {
    showCriticalAlert(data.message);
  } else {
    showWarning(data.message);
  }
});
```

---

### 3. `booking:created`
New booking notifications.

**Emitted when**:
- User creates a new booking

**Payload**:
```javascript
{
  bookingId: "booking_id",
  passId: "PASS-UUID",
  templeName: "Main Temple",
  date: "2026-02-05",
  slot: "10:00 AM - 11:00 AM",
  visitors: 5,
  userName: "John Doe",
  timestamp: "2026-02-04T12:00:00.000Z"
}
```

**Listen**:
```javascript
socket.on('booking:created', (data) => {
  console.log(`New booking: ${data.userName} for ${data.templeName}`);
  refreshBookingList();
});
```

---

### 4. `booking:cancelled`
Booking cancellation notifications.

**Emitted when**:
- User cancels a booking
- Admin cancels a booking

**Payload**:
```javascript
{
  bookingId: "booking_id",
  passId: "PASS-UUID",
  templeName: "Main Temple",
  date: "2026-02-05",
  slot: "10:00 AM - 11:00 AM",
  reason: "User requested",
  timestamp: "2026-02-04T12:00:00.000Z"
}
```

**Listen**:
```javascript
socket.on('booking:cancelled', (data) => {
  console.log(`Booking cancelled: ${data.bookingId}`);
  removeBookingFromUI(data.bookingId);
});
```

---

### 5. `stats:update`
Admin dashboard statistics updates.

**Emitted when**:
- Booking created/cancelled
- User registered
- Significant system change

**Payload**:
```javascript
{
  total_bookings: 151,
  today_bookings: 26,
  total_users: 76,
  current_crowd: 46,
  timestamp: "2026-02-04T12:00:00.000Z"
}
```

**Listen**:
```javascript
socket.on('stats:update', (data) => {
  updateDashboardStats(data);
});
```

---

## Complete Frontend Example

```javascript
import { io } from 'socket.io-client';

// Connect to server
const socket = io('http://localhost:5000');

// Join temple room
const templeId = "temple_123";
socket.emit('join', { room: `temple:${templeId}` });

// Listen to crowd updates
socket.on('crowd:update', (data) => {
  document.getElementById('crowd-count').textContent = data.current_count;
  document.getElementById('status').className = `status-${data.status.toLowerCase()}`;
});

// Listen to alerts
socket.on('threshold:alert', (data) => {
  if (data.level === 'CRITICAL') {
    showAlert(`⚠️ CRITICAL: ${data.message}`, 'danger');
  } else {
    showAlert(`⚡ WARNING: ${data.message}`, 'warning');
  }
});

// Listen to bookings
socket.on('booking:created', (data) => {
  addBookingToList(data);
  showNotification(`New booking: ${data.userName}`);
});

// Error handling
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
});

// Disconnect
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

---

## Admin Dashboard Example

```javascript
// Admin connects to admin room
socket.emit('join', { room: 'admin:dashboard' });

// Listen to all events
socket.on('crowd:update', updateLiveMap);
socket.on('threshold:alert', showAdminAlert);
socket.on('booking:created', incrementBookingCount);
socket.on('booking:cancelled', decrementBookingCount);
socket.on('stats:update', refreshDashboard);
```

---

## Room Management

### Join a Room:
```javascript
socket.emit('join', { room: 'temple:123' });
```

### Leave a Room:
```javascript
socket.emit('leave', { room: 'temple:123' });
```

### Multiple Rooms:
```javascript
// User can join multiple rooms
socket.emit('join', { room: 'temple:123' });
socket.emit('join', { room: 'temple:456' });
socket.emit('join', { room: 'admin:dashboard' });
```

---

## Event Flow

### Entry Recording:
```
1. Gatekeeper scans QR
2. POST /api/v1/live/entry
3. Backend updates Redis
4. Backend emits 'crowd:update' to temple room
5. Frontend updates live count
6. If threshold crossed → emit 'threshold:alert'
```

### Booking Creation:
```
1. User submits booking form
2. POST /api/v1/bookings
3. Backend validates and saves
4. Backend emits 'booking:created' to admin room
5. Admin dashboard shows new booking
6. Email notification sent (async)
```

---

## Security Considerations

### Current Implementation:
- ✅ Rooms for isolation
- ✅ Server-side event emission
- ⚠️ No socket authentication (yet)

### Recommended for Production:
```javascript
// Add JWT authentication
io.use((socket, next) => {
  const token = socket.handshake.auth. token;
  if (verifyToken(token)) {
    socket.user = getUserFromToken(token);
    next();
  } else {
    next(new Error('Authentication error'));
  }
});
```

---

## Testing WebSocket Events

### Using Browser Console:
```javascript
const socket = io('http://localhost:5000');
socket.on('crowd:update', console.log);
socket.emit('join', { room: 'temple:123' });
```

### Using Postman/Thunder Client:
1. Connect to `ws://localhost:5000`
2. Emit: `join` with `{ "room": "temple:123" }`
3. Listen for events

---

## Event Frequency

- `crowd:update`: Every entry/exit (~1-100/minute)
- `threshold:alert`: Only when crossing thresholds (rare)
- `booking:created`: Per booking (~5-50/hour)
- `booking:cancelled`: Per cancellation (~1-10/hour)
- `stats:update`: On significant changes (~1-5/minute)
