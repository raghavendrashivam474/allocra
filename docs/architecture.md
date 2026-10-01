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
- **Institution** (Identity and setup)
- **Academic Structure** (Departments and Programs matching the institution scope)
- **Resources** (Rooms, faculty, equipment)
- **Activities** (Lectures, labs)
- **Scheduling** (Timetable generation)
- **Constraints** (Rules and policies)
- **Data** (Persistence layer)

## Domain Models
- **Institution**: `name`, `academicYear`
- **Department**: `name`, `institutionId`
- **Program**: `name`, `departmentId`, `institutionId`

## Rules
- Domain logic must not depend directly on React, HTTP details, or MongoDB specifics.
- React communicates with domain only via the Express API.
- The server resolves global context (like active institution) rather than trusting frontend inputs.
- No speculative abstractions.
