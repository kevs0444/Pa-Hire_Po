---
type: feature
status: verified
priority: p0-now
area: analytics
milestone: v1-pleasehireme
commit_ref: "7ccfd61"
files:
  - src/app/analytics/page.tsx
  - src/features/analytics/components/JobAnalyticsView.tsx
  - src/features/auto-apply/components/AutoApplyBlueprintPanel.tsx
  - src/features/auto-apply/types.ts
updated: 2026-11-16
tags:
  - pahirepo
  - feature
  - analytics
---

# Feature — Job Market Analytics & Screening Queue

## Purpose & User Outcome
Turns raw scraped job feeds into actionable market intelligence (`/analytics`), highlighting skill gaps that immediately improve match scores and organizing screening answers for queued applications.

## Sub-Features & Behavior
- **Top KPI Summary Cards:** Tabular monospace (`font-mono tabular-nums`) counters for **Total Active Jobs**, **Applicable Exp Fit**, **Average Match Score**, and **Pipeline Actions**.
- **Per-Board Breakdown (`JobStreet`, `LinkedIn`, `Indeed`):** Job count, market share progress bar, average match %, clickable top match, and quick jump to filtered `/jobs`.
- **Experience Level & Work Setup Distributions:** Breakdown across `Fits Your Level`, `Slight Stretch`, `Senior Warning`, and `Remote` / `Hybrid` / `Onsite`.
- **Top 12 Requested Skills & 1-Click Sync:** Ranks the most frequently requested skills across active listings and offers 1-click `+ Add Skill` directly to the user's profile with instant job rescoring.
- **Per-User Screening Answers & Queue (`AutoApplyBlueprintPanel.tsx`):** Stores expected salary, notice period, work authorization, relocation preference, and queue actions (`Queue Top 3 Matches`, `Launch Assisted Apply`).

## Related Notes
- [[Feature - Match Scorer & Experience Analyzer]]
- [[Roadmap P2 - Auto-Apply Queue & Browser Extension Bridge]]
