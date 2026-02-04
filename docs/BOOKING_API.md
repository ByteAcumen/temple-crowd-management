# Booking API Documentation

Base URL: `http://localhost:5000/api/v1/bookings`

---

## Endpoints

### 1. Check Slot Availability
**GET** `/availability`

Check if a specific slot is available for booking.

**Query Parameters**:
```
templeId: string (required)
date: string (required) - Format: YYYY-MM-DD
slot: string (required) - Example: "10:00 AM - 11:00 AM"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "AVAILABLE",
    "available_slots": 45,
    "capacity": 50,
    "booked": 5
  }
}
```

---

### 2. Create Booking
**POST** `/`

Create a new booking with slot validation.

**Authorization**: Required (JWT Token)

**Body**:
```json
{
  "templeId": "string",
  "templeName": "string",
  "date": "2026-02-05",
  "slot": "10:00 AM - 11:00 AM",
  "visitors": 5,
  "userName": "string",
  "userEmail": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "passId": "PASS-UUID",
    "qrCode": "data:image/png;base64...",
    "status": "CONFIRMED",
    "visitors": 5,
    "createdAt": "2026-02-04T12:00:00.000Z"
  }
}
```

**Features**:
- ✅ Slot capacity validation
- ✅ **Overbooking prevention** (Critical!)
- ✅ Automatic QR code generation
- ✅ Email confirmation (if SMTP configured)
- ✅ WebSocket broadcast

---

### 3. Get User Bookings
**GET** `/`

Get all bookings for the authenticated user.

**Authorization**: Required (JWT Token)

**Query Parameters**:
```
email: string (optional) - Filter by email
status: string (optional) - CONFIRMED, CANCELLED, COMPLETED
```

**Response**:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "booking_id",
      "passId": "PASS-UUID",
      "templeName": "Test Temple",
      "date": "2026-02-05",
      "slot": "10:00 AM - 11:00 AM",
      "visitors": 5,
      "status": "CONFIRMED"
    }
  ]
}
```

---

### 4. QR Code Lookup
**GET** `/pass/:passId`

Lookup booking details by QR pass ID (for gatekeepers).

**Public endpoint** - No authentication required

**Response**:
```json
{
  "success": true,
  "data": {
    "pass_id": "PASS-UUID",
    "temple_name": "Test Temple",
    "date": "2026-02-05",
    "slot": "10:00 AM - 11:00 AM",
    "visitors": 5,
    "user_name": "Test User",
    "is_valid": true,
    "status": "CONFIRMED"
  }
}
```

---

### 5. Get Single Booking
**GET ** `/:id`

Get details of a specific booking.

**Authorization**: Required (Owner or Admin)

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "passId": "PASS-UUID",
    "qrCode": "data:image/png;base64...",
    "templeName": "Test Temple",
    "date": "2026-02-05",
    "slot": "10:00 AM - 11:00 AM",
    "visitors": 5,
    "status": "CONFIRMED",
    "payment": {
      "amount": 100,
      "status": "PAID"
    }
  }
}
```

---

### 6. Cancel Booking
**DELETE** `/:id`

Cancel a booking and trigger refund process.

**Authorization**: Required (Owner or Admin)

**Response**:
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "_id": "booking_id",
    "status": "CANCELLED",
    "refund": {
      "status": "INITIATED",
      "amount": 100
    }
  }
}
```

**Features**:
- ✅ Status update to CANCELLED
- ✅ Refund initiation
- ✅ Email notification (if SMTP configured)
- ✅ WebSocket broadcast

---

## Error Codes

- `400` - Validation error (slot full, invalid date, etc.)
- `401` - Unauthorized (no JWT token)
- `403` - Forbidden (not owner of booking)
- `404` - Booking not found
- `500` - Server error

---

## Business Rules

1. **Overbooking Prevention**: Slot capacity is strictly enforced
2. **Ownership**: Users can only view/cancel their own bookings
3. **Admin Override**: Admins can view/cancel any booking
4. **QR Validation**: Pass IDs are unique UUIDs
5. **Date Validation**: Bookings only for future dates
6. **Slot Capacity**: Per-slot limits defined by temple

---

## Integration

### With Live Tracking:
- QR pass ID used for entry/exit recording

### With Notifications:
- Confirmation email on creation
- Cancellation email on deletion

### With WebSocket:
- `booking:created` event broadcast
- `booking:cancelled` event broadcast
