---
type: moc
status: active
priority: p0-now
area: infra
milestone: v1.0.4
commit_ref: "ce581df"
files:
  - context.md
  - package.json
  - vercel.json
updated: 2026-11-18
tags:
  - pahirepo
  - ledger
  - status
---

# Active State & Progress Ledger

## Current Operational Snapshot

| Dimension | Current Value |
|---|---|
| **App Name / Package** | `pa-hire-po` (`1.0.4` — day-based releases `v1.0.0` → `v1.0.4`) |
| **Framework** | Next.js `16.4.6` (App Router, Turbopack), React `19.3.0`, Tailwind CSS `4.3.3` |
| **Desktop Shell** | Electron `45.3.2` + `electron-builder` (NSIS + Portable `.exe`) + PWA `manifest.ts` |
| **Database & Auth** | Supabase (`Pa-Hire Po`, ref `muftcprpqnzuzfosvftz`), RLS enabled |
| **AI Model** | `gemini-3.1-flash-lite` → `gemini-flash-lite-latest` → `gemini-2.5-flash` → local fallback |
| **Email Templates Catalog** | 13 Civic Career Utility Templates (6 Auth + 7 Security alerts) in `supabase/email-templates/` & Step 3 Admin Dialog |
| **Latest Verified Commit** | `c92d9f1` (`feat(release): v1.0.3 admin status console, full v1.0.0-v1.0.3 changelog, notification sync, and MOC rules`) — live on Vercel production |
| **Production URL** | `https://pa-hire-po.vercel.app` |

---

## Verified Routes & API Endpoints

### Pages
- `/` — Workspace Home (`src/app/page.tsx`)
- `/jobs` — 2-Column Job Explorer (`src/app/jobs/page.tsx`)
- `/analytics` — Job Market Analytics (`src/app/analytics/page.tsx`)
- `/applications` — Applied Companies & Submitted Resumes (`src/app/applications/page.tsx`)
- `/admin` — Admin Control Center & Supabase Diagnostics (`src/app/admin/page.tsx`)
- `/login` — Clean Auth Surface (`src/app/login/page.tsx`)
- `/privacy` — Privacy Policy (`src/app/privacy/page.tsx`)
- `/terms` — Terms of Service (`src/app/terms/page.tsx`)

### API Routes (12 Total)
- `POST /api/jobs/search` — Concurrent 3-board scraping + rate limit + 90s TTL cache
- `POST /api/jobs/status` — Persistent `saved`/`applied`/`hidden` + stage/notes updates
- `POST /api/resume/tailor` — Gemini 3.1 Flash-Lite tailoring + local fallback
- `POST /api/resume/parse` — `.pdf`/`.txt`/`.md`/`.json` CV parser
- `GET|POST /api/resumes/history` — `public.tailored_resumes` snapshots & sent history
- `GET /api/roles/search` — ESCO API + cross-industry catalog search
- `GET|POST /api/state` — Full user workspace state hydrate & sync
- `GET /api/admin/users` & `PATCH|DELETE /api/admin/users/[userId]` — Admin directory & moderation
- `GET /api/admin/platform-status` — Admin-only live Vercel Hobby & Supabase Free-Tier probes + global status feeds (60s cache)
- `GET /api/supabase/keepalive` — Vercel Cron (`0 8 */4 * *`) keeping free-tier Postgres warm
- `GET|POST /api/supabase/setup` — Health probe & auth provider status

---

## Active Sprint Focus (Core Utility First)

