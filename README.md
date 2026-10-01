# Allocra

> Academic Timetable & Resource Allocation Engine

Allocra is an academic scheduling and allocation platform designed to automate and optimize course scheduling, room assignments, faculty allocations, and section constraints for educational institutions.

---

## Current Status: Phase 1 — S1.2 (`v1.2`)

- **Backend:** Node.js (ESM), Express, MongoDB / Mongoose
- **Frontend:** React 18, Vite
- **Testing:** Vitest, Supertest, MongoDB Memory Server, React Testing Library, jsdom
- **Current Slice:** Health Check, Institution Configuration, Academic Structure (Departments & Programs), Academic Context (Terms & Groups/Batches), automated regression test suite (64 tests).

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

Execute the full regression test suite (64 tests across backend & frontend):

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
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── api/                # API client modules (health, institution, academicStructure, academicContext)
│   │   ├── app/                # Root App component & styles
│   │   ├── features/           # Feature modules (institution, academic-structure, academic-context)
│   │   └── test/               # Frontend test setup
│   └── vite.config.js
├── server/                     # Backend (Express + Mongoose)
│   ├── controllers/            # Request handlers (institution, department, program, term, group)
│   ├── core/                   # Domain services (HTTP-agnostic)
│   │   └── institution/        # Institution, Academic Structure, Academic Context services
│   ├── data/                   # Models (Institution, Department, Program, Term, Group) & DB connection
│   ├── routes/                 # Express route definitions
│   ├── tests/                  # Automated backend test suite
│   ├── app.js                  # Express app setup
│   └── server.js               # Entry point & listener
├── docs/                       # Architecture documentation & ADRs
│   ├── architecture.md
│   └── adr/
│       ├── 0001-initial-module-boundaries.md
│       ├── 0002-automated-regression-and-environment-standardization.md
│       └── 0003-academic-structure-separate-collections.md
└── package.json                # Unified workspace scripts
```

## Architecture & API Boundaries

- **Route Layer** (`server/routes/`): Maps HTTP paths to controller handlers (/api/institution,
   /api/departments, /api/programs, /api/terms, /api/groups).
- **Controller Layer** (`server/controllers/`): Handles HTTP request parsing and response statuses.
- **Domain Service Layer** (`server/core/`): Houses business validation and relational integrity logic.
   Completely decoupled from HTTP request/response objects.
- **Data Layer** (`server/data/`): Mongoose schemas and database connection management.
- **Frontend Client** (`client/src/api/`): Pure fetch wrappers communicating with /api/* endpoints.

## Verification & Test Strategy

- **Backend Health Smoke Tests**: `server/tests/health.test.js`
- **Institution Domain & API Tests**: `server/tests/institution.test.js`
- **Department Domain & API Tests**: `server/tests/department.test.js`
- **Program Domain & API Tests**: `server/tests/program.test.js`
- **Term Domain & API Tests**: `server/tests/term.test.js`
- **Group Domain & API Tests**: `server/tests/group.test.js`
- **Frontend UI State Tests**:
  - `client/src/features/institution/InstitutionView.test.jsx`
  - `client/src/features/academic-structure/AcademicStructureView.test.jsx`
  - `client/src/features/academic-context/TermsAndGroupsView.test.jsx`