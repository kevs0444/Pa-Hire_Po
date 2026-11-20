---
type: feature
status: verified
priority: p0-now
area: applications
milestone: v1.0.5
commit_ref: "ce581df"
files:
  - src/app/applications/page.tsx
  - src/features/applications/components/ApplicationsCompilationView.tsx
  - src/features/applications/components/SubmittedResumeModal.tsx
  - src/components/layout/AppTopNavbar.tsx
  - src/features/home/components/LandingPageView.tsx
  - src/components/ui/CopyUrlButton.tsx
  - src/app/api/jobs/status/route.ts
  - src/app/api/resumes/history/route.ts
updated: 2026-11-20
tags:
  - pahirepo
  - feature
  - applications
  - job-tracking
---

# Feature — Job Tracking & Resume Applied (`SubmittedResumeModal`)

## Purpose & User Outcome
Gives job seekers a unified **Job Tracking** workspace (`/applications`) to track every company they applied to, inspect their **`Resume Applied`** sub-feature, log external applications with common company/job metadata and pasted URLs, copy company/job links in one click, and view or print the exact resume snapshot submitted for each role.

## Sub-Features & Behavior
- **Renamed Tab (`Job Tracking`) & Sub-Features:** Renamed *Applied & Resumes* across `AppTopNavbar.tsx`, `LandingPageView.tsx`, `HowItWorksModal.tsx`, and `ApplicationsCompilationView.tsx` to **Job Tracking** with four sub-views: **Applied Jobs**, **Resume Applied** (filterable by `All`, `✓ Applied`, and `Saved`), **Saved Jobs**, and **Hidden Jobs**.
- **Rich `+ Add Job Application` Form & URL Auto-Detect:** Captures Company/Job URL (with **Paste URL** button + automatic detection of `linkedin`/`jobstreet`/`indeed`, company name, and role title from URL slugs + **Copy URL**), Company Name, Job Title, Platform, Location, Work Setup, Salary/Offer, Stage, Date Applied, Resume Applied snapshot selector, and Notes.
- **Inline Application Editing & 1-Click `Copy URL`:** Edit Company/Job URL, Location, Work Setup, Salary, Application Stage (`Applied`, `Interviewing`, `✓ Offer Received`, `Closed / Rejected`), Linked Resume (`tailoredResumeId`), and Notes directly in the detail pane, and copy any application URL from cards, detail headers, or Saved Jobs via `CopyUrlButton.tsx`.
- **Immediate Status Flush Sync (`/api/jobs/status`):** Persists `status`, `url`, `location`, `work_type`, `salary`, `saved_at`, `applied_at`, `hidden_at`, `application_stage`, `application_notes`, and `tailored_resume_id` to `public.user_jobs`.
- **Submitted Resume Pop-Out (`SubmittedResumeModal.tsx`):** Native `<dialog>` modal (`useNativeDialog`) triggered via **Show Resume** rendering the exact snapshot stored in `public.tailored_resumes` (`/api/resumes/history`).

## Related Notes
- [[Feature - Resume Studio AI & ATS Printing]]
- [[Architecture - Supabase Schema, RLS & 1k-User Scale]]
- [[ADR-003 - Native HTML Dialog Over Div Overlays]]
