# Allocra

> Academic Timetable & Resource Allocation Engine

Allocra is an academic scheduling and allocation platform designed to automate and optimize course scheduling, room assignments, faculty allocations, and section constraints for educational institutions.

---

## Current Status: Phase 1 — S1.1 (`v0.4.0`)

- **Backend:** Node.js (ESM), Express, MongoDB / Mongoose
- **Frontend:** React 18, Vite
- **Testing:** Vitest, Supertest, MongoDB Memory Server, React Testing Library, jsdom
- **Current Slice:** Health Check, Institution Configuration, Academic Structure (Departments & Programs), automated regression test suite.

---

## Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **MongoDB**: MongoDB Atlas URI or local MongoDB instance (`mongodb://localhost:27017/allocra`)

---

## Quickstart

### 1. Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 2. Configure Environment

Copy the sample environment file to server/.env:

```Bash
cp server/.env.example server/.env
```
Edit server/.env with your MongoDB connection string:

```env

PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/allocra?retryWrites=true&w=majority
```

### 3. Run Automated Tests

Execute the full regression test suite (38 tests across backend & frontend):

```Bash
npm test
```
Or run individually:

```Bash
npm run test:server
npm run test:client
```

### 4. Start Development Servers

In two separate terminals:

#### Terminal 1 (Backend):

```Bash
npm run dev:server
# Server runs on http://localhost:5000
```
#### Terminal 2 (Frontend):

```Bash
npm run dev:client
# Client runs on http://localhost:5173
Open http://localhost:5173 in your browser.
```

## Project Structure

```text
allocra/
â”œâ”€â”€ client/                     # Frontend (React + Vite)
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ api/                # API client modules
â”‚   â”‚   â”œâ”€â”€ app/                # Root App component & styles
â”‚   â”‚   â”œâ”€â”€ features/           # Feature modules (institution)
â”‚   â”‚   â””â”€â”€ test/               # Frontend test setup
â”‚   â””â”€â”€ vite.config.js
â”œâ”€â”€ server/                     # Backend (Express + Mongoose)
â”‚   â”œâ”€â”€ controllers/            # Request handlers
â”‚   â”œâ”€â”€ core/                   # Domain services (HTTP-agnostic)
â”‚   â”œâ”€â”€ data/                   # Models & database connection
â”‚   â”œâ”€â”€ routes/                 # Express route definitions
â”‚   â”œâ”€â”€ tests/                  # Automated backend test suite
â”‚   â”œâ”€â”€ app.js                  # Express app setup
â”‚   â””â”€â”€ server.js               # Entry point & listener
â”œâ”€â”€ docs/                       # Architecture documentation & ADRs
â”‚   â”œâ”€â”€ architecture.md
â”‚   â””â”€â”€ adr/
â”‚       â”œâ”€â”€ 0001-initial-module-boundaries.md
â”‚       â””â”€â”€ 0002-automated-regression-and-environment-standardization.md
â””â”€â”€ package.json                # Unified workspace scripts
```

## Architecture & API Boundaries

- **Route Layer** (`server/routes/`): Maps HTTP paths to controller handlers.
- **Controller Layer**(`server/controllers/`): Handles HTTP request parsing and response statuses.
- **Domain Service Layer** (`server/core/`): Houses business validation and logic. Completely decoupled 
   from HTTP request/response objects.
- **Data Layer** (`server/data/`): Mongoose schemas and database connection management.
- **Frontend Client** (`client/src/api/`): Pure fetch wrappers communicating with /api/* endpoints.

## Verification & Test Strategy

- **Backend Health Smoke Tests**: server/tests/health.test.js
- **Institution Domain & API Tests**: server/tests/institution.test.js (isolated via in-memory MongoDB)
- **Frontend UI State Tests**: client/src/features/institution/InstitutionView.test.jsx (Empty, Form, Configured states)

