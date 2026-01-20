# Backend - Temple Crowd Management System

Node.js + Express backend for the Temple & Pilgrimage Crowd Management System.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+
- RabbitMQ 3.12+ (optional, for message queue)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configurations
```

### Development

```bash
# Start development server (with auto-reload)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Production

```bash
# Start production server
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── models/           # Mongoose models
│   ├── routes/           # Express routes
│   ├── middleware/       # Custom middleware
│   ├── services/         # Business logic
│   ├── utils/            # Helper functions
│   ├── validators/       # Input validation schemas
│   ├── app.js            # Express app setup
│   └── server.js         # Server entry point
├── tests/                # Test files
├── scripts/              # Utility scripts
├── package.json
├── .env.example
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

### Temples
- `GET /api/v1/temples` - List all temples
- `GET /api/v1/temples/:id` - Get temple details
- `POST /api/v1/temples` - Create temple (admin only)
- `PUT /api/v1/temples/:id` - Update temple
- `DELETE /api/v1/temples/:id` - Delete temple

### Crowd Monitoring
- `GET /api/v1/crowds/live` - Get live crowd data
- `GET /api/v1/crowds/history` - Get historical crowd data
- `GET /api/v1/crowds/forecast/:templeId` - Get crowd forecast
- `GET /api/v1/crowds/heatmap/:templeId` - Get density heatmap

### Bookings
- `POST /api/v1/bookings` - Create booking
- `GET /api/v1/bookings/:id` - Get booking details
- `GET /api/v1/bookings/user/:userId` - Get user bookings
- `PUT /api/v1/bookings/:id/cancel` - Cancel booking
- `GET /api/v1/slots/available` - Get available slots

### Alerts
- `GET /api/v1/alerts` - List alerts
- `POST /api/v1/alerts` - Create alert rule
- `PUT /api/v1/alerts/:id/acknowledge` - Acknowledge alert
- `DELETE /api/v1/alerts/:id` - Delete alert

## Environment Variables

See `.env.example` for all available configuration options.

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.js

# Generate coverage report
npm test -- --coverage
```

## Docker

```bash
# Build Docker image
docker build -t temple-backend .

# Run container
docker run -p 5000:5000 --env-file .env temple-backend
```

## License

MIT
