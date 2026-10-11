# SyncCast

> A production-grade watch party platform engineered for real-time synchronized streaming, frame-accurate consensus, and strict role-based room moderation.

SyncCast connects viewers across the globe into synchronized virtual cinema rooms. Whether streaming 4K premiere presets or custom YouTube videos, every participant stays locked to the host's timeline with sub-25ms WebSocket latency. Built from the ground up with security, real-time state management, and modern streaming design patterns.

---

## Overview

Watching movies or videos with friends online often results in desynchronization: one user buffers, another is seconds ahead spoiling the plot, and accidental playback controls disrupt everyone in the session.

SyncCast addresses this with three core principles:
1. **Deterministic Master-Follower Playback**: The room host maintains authoritative control over the playback clock. Participant players continuously calculate frame drift and smoothly lock into the host's position without jarring seeks.
2. **Strict Role-Based Access Control (RBAC)**: Clear boundaries exist between **Host**, **Moderator**, and **Guest (Participant)**. Guests enjoy an uninterrupted, read-only viewing experience while hosts and moderators manage playback and room moderation.
3. **Resilient Session Lifecycle Management**: When the host leaves or concludes the stream, the session terminates cleanly, notifying all participants and gracefully redirecting them to the home catalog.
4. **Universal Invite Links**: One-click sharing via room codes or direct links (`/join?room=SYNC-XXXX`) with full Single Page Application (SPA) rewrite support across Vercel, Netlify, and custom domains.

---

## Core Features and System Workflows

### 1. Catalog and Premiere Streaming
* **Cinema and TV Show Catalogs**: Browse curated 4K movies and serialized TV shows with genre filters, synopsis previews, and IMDb ratings.
* **Automatic Host Session Creation**: Selecting **"Watch Now"**, **"Play Now"**, or **"Watch Premiere"** automatically initializes a dedicated room (`SYNC-XXXX`), assigning the creator as **Room Host**.
* **Guest Redirect and Session Memory**: Unauthenticated visitors who attempt to start a stream are prompted to sign in; their selected title is securely stored in `sessionStorage` and automatically launched the moment authentication completes.

### 2. Multi-Role Watch Party Architecture
* **Room Host**:
  * Unrestricted playback control: Play, Pause, Seek forward/backward, Restart, and Queue traversal.
  * Load custom YouTube video URLs or swap premiere streams on the fly.
  * Manage participant permissions: Promote to Moderator, Demote to Guest, or Transfer Host ownership.
  * Moderation actions: Mute chat privileges, remove disruptive participants, or issue permanent stream blocks.
  * Session Termination: Terminate the broadcast at any time with global eviction consensus.
* **Moderator**:
  * Assist in room governance: monitor live chat, mute participants, and flag violations.
  * Synchronized playback viewing with elevated moderation actions.
* **Guest (Participant)**:
  * Enter through invitation links or 9-character room codes.
  * Strictly admitted in **Read-Only Mode** (`Synced - Read-Only Mode`) to prevent accidental interruptions.
  * Interactive participation via live room chat and single-click reactions.

### 3. Interactive Chat and Single-Reaction Policy
* **Live Chatbox**: Real-time messaging with participant status badges and timestamps.
* **One-Click Reaction Policy**:
  * Each user can click **Like** and **Love** only once per stream session, avoiding spam.
  * **Visual State Feedback**: The thumbs-up icon fills with bright blue (`text-blue-400 fill-blue-500`), while the heart icon fills with vibrant red (`text-red-500 fill-red-500`).
  * **Animated Micro Pop-Up Tooltips**: Clicking a reaction triggers a floating, animated pop-up (`Liked!`, `Loved!`, or `Already liked!`).
  * Count badges have been removed from reaction buttons for a cleaner, modern interface.

### 4. Seamless Invitation and Edge Routing
* **Share Modal**: Quick copy for shareable links, formatted invite summaries, and direct integrations with WhatsApp, Telegram, Twitter/X, and Email.
* **Zero 404s on Edge Hosting**: Built-in Vercel (`vercel.json`) and Netlify (`_redirects`) rewrites guarantee that external link clicks (`https://synccast.vercel.app/join?room=SYNC-4973`) never hit static server 404s and always route straight into React Router.

