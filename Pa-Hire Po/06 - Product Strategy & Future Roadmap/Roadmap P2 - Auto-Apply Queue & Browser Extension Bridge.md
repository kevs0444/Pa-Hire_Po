---
type: roadmap
status: backlog
priority: p2-later
area: jobs
milestone: roadmap
commit_ref: "7ccfd61"
files:
  - src/features/auto-apply/components/AutoApplyBlueprintPanel.tsx
updated: 2026-11-16
tags:
  - pahirepo
  - roadmap
  - backlog
  - auto-apply
---

# Roadmap P2 — Auto-Apply Queue & Browser Extension Bridge

> **Priority Note:** Deferred (`p2-later` / `backlog`) until core discovery, tailoring, and tracking are rock-solid.

## Strategic Why
Reduce repetitive form-filling on external ATS portals (Workday, Greenhouse, Lever, JobStreet, LinkedIn Easy Apply) using the user's already-saved screening answers and tailored resume snapshots.

## Scope Ideas (When Ready)
- **Assisted Auto-Apply Queue:** Batch-walk queued jobs (`queued_job_ids`) with pre-copied screening answers (`expectedSalary`, `noticePeriod`, `workAuthorization`, `relocation`).
- **Browser Extension Bridge (Chrome / Edge):** Optional lightweight companion extension syncing active job tabs directly to `/api/jobs/status` and auto-filling candidate fields from `user_profiles.profile_data` (always requiring explicit user review/submit — never blind spam).

## Non-Goals / Guardrails
- No headless CAPTCHA solving or automated Terms-of-Service evasion.

## Related Notes
- [[Feature - Job Market Analytics & Screening Queue]]
- [[Roadmap P0 - Core Function Polish & Public OAuth Launch]]
