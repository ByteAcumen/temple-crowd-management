# System Verification

## Quick Start

Run the comprehensive verification test:

```powershell
.\verify-system.ps1
```

This single script tests all system features in organized sections.

## What It Tests

### 1. Health & Connectivity
- API availability
- Basic endpoint response

### 2. Authentication
- User registration (Admin/User/Gatekeeper)
- JWT token generation
- Login functionality

### 3. Authorization & Security
- JWT validation
- Unauthorized access blocking (401)
- Non-admin blocking from admin routes (403)
- Role-based access control

### 4. Temple Management
- Create temple (Admin only)
- Get all temples (Public)
- Get single temple
- Get live status

### 5. Booking System
- Check slot availability
- Create booking
- **Overbooking prevention** (Critical!)
- QR code lookup
- Get user bookings

### 6. Live Crowd Tracking
- Record entry (Gatekeeper)
- Duplicate entry prevention
- Get live dashboard
- Record exit

### 7. Admin Dashboard
- Dashboard statistics
- Crowd analytics
- Temple reports
- User management
- Booking management
- System health check

### 8. Cleanup
- Cancel booking

## Test Output

The script provides:
- Colored output (Green = Pass, Red = Fail)
- Clear section headers
- Test counter and progress
- Final summary with success rate
- List of features tested

## Expected Results

- **Total Tests**: 27
- **Pass Rate**: 100%

If any test fails, the script shows the specific error message.

## Requirements

- Backend server running on `http://localhost:5000`
- MongoDB connected
- Redis connected

## Custom Base URL

```powershell
.\verify-system.ps1 -BaseUrl "http://your-server:5000/api/v1"
```

## Features

- ✅ Clean, organized code structure
- ✅ Helper functions for reusability
- ✅ Proper error handling
- ✅ Clear, readable output
- ✅ Comprehensive coverage (27 tests)
- ✅ Sequential test flow
- ✅ Test data management
