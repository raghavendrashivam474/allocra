# ADR-0001: Initial Module Boundaries

## Context
Allocra needs a clear modular structure from day one without over-engineering into microservices.

## Decision
Establish initial module boundaries (Institution, Resources, Activities, Scheduling, Constraints, Data) inside a single modular monolith.

## Reason
Enables clean domain isolation while keeping development and deployment simple for Phase 0.

## Consequences
All modules live in the same codebase and run in one Node.js process. Modules can be extracted or evolved independently later.
