---
type: roadmap
status: active
priority: p0-now
area: product
milestone: roadmap
commit_ref: "a1059ca"
files:
  - src/features/auth/components/AuthScreen.tsx
  - src/server/services/job-search-service.ts
  - src/features/resume/components/A4ResumePreview.tsx
  - src/features/applications/components/ApplicationsCompilationView.tsx
updated: 2026-11-16
tags:
  - pahirepo
  - roadmap
  - p0-core
---

# Roadmap P0 — Core Function Polish & Public OAuth Launch

> **Top Priority:** Everything here strengthens the main core function and removes friction for public users.

## 1. Custom Domain & Public Google OAuth Publishing
- [ ] Acquire and bind a custom domain (e.g., `pahirepo.com`) to Vercel Production.
- [ ] Update Supabase **Site URL** and **Redirect URLs** allowlist to the custom domain.
- [ ] Register the custom domain in Google Cloud Console (`pa-hire-po`) and submit Google OAuth consent screen for **Production** verification (removing the 100-tester Testing Mode cap — see [[ADR-006 - Google OAuth Testing Mode Until Custom Domain]]).

## 2. Core Job Scraper & Scoring Reliability
- [ ] Monitor LinkedIn Guest API, JobStreet v5 API, and Indeed `ts-jobspy` parse success rates across `PH`, `MY`, `SG`, `ID`, and `remote`.
- [ ] Refine `resume-analyzer.ts` skill extraction and seniority detection so false-positive `senior-warning` or inflated scores stay rare.

## 3. Resume Studio & Applications Pipeline Fidelity
- [ ] Verify 1-page A4/Letter overflow ergonomics across all 5 ATS fonts (`Calibri`, `Helvetica`, `Garamond`, `Arial`, `Georgia`).
- [ ] Ensure every **Continue to [Board] & Mark Applied** action reliably links `tailored_resume_id` to `public.user_jobs` for 1-click inspection in [[Feature - Applications Compilation & Submitted Resume Modal]].

## Related Notes
- [[Product Strategy - Vision, Persona & Core Loop]]
- [[Active State & Progress Ledger]]
- [[Roadmap Tracker.base]]
