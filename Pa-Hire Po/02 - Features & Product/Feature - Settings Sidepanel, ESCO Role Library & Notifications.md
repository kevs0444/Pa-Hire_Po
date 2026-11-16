---
type: feature
status: verified
priority: p0-now
area: product
milestone: v4-ux-polish
commit_ref: "a1059ca"
files:
  - src/features/settings/components/SettingsSidepanel.tsx
  - src/features/roles/lib/role-library.ts
  - src/app/api/roles/search/route.ts
  - src/features/notifications/components/NotificationBell.tsx
  - src/features/notifications/types.ts
  - src/components/ui/LoadingSpinner.tsx
  - src/features/changelog/components/ChangelogModal.tsx
  - src/features/changelog/data/changelog-data.ts
updated: 2026-11-16
tags:
  - pahirepo
  - feature
  - settings
  - notifications
---

# Feature — Settings Sidepanel, ESCO Role Library & Notifications

## Purpose & User Outcome
Centralizes user career preferences, cross-industry target role discovery, desktop installation instructions, real-time cross-tab feedback, and product changelog access without cluttering the main job feed.

## Sub-Features & Behavior
- **Right-Side Settings Sidepanel (`SettingsSidepanel.tsx`):**
  - **Personal Info & Contact:** Name, email, phone, location, portfolio/LinkedIn URLs.
  - **Target Salary & Work Setup:** Structured salary currency/range and Remote/Hybrid/Onsite preference.
  - **ESCO + Cross-Industry Dynamic Role Library (`/api/roles/search`, `role-library.ts`):** Searches both the local `CROSS_INDUSTRY_ROLE_CATALOG` and the European Skills, Competences, Qualifications and Occupations (ESCO) API (with `30m` `TtlCache`) so users can pick and prioritize **Top 5–10** target roles across any profession (`MAX_SAVED_TARGET_ROLES = 10`, `RECOMMENDED_TARGET_ROLES_MIN = 5`).
  - **Desktop App Download & Setup:** Guides end-users through 1-click PWA taskbar install (`manifest.ts`) and Windows `.exe` (`electron-builder.json`), with developer CLI commands collapsed behind a disclosure.
- **Real-Time Notification Bell (`NotificationBell.tsx`):**
  - Tracks saved jobs, application stage updates, tailored resume saves, and scan completions via **Supabase Realtime** + browser `BroadcastChannel`.
  - Houses **What's New** button opening `ChangelogModal.tsx`.
- **Accessible Database Feedback (`LoadingSpinner.tsx`):** Uses native `<progress>` indicators with tactile Civic confirmation states.

## Related Notes
- [[Architecture - Electron Desktop Shell & PWA]]
- [[Changelog Mirror]]
- [[Feature - Multi-Board Job Scraper Engine]]