---

## Architecture and Technology Stack

```
                        +-----------------------------------------+
                        |            CLIENT BROWSER               |
                        |    React 18/19 SPA  -  Tailwind CSS     |
                        +--------------------+--------------------+
                                             |
                 +---------------------------+-------------------------+
                 |                                                     |
                 v                                                     v
  +-----------------------------+                       +-----------------------------+
  |      SUPABASE AUTH          |                       |      EXPRESS + SOCKET.IO    |
  |  - JWT Sessions             |                       |  - Sub-25ms Event Gateway   |
  |  - Password & Social Auth   |                       |  - RBAC Matrix Enforcement  |
  |  - Email Verification       |                       |  - Drift Calculation Logic  |
  +--------------+--------------+                       +--------------+--------------+
                 | (Background Sync)                                   |
                 v                                                     v
  +-----------------------------------------------------------------------------------+
  |                           MONGODB ATLAS                                           |
  |  - Users (canHost: true, roles)                                                   |
  |  - Rooms (playbackState, currentTime, streamStatus, isActive)                     |
  |  - RoomParticipants (presence, socket IDs, moderation states)                     |
  +-----------------------------------------------------------------------------------+
```

### Frontend
* **Core:** React 18/19, Vite (optimized build pipeline, ~4s bundling)
* **Styling:** Vanilla Tailwind CSS with custom glassmorphism surfaces and dark cinema aesthetics
* **Icons and Animation:** Lucide Icons, tailored CSS keyframe micro-animations
* **Media Engine:** YouTube IFrame Player API with frame drift synchronization logic
* **Real-Time Client:** Socket.io-client with automatic reconnection and multi-tab `BroadcastChannel` bridge
* **Code Quality:** Oxlint (0 warnings, 0 errors across 45 files)

### Backend
* **Runtime:** Node.js (ECMAScript Modules)
* **Framework:** Express.js REST API
* **Sockets:** Socket.io with room-scoped namespaces, heartbeat pings, and event validation
* **Database:** MongoDB Atlas via Mongoose ODM
* **Security Hardening:** Helmet (OWASP headers), CORS origin allowlists, Bcrypt (cost 12), and auth rate limiting (10 attempts / 10 min window)
* **Validation:** Zod schemas for both HTTP endpoints and WebSocket event payloads
* **Logging:** Structured Winston logging with operational log tiers

---

## Repository Structure

