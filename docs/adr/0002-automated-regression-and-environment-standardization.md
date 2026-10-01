# ADR 0002: Automated Regression Foundation & Environment Standardization

## Status
Accepted

## Context
Phase 0 (`v0.3.0`) established the initial vertical slice (Health endpoint and Institution configuration) with manual verification. As Allocra transitions toward Phase 1 (Academic Domain Expansion: Departments, Programs, Terms, Groups), automated regression coverage and reproducible environment configurations are required to ensure the seed foundation remains stable and verifiable.

## Decisions

### 1. Test Framework & Runner
- Vitest was adopted across both `server` and `client` workspaces due to native ESM support, minimal configuration overhead, fast execution, and zero-tooling friction with Vite.
- Backend API tests use `supertest` with Express `app.js` (isolated from HTTP listener `server.js`).
- Backend domain persistence tests use `mongodb-memory-server` to execute in-memory MongoDB instances during automated testing without modifying live database instances.
- Frontend component tests use `@testing-library/react` with `jsdom` and mocked API client modules.

### 2. Environment Variable Standardization
- `MONGODB_URI` is designated as the canonical environment variable name for MongoDB connections across `.env.example` and runtime configuration.
- `MONGO_URI` is maintained as a fallback to preserve backward compatibility with existing developer environments.
- Safe validation fails gracefully with actionable diagnostic logs without exposing credentials.

### 3. Unified Root Scripts
- Root `package.json` provides unified scripts (`npm test`, `npm run test:server`, `npm run test:client`, `npm run dev:server`, `npm run dev:client`) allowing developers and CI to run tests in a single command.

## Consequences
- Regression safety is achieved across domain logic, API contracts, and UI states.
- No changes to existing API contracts (`GET /api/health`, `GET /api/institution`, `POST /api/institution`).
- Clean separation between test harnesses and production execution.
