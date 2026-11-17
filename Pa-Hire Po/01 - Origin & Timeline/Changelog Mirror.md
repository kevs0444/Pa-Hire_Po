---
type: timeline
status: active
priority: p0-now
area: product
milestone: v1.0.3
commit_ref: "497d282"
files:
  - CHANGELOG.md
  - package.json
  - src/features/changelog/data/changelog-data.ts
  - src/features/changelog/components/ChangelogModal.tsx
  - src/features/notifications/components/NotificationBell.tsx
updated: 2026-11-17
tags:
  - pahirepo
  - changelog
---

# Changelog Mirror

Mirrors day-based customer releases (`v1.0.0` → `v1.0.3`) from [`CHANGELOG.md`](file:///d:/Dev/Pa-Hire%20Po/CHANGELOG.md), surfaced inside the app via `ChangelogModal.tsx` from `NotificationBell.tsx` (`localStorage` read tracking via `pahirepo_seen_changelog_version`).

---

## `v1.0.3` — November 17, 2026 (`497d282` + Release Polish)
- **Direct In-Sheet Resume Editor, Formatting Toolbar & Versions Drawer:** Full in-sheet editing, Bold/Italic/Tool Tag wrapping, Justify vs. Left alignment, `ResizeObserver` zoom, and customizable version drawer (`ResumeVersionsDrawer.tsx`, `DeleteVersionConfirmDialog.tsx`). See [[Feature - Resume Studio AI & ATS Printing]].
- **1-Minute Auto-Refresh, Email OTP & Connected Logins:** Page-load + 60s auto-scan, 6-digit `verifyOtp` email signup, and Google/GitHub `linkIdentity` inside Settings. See [[Feature - Auth, Admin Control Center & Legal Compliance]].
- **Soft Grayscale UI & Session Security Hardening:** Wave 1–3 Civic contrast polish, zero-bypass Supabase GoTrue auth, OWASP security headers, and Admin 3-tab Control Center with live Vercel & Supabase status (`/api/admin/platform-status`). See [[Design - Ruthless UI Architect & Anti-AI-Slop Rules]].

---

## `v1.0.2` — November 16, 2026 (`22c463d`, `a1059ca`)
- **Live Notification Bell & What's New Modal:** Top-bar Bell tracks saved jobs, applications, tailored resumes, and scan results in real time (`Supabase Realtime` + `BroadcastChannel`) with `<progress>` loading indicators (`LoadingSpinner.tsx`). See [[Feature - Settings Sidepanel, ESCO Role Library & Notifications]].
- **Applied Companies & Pop-Out Submitted Resume:** `/applications` stage tracker (`Applied`, `Interviewing`, `Offer`, `Rejected`), personal notes, and `Show Resume` (`SubmittedResumeModal.tsx`). See [[Feature - Applications Compilation & Submitted Resume Modal]].
- **Global Job Role Library, Settings Sidepanel & Desktop App:** ESCO + cross-industry role search (`/api/roles/search`), Windows `.exe` (`electron-builder.json`), and PWA `manifest.ts`. See [[Architecture - Electron Desktop Shell & PWA]].

---

## `v1.0.1` — November 15, 2026 (`7ccfd61`–`44fd508`)
- **Pa-Hire Po Rebrand & Civic Career Utility:** Workspace Home `/`, 2-column Job Explorer, Market Analytics `/analytics`, Date Recency filters (`24h`/`7d`/`30d`), and Soft Grayscale Dark Mode. See [[Feature - 2-Column Job Explorer & Date Sorting]] and [[ADR-005 - Soft Grayscale Dark Mode Replacing Blue Dark Slate]].
- **Resume Studio AI, Top 5 ATS Fonts & Side-by-Side Diff:** Gemini 3.1 Flash-Lite tailoring, `Calibri`/`Helvetica`/`Garamond`/`Arial`/`Georgia` with `font-variant-ligatures: none`, and A4/Letter/Legal sizing. See [[Architecture - Gemini AI Pipeline & Anti-Hallucination Grounding]].
- **1k-User Cloud Auth, Profile Media & Legal Pages:** Supabase Postgres RLS (`muftcprpqnzuzfosvftz`), client-side canvas image compression, `/privacy`, and `/terms`. See [[Architecture - Supabase Schema, RLS & 1k-User Scale]].

---

## `v1.0.0` — November 14, 2026 (`41ce8d2`, `6077fc0`)
- **Initial Launch:** Concurrent 3-board job discovery (LinkedIn, JobStreet, Indeed), weighted `28–98%` match scoring, experience level analyzer, and assisted PDF resume preview. See [[Feature - Multi-Board Job Scraper Engine]] and [[Feature - Match Scorer & Experience Analyzer]].
