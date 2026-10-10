# SyncCast Backend

Production-ready backend architecture for SyncCast watch-party platform with real-time frame-accurate video synchronization, role-based access control (RBAC), and automated host failover.

## Tech Stack
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Real-Time Engine:** Socket.io
- **Database:** MongoDB with Mongoose ODM
- **Validation:** Zod
- **Logging:** Winston
- **Security:** Helmet, CORS

---

## Directory Structure
```
backend/
├── .env
├── .env.example
├── package.json
├── src/
│   ├── config/
│   │   ├── environment.js      # Environment variables & runtime config
│   │   └── permissions.js      # Centralized RBAC matrix and role definitions
│   ├── database/
│   │   └── connection.js       # MongoDB Mongoose connection manager
│   ├── models/
│   │   ├── User.js             # User Mongoose schema & methods
│   │   └── Room.js             # Room schema with frame-accurate drift calculation
│   ├── controllers/
│   │   ├── RoomController.js   # Room REST API endpoints
│   │   └── HealthController.js # Service health and db diagnostics
│   ├── routes/
│   │   ├── roomRoutes.js       # Room router mapping
│   │   ├── healthRoutes.js     # Health router mapping
│   │   └── index.js            # Central API router mounted at /api
│   ├── middleware/
│   │   ├── validate.js         # Zod schema validation middleware
│   │   ├── errorHandler.js     # Centralized global error handler
│   │   └── notFoundHandler.js  # 404 handler
│   ├── sockets/
│   │   ├── socketHandler.js    # Socket.io server initialization & lifecycle
│   │   ├── roomHandlers.js     # join_room and initial room sync
│   │   ├── playbackHandlers.js # play, pause, seek, change_video events
│   │   └── roleHandlers.js     # assign_role, remove_participant, transfer_host
│   ├── services/
│   │   ├── RoomService.js      # Core watch party sync & RBAC business logic
│   │   └── UserService.js      # User upsert & session service
│   ├── validators/
│   │   ├── roomValidator.js    # REST input validation schemas
│   │   └── socketValidator.js  # Socket.io payload schemas
│   ├── utils/
│   │   ├── logger.js           # Winston logger instance
│   │   ├── apiResponse.js      # Standardized JSON response utilities
│   │   ├── errorResponse.js    # Custom ApiError class
│   │   ├── permissionMatrix.js # Centralized RBAC matrix evaluator
│   │   └── roomCodeGenerator.js# SYNC-XXXX code generator
│   ├── app.js                  # Express app setup & middleware pipeline
│   └── server.js               # HTTP + Socket.io entry point
└── test/
    └── verifyBackend.js        # Automated verification test suite
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` in the `backend/` folder:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/synccast
CLIENT_URL=http://localhost:5173,http://localhost:3000
LOG_LEVEL=info
```

### 3. Run Development Server
From root directory:
```bash
npm run server:dev
```
Or from `backend/`:
```bash
npm run dev
```

### 4. Run Test Suite
```bash
npm test
```