```
SyncCast/
├── package.json                    # Root monorepo orchestration scripts
├── vercel.json                     # Root Vercel SPA rewrite configuration
├── .gitignore                      # Secrets and build artifact protection
├── frontend/                       # Vite + React Client
│   ├── index.html                  # HTML entry point with Plus Jakarta Sans typography
│   ├── vercel.json                 # Frontend-specific Vercel deployment rewrites
│   ├── vite.config.js              # Vite bundling, chunk splitting, and alias config
│   ├── tailwind.config.js          # Design system colors, fonts, and dark tokens
│   ├── public/
│   │   ├── _redirects              # Netlify & Cloudflare SPA client-side fallback
│   │   └── ...                     # Static brand assets & logos
│   └── src/
│       ├── App.jsx                 # Top-level routing, query parameter interceptor
│       ├── index.css               # Core CSS variables, animations (.animate-popIn)
│       ├── context/
│       │   └── AuthContext.jsx     # Supabase auth provider & MongoDB bridge
│       ├── hooks/
│       │   └── useWatchParty.js    # Master watch party state engine & sync logic
│       ├── components/
│       │   ├── Navbar.jsx          # Header navigation, role badges, room code pill
│       │   ├── VideoPlayer.jsx     # YouTube player wrapper with custom cinema controls
│       │   ├── WatchPartyRoom.jsx  # Main theater layout, chat tabs, eviction modal
│       │   ├── PartyChat.jsx       # Real-time room chat, one-time Like/Love reactions
│       │   ├── ParticipantList.jsx # Attendee roster with Host moderation actions
│       │   ├── ShareRoomModal.jsx  # Social invitation dispatcher & clipboard copy
│       │   └── ...                 # Modular UI primitives and cards
│       ├── pages/
│       │   ├── HomePage.jsx        # Spotlight hero carousel, directory portal
│       │   ├── MoviesPage.jsx      # Cinema premiere catalog with genre filter
│       │   ├── TvShowsPage.jsx     # Episodic series hub with premiere highlights
│       │   ├── JoinPartyPage.jsx   # Dedicated code/link room onboarding portal
│       │   ├── HostPartyPage.jsx   # Custom YouTube link room initializer
│       │   └── ...                 # Auth, Dashboard, and Legal pages
│       └── utils/                  # Drift math, avatars, moderation helpers
└── backend/                        # Node.js + Express + Socket.io Server
    ├── server.js                   # HTTP & Socket.io server bootstrap
    ├── package.json                # Backend dependencies & test suites
    ├── src/
    │   ├── app.js                  # Express middleware pipeline, Helmet, rate limiter
    │   ├── database/
    │   │   └── connection.js       # MongoDB Atlas connection manager
    │   ├── models/
    │   │   ├── User.js             # User identity, canHost default, auth methods
    │   │   ├── Room.js             # Room state, streamStatus, isActive indicator
    │   │   └── RoomParticipant.js  # Live attendee tracking schema
    │   ├── routes/
    │   │   ├── authRoutes.js       # Register, login, current user, sync routes
    │   │   └── roomRoutes.js       # REST playback, role, and room management
    │   ├── controllers/
    │   │   ├── AuthController.js   # Bcrypt auth & MongoDB user synchronization
    │   │   └── RoomController.js   # RBAC-guarded room playback controllers
    │   ├── services/
    │   │   ├── RoomService.js      # Watch party business logic & DB operations
    │   │   └── UserService.js      # User upsert & session synchronization
    │   ├── sockets/
    │   │   ├── socketHandler.js    # Central Socket.io connection coordinator
    │   │   ├── playbackHandlers.js # Synchronized play, pause, seek, and next video
    │   │   └── roleHandlers.js     # Role assignments, kicks, and host transfers
    │   ├── config/
    │   │   └── permissions.js      # RBAC permission matrix definitions
    │   └── utils/                  # Winston logger, error formatters, room codes
    └── test/                       # Automated Verification Suites (100% passing)
        ├── verifyBackend.js        # Permission matrix & drift compensation tests
        ├── verifySecurityAudit.js  # OWASP standards, Bcrypt cost, rate-limiting
        ├── verifyEndpointsIntegration.js # Route RBAC 403/429 protection checks
        ├── verifyRbacRealtime.js   # Live MongoDB Atlas multi-user persistence
        └── verifyHostExitTermination.js # Host departure & session lifecycle
```

---

## Permission and Access Control Matrix (RBAC)

| Capability / Action | Room Host | Moderator | Guest / Participant |
| :--- | :---: | :---: | :---: |
| **Play / Pause Video** | Allowed | Forbidden | Read-Only |
| **Seek / Skip Timeline** | Allowed | Forbidden | Read-Only |
| **Change Video / YouTube URL** | Allowed | Forbidden | Read-Only |
| **Traverse Queue (Next / Prev)** | Allowed | Forbidden | Read-Only |
| **Assign / Update Roles** | Allowed | Forbidden | Forbidden |
| **Transfer Host Ownership** | Allowed | Forbidden | Forbidden |
| **Mute Chat Privileges** | Allowed | Allowed | Forbidden |
| **Remove / Kick Participant** | Allowed | Allowed | Forbidden |
| **Permanently Block Participant** | Allowed | Forbidden | Forbidden |
| **Terminate Stream Session** | Allowed | Forbidden | Forbidden |
| **Send Chat Messages** | Allowed | Allowed | Allowed (Unless Muted) |
| **One-Click Like / Love** | Allowed | Allowed | Allowed |

