# Allocra Architecture

## Product Identity
Allocra — Configurable, constraint-aware resource allocation and scheduling platform.

## Initial Domain
College academic timetable generation.

## Architectural Style
Minimal Evolvable Modular Monolith.

## Dependency Direction
React UI -> Express API -> Domain Modules -> Data / Persistence -> MongoDB

## Initial Boundaries
- Institution (Identity and setup)
- Resources (Rooms, faculty, equipment)
- Activities (Lectures, labs)
- Scheduling (Timetable generation)
- Constraints (Rules and policies)
- Data (Persistence layer)

## Rules
- Domain logic must not depend directly on React, HTTP details, or MongoDB specifics.
- React communicates with domain only via the Express API.
- No speculative abstractions.
