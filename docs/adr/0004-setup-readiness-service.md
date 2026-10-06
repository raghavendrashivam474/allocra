# ADR-0004: Setup Readiness Service

## Context
S1.5 needs to aggregate configuration state from multiple
institution modules (Academic Structure, Terms/Groups,
Calendar, Time Model) to determine Phase-1 readiness.

## Problem
Without a dedicated orchestration point, readiness logic
would be duplicated in controllers or pushed into the
frontend, violating separation of concerns.

## Decision
Introduce a small read-only setup readiness service at
`server/core/institution/setup/setupReadinessService.js`.

The service queries existing Mongoose models directly
(read-only) rather than calling domain service methods,
because readiness is a cross-cutting inspection concern,
not a domain mutation.

No new MongoDB collection is created. Readiness is derived
from existing documents at query time.

## Alternatives Considered
1. **Frontend-only readiness**: Rejected — readiness is a
   server-side concern and should be authoritative.
2. **Calling each domain service**: Rejected — services are
   mutation-oriented; readiness is read-only inspection.
3. **Persisted readiness document**: Rejected — readiness is
   derived state; persisting it creates sync problems.

## Consequences
- Adds one domain service and one API endpoint.
- No new persistence layer.
- Existing module boundaries remain unchanged.
- Readiness is always consistent with actual data.
