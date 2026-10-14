# Allocra — UX Contract & Safe UI Foundation
**Document Version:** 1.0.0  
**Established:** UX-0 Sprint  
**Target Scope:** Phase 3+ Feature Development

---

## 1. Core Interaction Principles

Allocra is an academic coordination and allocation engine designed to make institutional operations clear, predictable, and maintainable. All UI components and user journeys must adhere to the following six principles:

### 1. Action over Navigation
When a finding or validation error can be resolved through a supported operation, provide the direct action or link close to where the issue is reported. Do not require users to navigate through multiple disconnected sub-menus.

### 2. Context over Memorization
Display relevant relationships, parent entities, constraints, and counts alongside the active entity (e.g. show group name and eligible resource counts directly on activity cards).

### 3. Guided when Needed, Open when Preferred
Provide step-by-step guidance for incomplete initial setups (via Setup Workspace and Validation Workspace), while leaving dedicated workspaces accessible for experienced users to make direct edits.

### 4. Prevention over Correction
Validate inputs early and leverage authoritative backend validation (`/api/activities/validation`) before triggering irreversible scheduling operations. Never use frontend-only guesswork for business rules.

### 5. Honest System State
Clearly differentiate between live persistent state, missing required configuration, advisory warnings, and background operations. Never mock or fabricate success states.

### 6. Progressive Complexity
Keep everyday review workflows simple and glanceable. Introduce advanced multi-resource filtering and complex constraint toggles only where they deliver concrete value.

---

## 2. User Journeys

### A. Coordinator Journey (Readiness Evaluation & Issue Resolution)
1. **Discovery:** Coordinator opens Allocra, views the header status, and navigates to the **Validation Workspace** or **Setup Workspace**.
2. **Diagnosis:** Coordinator inspects the readiness banner and structured finding cards. Each finding clearly communicates its severity (Error, Warning, Info) and explains what is missing (e.g. "No eligible faculty members configured").
3. **Resolution:** Coordinator clicks the contextual action button (e.g. `Configure Resources`) directly on the finding card, which routes them to the relevant management workspace.
4. **Execution:** Coordinator checks the required faculty/rooms in the Resource Configuration drawer/card and clicks `Save Relationships`.
5. **Verification:** Coordinator returns to the Validation Workspace, clicks `Re-check`, and verifies that the valid activity count increments and the status transitions to `Configuration Ready`.

### B. Faculty Journey (Future Phase — Prerequisites & Intended Experience)
- **Current State:** In Phase 2/UX-0, faculty records exist only as allocatable resources managed by institutional coordinators. No dedicated faculty authentication, personal profile view, or timetable subscriptions exist yet.
- **Intended Experience:** Once authentication and schedule publication capabilities are built in subsequent Phase 3+ sprints, faculty members will have a read-focused personal view displaying:
  - Personal assigned teaching activities and group assignments
  - Allocated room locations and weekly schedule grids
  - Contact/department context
- **Constraints:** Do not fabricate mock login screens, placeholder calendars, or unauthenticated faculty dashboards until identity and allocation APIs exist.

---

## 3. Visual & Interaction Conventions

### Typography & Hierarchy
- **Font Family:** `-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif`
- **Page Titles:** `PageHeader` component (`<h1>`, 20px / 1.25rem, 700 weight)
- **Card/Section Headers:** `<h2>` / `<h3>` (15–18px, 600 weight)
- **Body Text:** 14px, `line-height: 1.5`, color `var(--color-text-secondary)` (#475569)
- **Meta / Badges:** 11–12px, uppercase tracking for labels, 500–600 weight

### Spacing & Grid System
- Standard spacing tokens: `--space-xs` (4px), `--space-sm` (8px), `--space-md` (16px), `--space-lg` (24px), `--space-xl` (32px)
- Content wrapper: `.allocra-content` (`max-width: 1200px`, `margin: 0 auto`, responsive padding)
- Grid layout: `setup-grid` (`repeat(auto-fill, minmax(280px, 1fr))`, gap 16px)

### Feedback & Status Tokens
- **Error:** `var(--color-danger)` (#ef4444), `.alert-error`, `.finding-error` (red border-left)
- **Warning:** `var(--color-warning)` (#f59e0b), `.alert-warning`, `.finding-warning` (amber border-left)
- **Success:** `var(--color-success)` (#10b981), `.alert-success`, `.badge-complete`
- **Info:** `var(--color-info)` (#0284c7), `.alert-info`, `.finding-info` (blue border-left)

### Accessibility Standards
- **Skip Link:** Always maintain `.skip-link` at top of DOM for direct jump to `#main-content`.
- **Keyboard Focus:** Visible outline via `var(--focus-ring)` (`0 0 0 3px rgba(67, 56, 202, 0.2)`).
- **Semantics:** Color must never be the sole differentiator; pair semantic colors with clear text labels and icons (`?`, `?`, `?`, `?`).
