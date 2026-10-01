# ADR-0003: Academic Structure as Separate Domain Collections

## Status
Accepted

## Context
Sprint S1.1 introduces the Academic Structure vertical slice: Departments and Programs belonging to an Institution. We needed to decide how to model these relationships in MongoDB.

## Problem
The Institution document currently holds only `name` and `academicYear`. Adding Departments and Programs as embedded arrays inside the Institution document would couple the academic structure lifecycle to the institution configuration lifecycle and risk growing the Institution aggregate beyond its original bounded responsibility.

## Options Considered

### A. Embed departments and programs inside the Institution document
- Simple reads, single-document queries.
- Violates the Phase 0 decision to keep Institution minimal.
- Creates a large aggregate as the system grows.

### B. Separate Department and Program collections with ObjectId references
- Keeps Institution bounded to identity/setup.
- Explicit domain boundaries matching the modular-monolith convention.
- Requires join-like queries (Mongoose `populate`) for programs.

### C. Generic academic entity collection with type discriminators
- Over-engineered for two known concepts.
- Introduces abstraction with no current consumer.

## Decision
**Option B.** Department and Program are separate Mongoose models in their own collections, linked to Institution and to each other via `ObjectId` references.

## Why This Decision
- Preserves the Phase 0 Institution contract (`name`, `academicYear`) unchanged.
- Follows the existing modular-monolith dependency direction.
- Keeps domain services explicit and testable in isolation.
- Avoids speculative generic abstractions.

## Consequences
- `Department` requires `institutionId` (resolved server-side from the active Institution).
- `Program` requires `departmentId` and inherits `institutionId` from its parent Department.
- Program creation must validate that the referenced Department exists (404 if not).
- Frontend does not construct relationship IDs; the backend owns all linking logic.

## Compatibility
- No migration needed. Phase 0 Institution documents remain unchanged.
- New collections (`departments`, `programs`) are created automatically by Mongoose on first write.
