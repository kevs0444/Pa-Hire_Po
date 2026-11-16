---
type: feature
status: verified
priority: p0-now
area: jobs
milestone: v2-rebrand
commit_ref: "e7e1b0b"
files:
  - src/app/jobs/page.tsx
  - src/components/PleaseHireMeDashboard.tsx
  - src/features/jobs/components/JobDetailPane.tsx
  - src/features/jobs/lib/job-date-utils.ts
  - src/components/ui/BrandLogos.tsx
updated: 2026-11-16
tags:
  - pahirepo
  - feature
  - explorer
---

# Feature — 2-Column Job Explorer & Date Sorting

## Purpose & User Outcome
Delivers a high-speed LinkedIn × JobStreet split-pane job evaluation workspace (`/jobs`) with instant date recency filtering, multi-strategy sorting, and persistent status actions.

## Sub-Features & Behavior
- **Master-Detail 2-Column Layout:**
  - **Left Feed (`lg:col-span-5`):** Scannable `rounded-lg` job cards with `border-l-[3px]` active selection indicator, authentic `BoardLogo` SVG (`#0A66C2` LinkedIn, `#0D3880` JobStreet SEEK, `#003A9B` Indeed), company, location, salary, experience badge, recency badge (`Clock` + `formatJobDateLabel`), and `✓` high-match pill (`>= 75%`).
  - **Right Inspector (`JobDetailPane`):** Single-surface reading panel separated by hairline dividers, showing `MatchScoreRing`, experience rationale, `✓` matched vs `+` missing skills, full description, and Save / Hide / Tailor & Apply actions.
- **Date Recency Filter (`dateFilter`):** Instant client-side filtering across `All Dates`, `Past 24 Hours / Today` (`24h`), `Past Week` (`7d`), and `Past Month` (`30d`) without clearing cached scans.
- **Multi-Strategy Sorting (`sortBy`):**
  - `Best Match` (score descending, secondary recency)
  - `Newest First` (latest to past)
  - `Oldest First` (past to latest)
  - Fallback listings (`isFallback`) stay deprioritized beneath live listings.
- **Cross-Board Date Normalization (`job-date-utils.ts`):** Unifies ISO timestamps (`YYYY-MM-DD`) and relative strings (`1h ago`, `2d ago`, `30d+ ago`) with SSR-safe hydration and `discoveredAt` fallback.
- **Multi-Faceted Filters:** Status (`All Active`, `Saved`, `Applied`, `Hidden`), Board (`All Sites`, `LinkedIn`, `JobStreet`, `Indeed`), **Applicable Exp Only** (`fitFilter`), keyword search, and minimum match score slider (`0–80%`).

## Related Notes
- [[Feature - Match Scorer & Experience Analyzer]]
- [[Feature - Applications Compilation & Submitted Resume Modal]]
- [[Specs & Plans Archive Index]]