- [x] Persistent `saved` / `applied` / `hidden` sync in `public.user_jobs` (hardened against React 19 deferred updaters & debounced overwrite races)
- [x] Applied & Resumes Compilation workspace + `SubmittedResumeModal` pop-out
- [x] Real-time `NotificationBell`, `<progress>` `LoadingSpinner`, and `ChangelogModal`
- [x] Obsidian Second Brain setup (`Pa-Hire Po/`) + Dual-Sync protocol
- [x] 1-Minute Default & Page-Load Auto-Refresh + Hidden Manual Refresh Button
- [x] Public Auth Surface Lockdown: Removed passwordless Admin bypass from `/login`
- [x] Email OTP Signup Verification (`verifyOtp` with 6-digit code)
- [x] Settings → Connected Logins: Multi-provider linking (Google, GitHub) via `linkIdentity`
- [x] Mobile-responsive Multi-Board Filter Bar & Top Nav layout (375px+)
- [x] Server Gemini Key isolation: strictly private to owner, hidden from public/non-admin
- [x] 13 Civic Auth & Security Email Templates in `supabase/email-templates/` and Step 3 Admin Dialog with category filter pills and 1-click copy
- [x] Fully Editable Resume Studio in-sheet + Google Docs/MS Word style text formatting (Justify vs Left alignment, live Bold/Italic/Code wrapping) + Versions Drawer with customizable naming & native `<dialog>` deletion confirmation + `getThemeTokens(theme)` text-contrast unification, `color-scheme: only light` paper isolation, and `ResizeObserver` symmetric scaling
- [x] Ruthless UI Architect & Anti-AI-Slop Rules: Dedicated Second Brain mandate (`04 - Design System & Guardrails/Design - Ruthless UI Architect & Anti-AI-Slop Rules.md`), categorized banned tells, and 4 Required Rules (Structural Variety, Token Discipline, Responsive Safety with `overflow-x: clip`, Content Truth)
- [x] Zero-Bypass Session Security & Login Hardening: Complete elimination of local dev passwordless bypasses, pure Supabase GoTrue authentication, OWASP defense headers in middleware (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), and IP rate-limiting on sensitive setup endpoints
- [x] Admin Control Center Restructure & Live Vercel/Supabase Status: Refactored `AdminDashboardView.tsx` into an accessible 3-tab console (`Overview & Platform Status` | `Users` | `Infrastructure & Free-Tier`) powered by `GET /api/admin/platform-status` (Vercel runtime/cron/`vercel-status.com` + Supabase Auth/DB/Storage latency/`status.supabase.com` + P0 Launch Readiness + `@container` responsive User Directory table + hairline-divided `AdminFreeTierCard` using `getThemeTokens(theme)`)
- [x] Day-Based `v1.0.0`–`v1.0.3` Changelog & Notification Read Sync: Updated `package.json` (`1.0.3`), `CHANGELOG.md`, `changelog-data.ts`, `ChangelogModal.tsx` (native `<details>`/`<summary>`), `NotificationBell.tsx`, `PleaseHireMeDashboard.tsx` (`pahirepo_seen_changelog_version` read tracking), and strengthened `AGENTS.md` mandatory Obsidian MOC first-read rule
- [x] `v1.0.4` PDF & Word (`.docx`) Resume Import, Smart Profile Sync, Hyphen-Free Justify & Optional Company: Added `unpdf` + `mammoth` extraction in `POST /api/resume/parse`, `resume-parser.ts` (`parseResumeTextToStructured`, `buildSmartProfilePatchFromResume`), native `<dialog>` `ResumeUploadDialog.tsx` in Resume Studio & My Profile, hyphen-free `[hyphens:none] [text-justify:inter-word] [text-wrap:pretty]` Justify mode, optional Company on Save Version, and direct `user_profiles` sync in `POST /api/resumes/history`
- [ ] **Next P0:** Custom domain (`pahirepo.com`) connection + Google OAuth public verification + Supabase Email Template `{{ .Token }}` & Manual Linking toggle (see [[Roadmap P0 - Core Function Polish & Public OAuth Launch]])

## Related Notes
- [[00 - Home MOC]]
- [[Design - Ruthless UI Architect & Anti-AI-Slop Rules]]
- [[Project Evolution Timeline (Start to Present)]]
- [[Roadmap Tracker.base]]