---

## Getting Started Locally

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **MongoDB**: A local instance or connection string from MongoDB Atlas
* **Supabase** *(Optional for local testing)*: Project credentials from Supabase (SyncCast automatically falls back to an offline demo authentication flow if Supabase keys are not provided).

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/rahulupadhyay220/SyncCast.git
cd SyncCast
```

---

### Step 2: Configure Environment Variables

#### Backend (`backend/.env`)
Create `backend/.env` with your configuration:
```env
PORT=8080
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173,http://localhost:3000
LOG_LEVEL=info
AUTH_RATE_LIMIT_WINDOW_MS=600000
AUTH_RATE_LIMIT_MAX=10
```

#### Frontend (`frontend/.env.local`)
Create `frontend/.env.local`:
```env
# Backend & WebSocket Gateway
VITE_BACKEND_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080

# Supabase Auth (Optional - falls back to offline mode if blank)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

### Step 3: Install Dependencies

From the project root:
```bash
npm install
npm --prefix frontend install
npm --prefix backend install
```

---

### Step 4: Run the Development Servers

Launch both applications in parallel from the root directory:
```bash
# Start frontend client (Vite on http://localhost:5173)
npm run dev

# In a second terminal, start the backend server (Node.js on http://localhost:8080)
npm run server:dev
```

Open `http://localhost:5173` in your browser.

---

## Testing and Verification Suites

SyncCast includes a full suite of automated tests verifying backend security, database persistence, and RBAC integrity against live MongoDB Atlas:

```bash
# Run all backend test suites
npm run test
```

### Verified Test Results:
```text
[PASS] Permission Matrix & RBAC tests passed
[PASS] Role Validation tests passed
[PASS] Room Code Generator tests passed
[PASS] REST API & Socket Event Validators passed
[PASS] Playback Synchronization Math & Frame Drift verified
[PASS] Bcrypt password hashing verified (cost factor 12)
[PASS] Password complexity requirements enforced (OWASP)
[PASS] Rate limiting policy (10 attempts / 10 min window) verified
[PASS] Input Sanitization & Anti-Injection verified
[PASS] Security Headers (Helmet, CSP, HSTS) verified
[PASS] Admin Route RBAC protection verified (403 Forbidden)
[PASS] User Authentication & Host defaults verified in MongoDB User collection
[PASS] Host Room Creation & RoomParticipant persistence verified
[PASS] Guest Joining Logic verified: Joiner is strictly Guest in DB
[PASS] Host Transfer & Permission handoff verified in DB and API
[PASS] Participant Removal & Moderation Logic verified
[PASS] Host Exit & Session Termination Lifecycle verified
```

### Frontend Code Quality:
```bash
# Run Oxlint on frontend source
npm run lint
```
Result: **0 warnings and 0 errors across 45 files.**

---

## Production Deployment

### Frontend (Vercel)
1. Import the repository into your Vercel Dashboard.
2. Set the **Root Directory** to `./` (or `frontend` depending on configuration).
3. The included `vercel.json` automatically routes all incoming paths (`/join`, `/room`, `/movies`, `/shows`) to `index.html`.
4. Configure environment variables (`VITE_BACKEND_URL`, `VITE_WS_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

### Backend (Render, Railway, or VPS)
1. Deploy the `backend/` directory as a Node.js service.
2. Build command: `npm install`
3. Start command: `npm start`
4. Provide the production `MONGODB_URI`, `CLIENT_URL` (your frontend domain), and `JWT_SECRET`.

---

## Security Highlights
* **Zero Host Spoofing**: Sockets and REST controllers perform server-side database lookups against the room's designated `hostId` before executing any play, pause, seek, or management operation.
* **Brute-Force Rate Limiting**: Authentication endpoints are rate-limited with HTTP 429 backoff protection.
* **Safe Eviction Flow**: Banned or removed participants have their IDs recorded in room blacklists; rejoining attempts automatically deny entry and trigger an eviction notice.

---

## License
This project is licensed under the MIT License - free for personal and commercial use.
