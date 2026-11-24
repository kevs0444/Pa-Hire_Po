---
type: timeline
status: active
priority: p0-now
area: product
milestone: v1.0.9
version: "1.0.9"
commit_ref: "15d6161"
files:
  - CHANGELOG.md
  - package.json
  - src/features/changelog/data/changelog-data.ts
  - src/features/changelog/components/ChangelogModal.tsx
  - src/features/notifications/components/NotificationBell.tsx
updated: 2026-11-25
tags:
  - pahirepo
  - changelog
---

# Changelog Mirror

Mirrors day-based customer releases (`v1.0.0` → `v1.0.9`) from [`CHANGELOG.md`](file:///d:/Dev/Pa-Hire%20Po/CHANGELOG.md), surfaced inside the app via `ChangelogModal.tsx` from `NotificationBell.tsx` (`localStorage` read tracking via `pahirepo_seen_changelog_version`).

---

## `v1.0.9` — November 25, 2026 (`15d6161`)
- **Tabbed Executive Analytics Dashboard (`JobAnalyticsView.tsx`, `AutoApplyBlueprintPanel.tsx`, `globals.css`):** Redesigned `/analytics` into a minimalist 3-tab cockpit (**Overview**, **Skill Gaps**, **Apply Queue**) featuring accessible `role="tablist"` keyboard navigation + `hidden="until-found"`/`beforematch`, unified 4-KPI ribbon, CSS `subgrid` board cards, flat hairline **Role Demand** & **Application Funnel**, segmented **Work Setup Split**, prioritized **Missing Skills**, and collapsible `<details>` **Saved Screening Answers**.
- **Unified `Expand` / `Collapse` Cards & `Resume Applied` Inline Editor (`ApplicationsCompilationView.tsx`, `ResumeVersionsDrawer.tsx`):** Replaced unclamped notes on **Resume Applied** cards and standardized all cards across **Saved**, **Applied**, **Resume Applied**, **Hidden**, and **Resume Versions Drawer** with 2-line previews, **`Expand` / `Collapse`** toggles, and inline **`Edit Details`** (`Version Name`, `Company`, `Job Title`, `Applied / Sent`, `Notes`).
- **Cloud-Synced Priority Pinning (`profile.ts`, `free-tier-limits.ts`, `PleaseHireMeDashboard.tsx`):** Added **`Pin`** toggle buttons (`aria-pressed`, `aria-live` announcements, `Pinned` badge, Civic left accent border, overflow menu action) and **`Pinned (N)`** filter pill across **Saved**, **Applied**, and **Resume Applied**, synced in `user_profiles.profile_data.pinnedActivityIds` (cap `25`).

---

## `v1.0.8` — November 24, 2026 (`a069c9c`)
- **Clean 4-Tab Header, Fixed Mobile Bottom Bar & Account Avatar Menu (`AppTopNavbar.tsx`, `UserAvatarMenu.tsx`, `layout.tsx`, `globals.css`):** Streamlined desktop navigation to **Job Search**, **Resume Studio AI**, **Activity**, and **Analytics**, added a 1-row mobile top bar + thumb-friendly fixed mobile bottom tab bar (`viewport-fit=cover`, `env(safe-area-inset-*)`, `44×44px` coarse-pointer targets, `scroll-padding-top`/`bottom`), and moved **My Profile**, **Saved searches**, **Saved jobs**, **Activity (Applied)**, **Settings**, **How It Works**, **Admin Control Center** (admin-only), inline **Light / Dark** toggle, and **Sign out** into a viewport-aware native `popover="auto"` menu.
- **Full-Width Civic Search Banner with 6 Pill Popovers & `Recent searches` (`JobSearchBanner.tsx`, `job-filters.ts`, `job-date-utils.ts`):** Added 6 native `popover="auto"` filter pills (**Pay** with `Annually`/`Monthly`/`Hourly` tabs, **Type**, **Remote**, **Classification**, **Listing time** radio selector `Any time`–`Last 30 days`, and **Boards & More**), `16px` mobile inputs to prevent Safari auto-zoom, and a collapsible **Recent searches** card strip (`bg-[#062d57]` Light / `bg-[#141417]` Dark).
- **Recommended Feed, Mobile Switcher, Auto-Saved Applied Jobs & Unified Expandable `Activity` Cards (`JobDiscoveryFeed.tsx`, `DiscoveryJobCard.tsx`, `ApplicationsCompilationView.tsx`, `ResumeVersionsDrawer.tsx`, `JobDetailPane.tsx`):** Turned Home (`/`) into a container-aware 2-column feed (`@container`) with a mobile `Recommended | Saved jobs` 1-tap switcher, focused mobile Explorer detail view (`← Back to results`), automatic saving of applied jobs into **Saved jobs** (`isJobSaved` + `unsavedAppliedJobIds`), unified every card across **Activity** (`Saved`, `Applied`, `Resume Applied`, `Hidden`) and **Resume Versions Drawer** with a 2-line preview + consistent **`Expand` / `Collapse`** chevron button, and added inline **`Edit Details`** on both job entries and **Resume Applied** snapshots (`Version Name`, `Company`, `Job Title`, `Applied / Sent`, multi-line `Notes`).
- **Tabbed Executive Analytics Dashboard (`JobAnalyticsView.tsx`, `AutoApplyBlueprintPanel.tsx`, `globals.css`):** Redesigned `/analytics` into a 3-tab executive cockpit (**Overview**, **Skill Gaps**, **Apply Queue**) with a unified 4-KPI ribbon, `subgrid`-aligned board cards, unwrapped **Role Demand** rows, flat **Application Funnel** + horizontal segmented **Work Setup Split** bar, Missing vs. Matched **Skill Gaps**, `hidden="until-found"` + `beforematch` Ctrl+F reveal, and collapsible native `<details>` **Saved Screening Answers** (local updates on top of `a069c9c`).
- **Supabase JSONB Persistence (`profile.ts`, `free-tier-limits.ts`):** Syncs `savedSearches` (cap 20), `recentSearches` (cap 8), `viewedJobIds` (cap 150), and `unsavedAppliedJobIds` (cap 200) inside RLS-protected `user_profiles.profile_data` JSONB.

---

## `v1.0.7` — November 22, 2026 (`74f6835`, `db3b4ea`)
- **1:1 A4 Preview-to-PDF Export & `Fit 1 Page` (`resume-print.ts`, `globals.css`, `ResumeFormatToolbar.tsx`, `SubmittedResumeModal.tsx`):** Removed the inflated `9.5pt` (`12.67px`) print override and inline wrapper height lock so `Compact`, `Standard`, and `Comfortable` densities print 1:1 with the preview; added **`Fit 1 Page`** (ON by default for A4, US Letter, and US Legal) with a live `✓ 1 Page` / `✓ 1 Page (Fit XX%)` / `⚠ N Pages` badge, dashed Page 1 boundary guide, automatic clean read-only rendering when printing from Edit Mode, and full modal parity across `ApplyFlowModal` and `SubmittedResumeModal`.
- **Dynamic Certifications Row & Column Controls in Resume Studio (`AI`):** Added `certificationColumns?: 1 | 2 | 3` (`src/types/resume.ts`), `clampCertificationColumns` + `swapCertificationUrls` (`src/features/resume/lib/resume-links.ts`), and `+ Add Row`, `+ Add Column`, `- Col`, `Add Certification`, live `Cols × Rows` readout, and `↑`/`↓` item reordering with synced credential URLs in `A4ResumePreview.tsx` (`min-w-0` grid track guards, identical on screen & PDF export). See [[Feature - Resume Studio AI & ATS Printing]].
- **Dedicated `AGENTS.md` Obsidian Vault Folder (`07 - Agent Rules & Guidelines/`):** Mirrored root `AGENTS.md` into 4 structured Obsidian notes (`00 - AGENTS Rules Index`, UI Design System, Resume Studio/Profile/Supabase Lock, Persistent Memory & Push Gate) linked from [[00 - Home MOC]].

---

## `v1.0.6` — November 21, 2026 (`d20fc8f`)
- **Dynamic Editable, Validated, Reorderable & Deletable Resume URLs:** Added `ResumeHeaderLink[]`, `hideHeaderLinks`, per-project URLs (`project.url`), and `certificationUrls` across **Resume Studio** (`A4ResumePreview.tsx`, `ResumeLinksEditor.tsx`, `resume-links.ts`), **My Profile** (`LinkedInProfileView.tsx`), **Settings** (`SettingsSidepanel.tsx`), AI tailoring (`/api/resume/tailor`), and PDF `/URI` annotation + `.docx` HTML hyperlink extraction (`/api/resume/parse`, `resume-parser.ts`), supporting independent Display Text + Target URL editing, blur-deferred safe URL validation, `↑`/`↓` link reordering, individual deletion, and **Remove / Restore Links Section**. See [[Feature - Resume Studio AI & ATS Printing]].
- **7 Ranked ATS Fonts (`Calibri ★ Best for ATS`) & Borderless PDF Export:** Expanded `ATS_FONT_PRESETS` to 7 ATS-safe fonts led by **`Calibri ★ Best for ATS (#1 Default)`** alongside `Helvetica (#2)`, `Arial (#3)`, `Garamond (#4)`, `Georgia (#5)`, `Cambria (#6)`, and `Times New Roman (#7)`, and fixed the `#f3f2ef` canvas bleed frame around `#a4-resume-sheet` under `@media print` (`globals.css`, `PleaseHireMeDashboard.tsx`, `ApplyFlowModal.tsx`).
- **Zero-Lag INP Editing & Always-on-Top OAuth Popout (`520×680`):** Eliminated Resume Studio typing lag via isolated `draftResume` (`0ms` local feedback, `320ms` debounced parent flush), `.resume-sheet-containment`, debounced local storage (`saveLocalStateDebounced`), and yielding `rescoreJobsAsync`, and upgraded Google/GitHub auth to a centered `520×680` popout window (`oauth-popup.ts`, `/auth/callback?popup=1`, `AuthScreen.tsx`, `SettingsSidepanel.tsx`, Electron `pa_hire_po_oauth`) that stays focused above `/login`. See [[Feature - Auth, Admin Control Center & Legal Compliance]].

---

## `v1.0.5` — November 20, 2026 (`d37a867`)
- **Specific Title + Company Search, Internet Fallback & Strict Correlation:** Added dedicated **Company Name (Optional)** input + `"Role at Company"` parser in Find Jobs (`PleaseHireMeDashboard.tsx`), deeper multi-board scraping (`20–24` listings across `linkedin.ts`, `jobstreet.ts`, `indeed.ts`), site-scoped Internet Web Search fallback (`src/server/scrapers/web-fallback.ts`), and `filterBySearchCorrelation` (`job-search-service.ts`). See [[Feature - Multi-Board Job Scraper Engine]].
- **1-Click `Copy URL` Everywhere:** Added `CopyUrlButton.tsx` to Job Cards, `JobDetailPane.tsx`, `TopChoicesSpotlight.tsx`, and tracked applications.
- **`Job Tracking` & `Resume Applied` Suite:** Renamed `Applied & Resumes` to **Job Tracking** (`AppTopNavbar.tsx`, `LandingPageView.tsx`, `ApplicationsCompilationView.tsx`), introduced the filterable **Resume Applied** sub-feature, and upgraded **`+ Add Job Application`** with URL auto-detection, common application fields (Location, Work Setup, Salary, Stage, Date Applied, Resume Applied), and inline editing. See [[Feature - Applications Compilation & Submitted Resume Modal]].

---

## `v1.0.4` — November 18, 2026 (`ce581df`)
- **PDF & Word (`.docx`) Resume Import + Smart Profile Sync:** Upload `.pdf`, `.docx`, `.txt`, `.md`, or `.json` resumes via `ResumeUploadDialog.tsx` in **Resume Studio** or **My Profile**, extract full `StructuredResume` via `unpdf` + `mammoth` + Gemini/deterministic parser, sync Smart Profile fields to `user_profiles`, archive an `"Imported: <filename>"` snapshot, and edit immediately in Resume Studio. See [[Feature - Resume Studio AI & ATS Printing]].
- **Hyphen-Free Smart Justify Mode:** Replaced `[hyphens:auto]` with `[hyphens:none] [word-break:normal] [overflow-wrap:break-word] [text-justify:inter-word] [text-wrap:pretty] [text-align-last:left]` so words never split mid-word across lines.
- **Optional Company on Save Version & Supabase Profile Sync:** Removed required company constraint from **Save New Resume Version** (`A4ResumePreview.tsx`, `ResumeVersionsDrawer.tsx`) and added `Sync to My Profile & Base CV` (`syncToProfile`) updating `public.user_profiles` alongside `public.tailored_resumes`.

---

## `v1.0.3` — November 17, 2026 (`497d282`, `c92d9f1`)
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
