---
type: timeline
status: verified
priority: p0-now
area: product
milestone: v1.0.10
commit_ref: "pending"
files:
  - context.md
  - CHANGELOG.md
  - README.md
updated: 2026-11-27
tags:
  - pahirepo
  - timeline
  - history
---

# Project Evolution Timeline (Start to Present)

Complete git-verified chronology of **Pa-Hire Po** across all **20 commits** from initial Next.js scaffold to multi-user cloud-backed Civic Career Utility.

---

## Phase 1 — Genesis: *PleaseHireMe* (Nov 14, 2026)

| Commit | Date | Summary | Key Milestones |
|---|---|---|---|
| `41ce8d2` | 2026-11-14 | Initial commit from Create Next App | Base Next.js 16 + TypeScript + Tailwind CSS v4 project |
| `6077fc0` | 2026-11-14 | `feat: initial build of PleaseHireMe automated job finder` | First multi-board job search prototype (LinkedIn, JobStreet, Indeed), initial scoring, and resume preview |

---

## Phase 2 — Feature-Sliced Scale & Desktop Shell (Nov 15, 2026)

| Commit | Date | Summary | Key Milestones |
|---|---|---|---|
| `7ccfd61` | 2026-11-15 | `feat: scalable feature structure, board analytics page, auto-apply blueprint & electron desktop shell` | Introduced `src/features/` separation, `/analytics`, screening queue blueprint, and Electron desktop shell (`electron/main.cjs`) |
| `3cdbd7a` | 2026-11-15 | `docs: update README with PleaseHireMe v4 features, architecture and git workflow` | Documented v4 feature set and workflow |
| `30d843f` | 2026-11-15 | `docs: add context.md with complete main and sub-feature breakdown` | Created root [`context.md`](file:///d:/Dev/Pa-Hire%20Po/context.md) as the living AI memory anchor |

---

## Phase 3 — *Pa-Hire Po* Rebrand & Anti-AI-Slop UI Reset (Nov 15, 2026)

| Commit | Date | Summary | Key Milestones |
|---|---|---|---|
| `ad54cde` | 2026-11-15 | `feat: rebrand to Pa-Hire Po with official logo, 3-color orange UI, landing page, and desktop launcher` | Rebranded to **Pa-Hire Po**, added `/pa-hire-po-logo.jpg`, Workspace Home `/`, `open-desktop.bat` |
| `288ca06` | 2026-11-15 | `feat: dynamic Resume Studio AI sizing, personal Gemini API, and anti-slop UI design system` | Pivoted away from 3-color orange UI to **Civic Career Utility** (`#F3F2EF` / `#0A66C2`), native `<dialog>` modals, `gemini-3.1-flash-lite`, A4/Letter/Legal/Auto sizing |
| `dd4f6e7` | 2026-11-15 | `feat: add Top 5 AI-ATS fonts, side-by-side resume comparison, and AI change highlighting` | Added Calibri/Helvetica/Garamond/Arial/Georgia, `font-variant-ligatures: none`, Side-by-Side Diff & AI highlight badges |
| `94ac0e1` | 2026-11-15 | `feat: set default target role to Data Analyst / Junior Data Analyst` | Compound `/` query expansion + default target role |
| `4dfbd03` | 2026-11-15 | `feat: implement soft grayscale and black-and-white theme for dark mode` | Replaced dark navy/blue accents with Soft Grayscale Monochrome (`#121214` / `#18181b` / zinc) — see [[ADR-005 - Soft Grayscale Dark Mode Replacing Blue Dark Slate]] |
| `e7e1b0b` | 2026-11-15 | `feat: add date recency filter and multi-strategy job sorting` | Added `job-date-utils.ts`, 24h/7d/30d filters, and Best Match / Newest / Oldest sorting |
| `42bedb0` | 2026-11-15 | `docs: update repository URL to Pa-Hire_Po` | Updated repository references to `kevs0444/Pa-Hire_Po` |

---

## Phase 4 — 1,000-User Cloud Architecture & Auth Hardening (Nov 15, 2026)

| Commit | Date | Summary | Key Milestones |
|---|---|---|---|
| `95eb666` | 2026-11-15 | `feat: add Supabase cloud auth, 1k-user scalable architecture, LinkedIn profile media & RLS hardening` | Added `supabase/schema.sql`, `0001_scale_1000_users_indexes.sql`, RLS + `is_admin()`, rate limiter, `TtlCache`, `320x320` avatar + `1200x360` cover canvas compression |
| `9a61551` | 2026-11-15 | `feat(auth,admin): move Supabase settings to Admin panel and lock Vercel store target` | Locked `supabase-erin-elephant` (`muftcprpqnzuzfosvftz`), cleaned `/login` surface — see [[ADR-001 - Lock Single Vercel Supabase Store]] |
| `8d54d97` | 2026-11-15 | `feat(supabase,auth): fix service-role schema probe, auto-confirm signup, and enable local-dev admin access` | Fixed schema probe, signup flow, and local admin sandbox cookie |
| `169ae5a` | 2026-11-15 | `fix(auth,admin): guard unconfigured OAuth providers, add signin-assist, and show auth provider status` | Dynamic `/auth/v1/settings` provider filtering preventing `Unsupported provider` errors |

---

## Phase 5 — Legal Compliance & Persistent AI Memory (Nov 15, 2026)

| Commit | Date | Summary | Key Milestones |
|---|---|---|---|
| `44fd508` | 2026-11-15 | `feat(legal): add Privacy Policy and Terms of Service pages for Google OAuth publishing` | Added `/privacy` (RA 10173, GDPR, Google API User Data Policy) and `/terms` with shared `LegalPageShell.tsx` |
| `e39b5fc` | 2026-11-15 | `docs: refactor persistent AI memory protocol in AGENTS.md and context.md` | Established `context.md` + `AGENTS.md` persistent memory rules |

---

## Phase 6 — Full Application Lifecycle, ESCO & Real-Time UX (Nov 16, 2026)

| Commit | Date | Summary | Key Milestones |
|---|---|---|---|
| `22c463d` | 2026-11-16 | `feat(ux): add job status persistence, applications compilation, ESCO role library, settings sidepanel, and desktop setup` | Added `0002_applications_roles_and_tracking.sql`, `/applications`, `/api/jobs/status`, `/api/roles/search` (ESCO + catalog), `SettingsSidepanel.tsx`, `electron-builder.json`, PWA `manifest.ts` |
| `a1059ca` | 2026-11-16 | `feat(ux): fix saved jobs sync, add Show Resume popout modal, real-time bell, loading spinner, and changelog` | Fixed immediate `user_jobs` flush sync, added `SubmittedResumeModal.tsx`, `NotificationBell.tsx` (Realtime + `BroadcastChannel`), `LoadingSpinner.tsx`, `CHANGELOG.md` + `ChangelogModal.tsx` |

---

## Phase 7 — Security Hardening, Direct Resume Editor, Admin Status & `v1.0.3` Release (Nov 17, 2026)

| Version / Commit | Date | Summary | Key Milestones |
|---|---|---|---|
| `497d282` | 2026-11-17 | `feat(core): 1-min auto refresh, auth lockdown, email OTP, connected logins, 13 Civic email templates, and obsidian second brain sync` | 60s auto-scan, Email OTP (`verifyOtp`), Settings Connected Logins (`linkIdentity`), 13 Civic email templates, and Obsidian Second Brain vault creation |
| `c92d9f1` (`v1.0.3`) | 2026-11-17 | `feat(release): v1.0.3 admin status console, full v1.0.0-v1.0.3 changelog, notification sync, and MOC rules` | Zero-bypass session hardening + OWASP headers, Ruthless UI Architect Wave 1–3 refactor, fully editable Resume Studio + Versions Drawer, 3-tab Admin Control Center with live Vercel/Supabase status (`/api/admin/platform-status`), day-versioned `v1.0.0`–`v1.0.3` changelog, and mandatory MOC/post-push Second Brain rules |

---

## Phase 8 — Resume Import (PDF/Word), Smart Profile Sync & `v1.0.4` Release (Nov 18, 2026)

| Version / Commit | Date | Summary | Key Milestones |
|---|---|---|---|
| `ce581df` (`v1.0.4`) | 2026-11-18 | `feat(resume): v1.0.4 PDF/Word resume import, Smart Profile sync, hyphen-free Justify mode, and optional Company save` | Added `unpdf` + `mammoth` extraction in `/api/resume/parse`, `resume-parser.ts`, native `<dialog>` `ResumeUploadDialog.tsx` in Resume Studio & My Profile, hyphen-free smart Justify mode, optional Company on Save Version, and `user_profiles` sync in `/api/resumes/history` |

---

## Phase 9 — Dynamic 3-Platform Extraction, Internet Fallback, Copy URL & `Job Tracking` (`v1.0.5`, Nov 20, 2026)

| Version / Commit | Date | Summary | Key Milestones |
|---|---|---|---|
| `d37a867` (`v1.0.5`) | 2026-11-20 | `feat(release): v1.0.5 title+company job search, internet fallback, copy url, and job tracking suite` | Created `web-fallback.ts`, upgraded `linkedin.ts`/`jobstreet.ts`/`indeed.ts` + `job-search-service.ts`, added `CopyUrlButton.tsx`, and renamed `Applied & Resumes` → `Job Tracking` with `Resume Applied` + URL auto-detect `+ Add Job Application` |

---

## Phase 10 — Dynamic Editable Resume Links, 7 Ranked ATS Fonts (`★ Best for ATS`), Borderless Print, Zero-Lag INP & Always-on-Top OAuth Popout (`v1.0.6`, Nov 21, 2026)

| Version / Commit | Date | Summary | Key Milestones |
|---|---|---|---|
| `d20fc8f` (`v1.0.6`) | 2026-11-21 | `feat(release): v1.0.6 dynamic editable resume links, 7 ranked ATS fonts, zero-lag editing, and always-on-top OAuth popout` | Created `resume-links.ts`, `ResumeLinksEditor.tsx`, and `oauth-popup.ts`; added reorderable/deletable Display Text + Target URL links across Header, Projects, Certifications, Settings, Profile, AI tailoring, and PDF/DOCX link extraction; expanded to 7 ranked ATS fonts led by `Calibri ★ Best for ATS (#1 Default)`; fixed borderless white `@media print` sheets; eliminated typing lag with `draftResume` + `.resume-sheet-containment` + yielding `rescoreJobsAsync`; and shipped centered `520×680` always-on-top OAuth popout for web & Electron |

---

## Phase 11 — Dynamic Certifications Row & Column Grid + Obsidian `AGENTS.md` Folder (`v1.0.7`, Nov 22, 2026)

| Version / Commit | Date | Summary | Key Milestones |
|---|---|---|---|
| `db3b4ea` (`v1.0.7`) | 2026-11-22 | `feat(release): v1.0.7 dynamic certification rows/columns in Resume Studio AI and Obsidian AGENTS.md folder` | Added `ResumeCertificationColumns` (`1 | 2 | 3`) & `certificationColumns` (`src/types/resume.ts`), `clampCertificationColumns` + `swapCertificationUrls` (`resume-links.ts`), explicit `CERTIFICATION_GRID_CLASS` tracks + `+ Add Row` / `+ Add Column` / `- Col` / `Add Certification` controls + `Cols × Rows` readout + `↑`/`↓` item reordering (`A4ResumePreview.tsx`), and created `Pa-Hire Po/07 - Agent Rules & Guidelines/` linked from `00 - Home MOC.md` |
| `74f6835` (`v1.0.7`) | 2026-11-22 | `fix(resume): match A4 preview 1:1 on PDF export with Fit-to-1-Page scaling and modal parity` | Created `resume-print.ts` (`fitOnePage?: boolean` default ON for A4/Letter/Legal, `computePrintLayoutSummary`, `buildResumePrintStyles`), removed `9.5pt` print font inflation and added `.resume-sheet-containment` print reset in `globals.css`, added `[data-resume-content="true"]` height observer + Page 1 boundary line + Edit-Mode print guard in `A4ResumePreview.tsx`, added `Fit 1 Page` toggle + live page status pill in `ResumeFormatToolbar.tsx`, and unified `ApplyFlowModal.tsx` & `SubmittedResumeModal.tsx` |

---

## Phase 12 — JobStreet-Inspired Minimal UI & Civic Discovery Feed (`v1.0.8`, Nov 24, 2026)

| Version / Commit | Date | Summary | Key Milestones |
|---|---|---|---|
| `a069c9c` (`v1.0.8`) | 2026-11-24 | `feat(release): v1.0.8 JobStreet-inspired mobile-first Civic UI, filter pills, and editable Activity workspace` | Streamlined `AppTopNavbar.tsx` (4 tabs + fixed mobile bottom nav) & `UserAvatarMenu.tsx` (`popover="auto"`); added `viewport-fit=cover`, safe-area `scroll-padding`, and `44px` coarse-pointer targets (`layout.tsx`, `globals.css`); rebuilt `JobSearchBanner.tsx` with 6 `popover="auto"` filter pills (`Pay`, `Type`, `Remote`, `Classification`, `Listing time`, `Boards & More`), `job-filters.ts`, and collapsible `Recent searches`; launched `@container` `DiscoveryJobCard.tsx`, mobile `Recommended | Saved jobs` switcher (`JobDiscoveryFeed.tsx`), focused mobile Explorer switch (`mobileDetailOpen`), and auto-saved applied jobs (`isJobSaved` + `unsavedAppliedJobIds`); redesigned `ApplicationsCompilationView.tsx` into single-column `Activity` (`Saved`, `Applied`, `Resume Applied`, `Hidden`) with `⋮` menus, clamped expandable Notes, and full-detail inline editing; synced `savedSearches` (20), `recentSearches` (8), `viewedJobIds` (150), and `unsavedAppliedJobIds` (200) via Supabase JSONB; live on Vercel (`pa-hire-p890m428z` Ready) |

---

## Phase 13 — Tabbed Executive Analytics, Unified Expandable Cards & Priority Pinning (`v1.0.9`, Nov 25, 2026)

| Version / Commit | Date | Summary | Key Milestones |
|---|---|---|---|
| `15d6161` (`v1.0.9`) | 2026-11-25 | `feat(release): v1.0.9 tabbed executive Analytics dashboard, expandable Activity cards, and cloud-synced Pinning` | Redesigned `JobAnalyticsView.tsx` + `AutoApplyBlueprintPanel.tsx` + `globals.css` (`role="tablist"`, `hidden="until-found"`/`beforematch`, unified KPI ribbon, CSS `subgrid` boards, flat Role Demand, segmented Work Setup bar, Missing vs. Matched skills, native `<details>` Screening Answers); fixed unclamped notes on `Resume Applied` & standardized `Expand` / `Collapse` buttons + inline `Resume Applied` editing across `ApplicationsCompilationView.tsx` and `ResumeVersionsDrawer.tsx`; added `pinnedActivityIds` (cap `25`), `handleTogglePinActivity`, **`Pin`** (`aria-pressed`, `aria-live`), **`Pinned`** badge + Civic border accent, and **`Pinned (N)`** filter pill; live on Vercel (`pa-hire-3aa4mwhg1` Ready in `38s`) |

---

## Phase 14 — "New to me" Filter & Cross-Board Applied Deduplication (`v1.0.10`, Nov 27, 2026)

| Version / Commit | Date | Summary | Key Milestones |
|---|---|---|---|
| `pending` (`v1.0.10`) | 2026-11-27 | `feat(jobs): add New to me filter pill with cross-board applied deduplication (v1.0.10)` | Added `UserProfile.newToMeOnly` (`src/types/profile.ts`, ON by default), `normalizeCompanyTitleKey` + `buildAppliedRoleKeys` + `isJobNewToMe` (`src/features/jobs/lib/job-filters.ts`), 1-click **`New to me`** banner toggle pill (`JobSearchBanner.tsx`), Home Discovery & `/jobs` `All Active` filtering + Saved-sidebar tab routing (`PleaseHireMeDashboard.tsx`), and 1-click **Show applied & saved jobs** empty-state recovery (`JobDiscoveryFeed.tsx`, `PleaseHireMeDashboard.tsx`) |

---

## Related Notes
- [[00 - Home MOC]]
- [[Specs & Plans Archive Index]]
- [[Changelog Mirror]]
- [[Active State & Progress Ledger]]
