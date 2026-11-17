---
date: 2026-11-17
status: implemented
area: admin-infra
---

# Design Spec — Admin Control Center Restructure & Live Vercel/Supabase Status

## Intent & Problem
`AdminDashboardView.tsx` had grown into a single-column vertical stack with duplicated controls (`Refresh` + `Check`, two setup modal triggers), stale hardcoded labels (`supabase-erin-elephant`), nested card-in-card boxes inside `AdminFreeTierCard.tsx`, and zero visibility into **Vercel Hobby** runtime/status or global **Vercel/Supabase** incidents.

## Aligned Decisions
1. **Live App Health + Global Status Pages (Zero-Token Default):**
   - `GET /api/admin/platform-status` (admin-only, 60s cache + `?force=1`, rate-limited 30/min) probes Supabase **Auth (GoTrue)**, **Postgres DB & RLS**, and **Storage (`resumes`)** latency, reads Vercel runtime/git/cron env (`VERCEL_ENV`, `VERCEL_REGION`, `VERCEL_GIT_COMMIT_*`, `0 8 */4 * *`), optionally enriches from `VERCEL_TOKEN` if present, and fetches `vercel-status.com` + `status.supabase.com` `/api/v2/summary.json` with a 4s timeout and offline fallback.
2. **3-Tab Accessible Workspace Architecture (`Overview` | `Users` | `Infrastructure & Free-Tier`):**
   - Single-row accessible `tablist` (`focusgroup="tablist nomemory"` + arrow/Home/End keyboard roving + WCAG 1.4.1 `border-block-end` underline indicator).
   - **Overview Tab:** Unified 5-column hairline-divided KPI ledger strip, side-by-side **Vercel Status** and **Supabase Status** cards, and MOC-aligned **P0 Launch Readiness** strip.
   - **Users Tab:** `<search>` landmark + role filter group + `.admin-table-wrapper` (`container-type: inline-size`) with `@container (width < 640px)` stacked mobile cards (`data-label`) and WCAG 2.5.3 disambiguated action `aria-label`s.
   - **Infrastructure & Free-Tier Tab:** Refactored hairline-divided `AdminFreeTierCard`, **Vercel Hobby Tier Guardrails**, and **Supabase 5-Step Setup Diagnostics**.
3. **Anti-AI-Slop & Token Discipline:**
   - Replaced hardcoded `emerald-*` / `red-*` / `#0a66c2` classes with `getThemeTokens(theme)` (`badgeSuccess`, `badgeWarning`, `badgeDanger`, `badgeNeutral`, `badgeAccent`, `barTrack`, `barFill`).

## Approaches Considered
- **Compact 3-Tab Console (Selected):** Keeps each admin job focused, eliminates scroll bloat, and isolates user moderation from infra diagnostics.
- **Single Scrollable Cockpit (Rejected):** Kept redundant vertical scrolling between infra setup and user lookup.
- **Left-Rail Console (Rejected):** Added layout complexity on narrow viewports without meaningful gain for 3 sections.
