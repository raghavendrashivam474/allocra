# Allocra Architecture

## Product Identity
Allocra is a Configurable, constraint-aware resource allocation and scheduling platform.

## Initial Domain
College academic timetable generation.

## Architectural Style
Minimal Evolvable Modular Monolith.

## Dependency Direction
React UI -> Express API -> Domain Modules -> Data / Persistence -> MongoDB

## Initial Boundaries
- **Institution** (Identity and setup)
- **Academic Structure** (Departments and Programs matching the institution scope)
- **Academic Context** (Terms and Groups/Batches linked to Programs and Terms)
- **Calendar** (Working days available for scheduling at the institution scope)
- **Resources** (Rooms, faculty, equipment)
- **Activities** (Lectures, labs)
- **Scheduling** (Timetable generation)
- **Constraints** (Rules and policies)
- **Data** (Persistence layer)

## Domain Models
- **Institution**: `name`, `academicYear`
- **Department**: `name`, `institutionId`
- **Program**: `name`, `departmentId`, `institutionId`
- **Term**: `name`, `academicYear`, `institutionId`
- **Group**: `name`, `programId`, `termId`, `institutionId`
- **Calendar**: `institutionId`, `workingDays`

## Rules
- Domain logic must not depend directly on React, HTTP details, or MongoDB specifics.
- React communicates with domain only via the Express API.
- The server resolves global context (like active institution) rather than trusting frontend inputs.
- No speculative abstractions.


## S1.4 Time Model Architecture

### Domain Concepts & Semantics
- **Time Model:** The core daily scheduling skeleton of an Institution. It serves as standard operating template for a typical working day.
- **Period:** An active teaching, examination, or primary activity interval (e.g., \9:00 - 09:50\).
- **Break:** A non-teaching interval (e.g., \10:40 - 11:00\) representing lunch, recess, or standard transit.
- **Time Slot:** A schedulable slice of time, logically computed as a combination of \Working Day (from Calendar) + Daily Interval (from Time Model)\. S1.4 models daily structures; slot allocations belong to later phases.

### Persistence Boundary
A single **TimeModel** collection is maintained:
- **Collection:** \	imemodels\
- **Cardinality:** 1:1 relation with an \Institution\ (referenced via unique index \institutionId\).
- **Storage Strategy:** Nested document schema containing embedded arrays for \periods\ and \breaks\. This guarantees complete atomic state saves (no partial-update failures).

\\\json
{
  "_id": "64b0f92b...",
  "institutionId": "64b0f80a...",
  "periods": [
    { "name": "Period 1", "startTime": "09:00", "endTime": "09:50" },
    { "name": "Period 2", "startTime": "09:50", "endTime": "10:40" }
  ],
  "breaks": [
    { "name": "Break", "startTime": "10:40", "endTime": "11:00" }
  ],
  "createdAt": "2026-03-31T...",
  "updatedAt": "2026-03-31T..."
}
\\\

### Invariants & Validation Rules
1. **Time Format:** Strict 24-hour \HH:mm\ validation.
2. **Positive Interval Duration:** \startTime\ must be strictly before \endTime\ (\startTime < endTime\). Equal or reversed boundaries are rejected.
3. **No Overlaps:** Combined sorting of periods and breaks is done to verify that no interval begins before its predecessor concludes (\curr.startTime >= prev.endTime\). Overlap details are explicitly bubbled back to the client.
4. **Boundary Touching Allowed:** Touching boundaries (\curr.startTime === prev.endTime\) are completely valid, allowing contiguous periods or direct hand-offs.

### API Specifications
- **GET** \/api/time-model\ — Fetches the active time model configuration envelope (\{ timeModel: null | Document }\).
- **PUT** \/api/time-model\ — Accepts body \{ periods: [...], breaks: [...] }\. Sanitizes, validates, sorts intervals, atomically updates or inserts (upsert) the database record, and returns the updated document.
