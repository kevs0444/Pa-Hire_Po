---
type: feature
status: verified
priority: p0-now
area: applications
milestone: v4-ux-polish
commit_ref: "a1059ca"
files:
  - src/app/applications/page.tsx
  - src/features/applications/components/ApplicationsCompilationView.tsx
  - src/features/applications/components/SubmittedResumeModal.tsx
  - src/app/api/jobs/status/route.ts
  - src/app/api/resumes/history/route.ts
updated: 2026-11-16
tags:
  - pahirepo
  - feature
  - applications
---

# Feature — Applications Compilation & Submitted Resume Modal

## Purpose & User Outcome
Gives job seekers a dedicated command view (`/applications`) to track every company they applied to, record interview progression, log external applications, and inspect the exact resume snapshot sent for each application.

## Sub-Features & Behavior
- **Immediate Status Flush Sync (`/api/jobs/status`):** Saving, applying, or hiding a job immediately persists `status`, `saved_at`, `applied_at`, `hidden_at`, `application_stage`, `application_notes`, and `tailored_resume_id` to `public.user_jobs`.
- **Stage Pipeline Tracking:** Update applications across `Applied`, `Interviewing`, `Offer`, and `Rejected` with persistent company-specific notes.
- **External Application Logger:** Log applications submitted outside the 3 scraped boards cleanly into the compilation view.
- **Submitted Resume Pop-Out (`SubmittedResumeModal.tsx`):**
  - Native `<dialog>` modal (`useNativeDialog`) triggered via **Show Resume**.
  - Renders **only** the exact tailored or edited resume snapshot stored in `public.tailored_resumes` (`/api/resumes/history`), ready to print or re-open in Resume Studio.
- **Saved & Hidden Lists:** Persistent tabs/lists so saved bookmarks and hidden roles survive refreshes and cross-device logins, with non-destructive free-tier pruning.

## Related Notes
- [[Feature - Resume Studio AI & ATS Printing]]
- [[Architecture - Supabase Schema, RLS & 1k-User Scale]]
- [[ADR-003 - Native HTML Dialog Over Div Overlays]]
