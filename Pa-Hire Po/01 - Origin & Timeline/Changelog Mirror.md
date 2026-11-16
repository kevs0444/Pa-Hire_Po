---
type: timeline
status: active
priority: p0-now
area: product
milestone: v4-ux-polish
commit_ref: "a1059ca"
files:
  - CHANGELOG.md
  - src/features/changelog/data/changelog-data.ts
  - src/features/changelog/components/ChangelogModal.tsx
updated: 2026-11-16
tags:
  - pahirepo
  - changelog
---

# Changelog Mirror

Mirrors customer-facing releases from [`CHANGELOG.md`](file:///d:/Dev/Pa-Hire%20Po/CHANGELOG.md), surfaced inside the app via `ChangelogModal.tsx` from the top-bar `NotificationBell`.

## November 16, 2026 (`22c463d`, `a1059ca`)

### Real-Time Activity Bell and Loading Feedback
- **Live Notification Bell:** Top-bar Bell tracks saved jobs, applications, tailored resumes, and job scan results in real time across open tabs (`Supabase Realtime` + `BroadcastChannel`).
- **Database Loading Indicators:** Accessible `<progress>` loading indicators (`LoadingSpinner.tsx`) and subtle confirmation feedback on account syncs.
- **What is New Changelog:** Accessible directly from the notification panel.
- See [[Feature - Settings Sidepanel, ESCO Role Library & Notifications]].

### Applied Companies and Resume Pop-Out Preview
- **Applied and Resumes Tab (`/applications`):** Track companies applied to, update stage (`Applied`, `Interviewing`, `Offer`, `Rejected`), and store personal notes.
- **Pop-Out Submitted Resume:** `Show Resume` opens `SubmittedResumeModal.tsx` (`<dialog>`) with only the exact resume sent, ready to print or re-edit.
- **Saved and Hidden Job Lists:** Persistent account storage via `public.user_jobs`.
- See [[Feature - Applications Compilation & Submitted Resume Modal]].

### Global Job Role Library, Settings Sidepanel, and Desktop App
- **Right-Side Settings Panel:** Edit personal contact details, target salary range, work setup, and preferred roles (`SettingsSidepanel.tsx`).
- **Searchable Job Role Library:** Pick and prioritize Top 5–10 roles across industries via ESCO + local catalog (`/api/roles/search`).
- **Desktop App Setup Guide:** Install via Windows `.exe` (`electron-builder.json`) or 1-click PWA (`src/app/manifest.ts`).
- See [[Architecture - Electron Desktop Shell & PWA]].
