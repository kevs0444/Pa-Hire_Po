---
type: roadmap
status: backlog
priority: p2-later
area: infra
milestone: roadmap
commit_ref: "a1059ca"
files:
  - src/app/manifest.ts
  - package.json
updated: 2026-11-16
tags:
  - pahirepo
  - roadmap
  - backlog
  - testing
  - mobile
---

# Roadmap P2 — Mobile PWA Push & Automated E2E Testing

> **Priority Note:** Deferred (`p2-later` / `backlog`) after core function stability and custom domain OAuth launch.

## Scope Ideas (When Ready)
- **Automated Testing & CI/CD Gates:**
  - Unit tests (`Vitest`) for `scoreJobAgainstProfile`, `extractExperienceRequirement`, `job-date-utils.ts`, `pruneJobsForFreeTier`, and `tailorResumeLocally`.
  - E2E tests (`Playwright`) covering `/login`, `/jobs` filtering/sorting, Resume Studio `<dialog>` flow, and `/applications` status updates via GitHub Actions.
- **Mobile PWA & Digest Notifications:**
  - Offline-cached Saved Jobs reading view + optional daily push/email digests for high-match (`>= 80%`) new postings.

## Related Notes
- [[Architecture - Electron Desktop Shell & PWA]]
- [[Roadmap P0 - Core Function Polish & Public OAuth Launch]]
