# Pa-Hire Po — Complete Feature & Context Breakdown

**Last Updated:** November 21, 2026 (`v1.0.6` — Dynamic Editable, Validated, Reorderable & Deletable Resume Links, 7 Ranked ATS Fonts with `Calibri ★ Best for ATS`, Borderless PDF Print Fix, Zero-Lag INP Editing & Always-on-Top OAuth Popout)

Here is the complete breakdown of **Pa-Hire Po** (`pa-hire-po`) features, design rules, and system architecture, organized into **Main Features**, **Sub-Features**, and **Anti-AI-Slop UI Guardrails**:

---

## 0. Civic Career Utility Workspace + Light/Dark Theme (`Home` / `/`)

**Core files:** `src/app/page.tsx`, `src/app/jobs/page.tsx`, `src/components/LandingPageView.tsx`, `src/lib/theme.ts`, `public/pa-hire-po-logo.jpg`, `electron/open-desktop.cjs`, `open-desktop.bat`

- **Sub-Feature 0.1 — Official Branding (`Pa-Hire Po` Logo & Metadata):**
  - Displays the official `Pa-Hire Po` emblem (`/pa-hire-po-logo.jpg` + `/favicon.ico`) in the browser tab favicon, sticky navbar header, workspace overview card, and Electron desktop window icon.
- **Sub-Feature 0.2 — Light Civic (Default) & Dark Slate Theme Switcher (`Light` | `Dark`):**
  - **Light Civic (Default):** Warm `#F3F2EF` paper canvas, `#FFFFFF` cards, `#0F172A` primary ink, and `#0A66C2` LinkedIn civic blue actions (`border-l-[3px] border-l-[#0a66c2]` active row indicator).
  - **Dark Slate:** High-contrast `#0B0F17` canvas with `#111827` cards and `#2563EB` blue accents (synced with root `color-scheme: light dark` and `light-dark()` CSS tokens). Legacy `'orange'` stored preferences normalize safely to `'light'`.
- **Sub-Feature 0.3 — Interactive Workspace Overview & 1-Click Desktop Launchers:**
  - Root `/` opens on the **Home** Overview with live job counters, direct **JobStreet / LinkedIn / Indeed** board jump links, clean workspace action shortcuts (`Open Job Explorer`, `Resume Studio [AI]`), and copy-ready Electron CLI commands (`npm run desktop:open`, `npm run desktop:live`, `open-desktop.bat`).

---

## 1. Live Multi-Board Job Finder & Scraper Engine

**Core files:** `src/app/api/jobs/search/route.ts`, `src/server/services/job-search-service.ts`, `src/server/scrapers/linkedin.ts`, `src/server/scrapers/jobstreet.ts`, `src/server/scrapers/indeed.ts`, `src/server/scrapers/web-fallback.ts`

- **Sub-Feature 1.1 — 3-Board Deeper Concurrent Extraction:**
  - **LinkedIn Scraper:** Queries LinkedIn's Guest Search API (`seeMoreJobPostings/search`, multi-page `start=0` / `start=25`) parsed with `cheerio`, enriches top 8 listings via `jobPosting/{jobId}`, falls back to `ts-jobspy`, and automatically escalates to site-scoped Internet Web Search fallback.
  - **JobStreet Scraper:** Queries the JobStreet v5 JSON API (`/api/jobsearch/v5/search`, `pageSize=24`) across `PH-Main`, `MY-Main`, `SG-Main`, and `ID-Main`, falls back to direct HTML/JSON-LD (`JobPosting`) card parsing, and escalates to Internet Web Search fallback.
  - **Indeed Scraper:** Fetches live postings via `ts-jobspy` (`scrapeJobs`), falls back to direct Indeed HTML mosaic card extraction, and escalates to Internet Web Search fallback.
- **Sub-Feature 1.2 — Site-Scoped Internet Web Search Fallback (`web-fallback.ts`) & Search Correlation:**
  - **Specific Job Title + Optional Company Name Search:** Supports separate **Job title or keyword** and **Company name (optional)** inputs (plus smart `"Role at Company"` splitting) without overwriting the user's saved Profile Primary Role unless **Save as Target Role** is clicked.
  - **Internet Fallback (`searchInternetForBoardJobs`):** Automatically triggers site-scoped web search (`DuckDuckGo HTML`, `Yahoo Search HTML`, and `ts-jobspy` Google Jobs) whenever a board is rate-limited, challenged, or returns `< 3` correlated hits for a specific Title/Company search.
  - **Strict Search Correlation (`filterBySearchCorrelation`):** Hard-filters uncorrelated noise, boosts exact searched Company (`+12`) and exact Title (`+6`) matches, and replaces stale unsaved `suggested` listings on explicit search while preserving all `Saved`, `Applied`, `Hidden`, and `Queued` jobs.
- **Sub-Feature 1.3 — 1-Minute Default Auto-Refresh + Page-Load Scan:**
  - Automatically scans on initial page load/refresh and silently auto-refreshes every **60 seconds (`1m`)** when the tab is visible (preserving active Title/Company search queries across auto-refresh ticks via `activeSearchMetaRef`).
- **Sub-Feature 1.4 — Dynamic Role Choices & Pivot Mode:**
  - Quick-switch pills for your target roles (default **`Data Analyst / Junior Data Analyst`**, plus `Data Analyst`, `Junior Data Analyst`, `Business Intelligence Analyst`, `Junior Data Engineer`, `Data Scientist`, `AI Engineer`, or any custom role). Compound `/` roles automatically expand into separate clean job-board search queries while scoring both title variants cleanly.
  - **Pivot Mode (`autoPivotRoles`):** Automatically rotates adjacent high-overlap roles (`selectRolesForScan` & `inferDynamicRoles`) into searches and tags them with a `Pivot` badge.
- **Sub-Feature 1.5 — Multi-Country & Work-Type Targeting:**
  - Supports Philippines (`ph`), Malaysia (`my`), Singapore (`sg`), Indonesia (`id`), United States (`us`), and Global Remote (`remote`).
  - Filters by `Any`, `Remote`, `Hybrid`, or `Onsite`.
- **Sub-Feature 1.6 — Date Recency Filtering & Multi-Strategy Sorting:**
  - **Date Recency Filters (`dateFilter`):** Instant client-side filtering by **All Dates**, **Past 24 Hours / Today** (`24h`), **Past Week** (`7d`), and **Past Month** (`30d`) without losing cached jobs.
  - **Sorting Strategies (`sortBy`):** Sort listings by **Best Match** (match score descending, secondary recency), **Newest First** (latest to past), or **Oldest First** (past to latest). Fallback listings remain deprioritized below live jobs.
  - **Cross-Platform Date Normalization (`job-date-utils.ts`):** Seamlessly unifies ISO timestamps (`YYYY-MM-DD` from LinkedIn/Indeed) and relative durations (`1h ago`, `2d ago`, `8d ago` from JobStreet) with SSR-safe hydration and relative card badges (`Clock` icon + `formatJobDateLabel`).

---

## 2. Smart Resume Matcher, Experience Analyzer & Recommended Strip

**Core files:** `src/features/resume/lib/resume-analyzer.ts`, `src/features/jobs/components/TopChoicesSpotlight.tsx`

- **Sub-Feature 2.1 — Weighted `28–98%` Match Scoring (`scoreJobAgainstProfile`):**
  - **Title Alignment (`up to 38 pts`):** Matches target role and searched role keywords.
  - **Skill Coverage (`up to 40 pts`):** Compares job-required skills against your profile skills (`matchedSkills` vs `missingSkills`).
  - **Resume Context Overlap (`up to 16 pts`):** Token overlap between the full job description and your resume text.
  - **Work Setup & Location Bonus (`2–6 pts`):** Rewards matching remote/hybrid/onsite setup.
  - **Experience Fit Adjustment (`+5` / `-4` / `-15 pts`):** Boosts entry-applicable jobs and penalizes senior-only listings.
- **Sub-Feature 2.2 — Experience Needed Extractor (`extractExperienceRequirement`):**
  - Parses required years (`1–3 yrs experience`, `Fresh Grad / Entry Level`, `5+ yrs`, `Open / Not Specified`) from titles and descriptions.
  - Classifies each job into `fit` (*✓ Matches Your Level*), `stretch` (*Slight Stretch*), or `senior-warning` (*Senior Exp Requested*).
- **Sub-Feature 2.3 — Recommended Top 3 Strip (`Recommended for [User]`):**
  - Surfaces top 3 applicable listings cleanly (excluding hidden, fallback, and `senior-warning` roles) with 1-click **Tailor & Apply** and **Queue** actions.

---

## 3. LinkedIn × JobStreet 2-Column Job Explorer & 1-Click `Copy URL`

**Core files:** `src/components/PleaseHireMeDashboard.tsx`, `src/features/jobs/components/JobDetailPane.tsx`, `src/features/jobs/components/TopChoicesSpotlight.tsx`, `src/components/ui/CopyUrlButton.tsx`, `src/components/ui/BrandLogos.tsx`

- **Sub-Feature 3.1 — Master-Detail Split Layout & `Copy URL` Everywhere:**
  - **Left Column (`lg:col-span-5`):** Scannable `rounded-lg` job cards with `3px` left accent border on active selection, authentic board logo, company, location, salary, experience badge, `✓` prefixed high-match pills (`>= 75%`), and 1-click **Copy URL** (`CopyUrlButton.tsx`).
  - **Right Column (`JobDetailPane`):** Single-surface reading panel separated by hairline dividers with semantic `MatchScoreRing` (`#057642` emerald `>=75%`, `#0a66c2` blue `>=55%`), **Open Original**, **Copy URL**, experience alignment rationale, matched (`✓`) vs missing (`+`) skills, and full description.
- **Sub-Feature 3.2 — Official Job Board Logos (`BoardLogo`):**
  - Authentic full-brand SVG emblems (`#0A66C2` LinkedIn, `#0D3880` JobStreet SEEK glyph, `#003A9B` Indeed).
- **Sub-Feature 3.3 — Multi-Faceted Job Filtering & Status Tracking:**
  - Filter by status (`All Active`, `Saved`, `Applied`, `Hidden`), board (`All Sites`, `LinkedIn`, `JobStreet`, `Indeed`), **Applicable Exp Only** (`fitFilter`), keyword search, and minimum match score slider (`0%–80%`).
- **Sub-Feature 3.4 — Job Tracking & `Resume Applied` Suite (`/applications`):**
  - Renamed from *Applied & Resumes* to **Job Tracking** (`AppTopNavbar.tsx`, `LandingPageView.tsx`, `ApplicationsCompilationView.tsx`) with sub-views: **Applied Jobs**, **Resume Applied** (filterable by `All`, `✓ Applied`, and `Saved`), **Saved Jobs**, and **Hidden Jobs**.
  - **Rich `+ Add Job Application` Form & URL Auto-Detect:** Captures Company/Job URL (with **Paste URL** auto-detection of platform, company, and title + **Copy URL**), Company Name, Job Title, Platform, Location, Work Setup, Salary/Offer, Stage, Date Applied, Resume Applied snapshot selector, and Notes.
  - **Inline Application Editing & `Copy URL`:** Edit URL, Location, Work Setup, Salary, Stage, Linked Resume, and Notes directly in the detail pane, and copy any company or job link with 1 click.

---

## 4. Step-by-Step Application & Dynamic Resume Studio (`AI`)

**Core files:** `src/features/jobs/components/ApplyFlowModal.tsx`, `src/features/resume/components/A4ResumePreview.tsx`, `src/features/resume/components/ResumeFormatToolbar.tsx`, `src/features/resume/components/ResumeLinksEditor.tsx`, `src/features/resume/lib/resume-links.ts`, `src/features/resume/lib/resume-tailor.ts`, `src/app/api/resume/tailor/route.ts`, `src/app/globals.css`

- **Sub-Feature 4.1 — Native Top-Layer `<dialog>` Application Flow (`ApplyFlowModal` & `HowItWorksModal`):**
  - Uses native HTML `<dialog>` (`showModal()`, `closedby="any"` + pointer light-dismiss fallback, `aria-labelledby`, `overscroll-behavior: contain` backdrop containment).
  - **Step 1:** Offers direct board application or 1-click AI tailoring in **Resume Studio (`AI`)**.
  - **Step 2:** Renders live tailored resume preview with dynamic sizing, **Print / Save PDF**, and **Continue to [Board] & Mark Applied**.
- **Sub-Feature 4.2 — Admin-Gated Personal Gemini API (`gemini-3.1-flash-lite`) + Smart Local Fallback + Side-by-Side Diff:**
  - `POST /api/resume/tailor` requires an authenticated session (`401` otherwise). Server-side `process.env.GEMINI_API_KEY` is restricted exclusively to **Admin** accounts (`authUser.isAdmin`), while standard users use their own optional Gemini key or the built-in **Smart Career Journey Tailor** deterministic engine.
  - Calls `gemini-3.1-flash-lite` (fallback `gemini-flash-lite-latest` → `gemini-2.5-flash` → deterministic `tailorResumeLocally`) with strict anti-hallucination grounding rules. Displays **Personal AI Active** badge only when authorized.
  - **Side-by-Side Comparison & AI Change Highlighting:** When tailored by AI, toggle **Side-by-Side Compare** (`Base Profile CV` vs. `AI Tailored CV`) and **Highlight AI Changes** (color-coded indicators + `✓ AI Tailored` / `↑ Reordered` tags on modified headlines, tailored summaries, rewritten bullets, skill updates, and bolded keywords, stripped cleanly during PDF printing).
- **Sub-Feature 4.3 — Dynamic Resume Paper Sizing (Default A4 `210 × 297 mm`), 7 Ranked AI-ATS Fonts (`★ Best for ATS`) & Borderless PDF Export:**
  - Supports **A4 (Default • `210 × 297 mm`)**, **US Letter (`8.5 × 11 in`)**, **US Legal (`8.5 × 14 in`)**, and **Dynamic (`Auto Fit Content`)**, plus **Density** (`Compact`, `Standard`, `Comfortable`).
  - Expanded **ATS Font** selector to 7 ranked ATS-safe fonts: **`Calibri ★ Best for ATS (#1 Default)`** (highest OCR & token accuracy in Workday, Greenhouse, Lever & Taleo), **`Helvetica (#2 Tech & Eng ATS)`**, **`Arial (#3 Universal Legacy ATS)`**, **`Garamond (#4 Researcher 1-Page)`**, **`Georgia (#5 Screen & ATS Serif)`**, **`Cambria (#6 Executive Word ATS)`**, and **`Times New Roman (#7 Classic Academic)`**, paired with live ATS compatibility guidance and `aria-live` announcements.
  - Enforces `font-variant-ligatures: none`, pure white borderless `@media print` overrides on `html, body` and `#a4-resume-sheet` (eliminating `#f3f2ef` canvas bleed/gray borders in saved PDFs), and dynamic `@media print { @page { size: ...; margin: 8mm; } }`.
- **Sub-Feature 4.4 — In-Sheet Full-Section Direct Editing & MS Word/Docs Text Formatting Toolbar:**
  - **In-Sheet Direct Editing**: Every section is directly editable in place when entering Edit Mode (`color-scheme: only light` + explicit light input contrast on `#a4-resume-sheet`): Contact details (Full Name, Headline, Email, Phones, Location, plus dynamic header links), Tailored Summary, Experience (role, company, location, period, bullets + add/delete/reorder bullets and positions), Projects (name, clickable Project URL, subtitle, period, bullets + add/delete/reorder), Technical Skills (categories + items + add/delete), Certifications (title + clickable URL), and Education (degree, school, period, honors + add/delete).
  - **Word / Docs Style Accessible Toolbar (`ResumeFormatToolbar`)**: Two-row Civic header & accessible `role="toolbar"` (`focusgroup="toolbar wrap"` + roving-tabindex arrow-key fallback) unified strictly on `getThemeTokens(theme)`, with live Bold (`**`), Italic (`*`), and Tool Tag (`` ` ``) formatting wired to active edit-mode fields via selection tracking, plus 1-click **Apply to Base Profile**.
  - **Text Alignment (Justify vs Left Align)**: Global toggle between **Justified** (`text-justify [hyphens:none] [word-break:normal] [overflow-wrap:break-word] [text-justify:inter-word] [text-wrap:pretty] [text-align-last:left]` for flush margins without mid-word hyphenation) and **Left Align** (`text-left [hyphens:none]` standard ATS ragged right).
  - **Responsive Zoom & Symmetric Compare Scaling**: `ResizeObserver`-measured sheet scaling (`Fit to Screen`, `75%`, `90%`, `100%`, `110%`) dynamically adapting Base and Tailored sheets symmetrically across mobile (375px+) and desktop without clipping, with `@media print` resetting to unscaled physical paper.
- **Sub-Feature 4.5 — Resume Versions Drawer, Custom Naming & Deletion Confirmation (`ResumeVersionsDrawer` & `DeleteVersionConfirmDialog`):**
  - **Resume Versions Drawer**: Dedicated slide-over drawer and modal showing all saved versions with customizable names (`versionName`), creation timestamps, optional company/role targets (`company` nullable for general edits), `Sync to My Profile & Base CV` toggle, and tailor method badges (`Personal AI`, `Auto-Tailored`, `Manual Edit`, `Base`).
  - **Customizable Version Renaming**: In-place rename input with IME-safe keyboard handling (`ime-safe-enter-submit`) and Escape cancel.
  - **1-Click Load & Restore**: Restores and previews any historical version into active studio state with a single click.
  - **Native `<dialog>` Deletion Confirmation**: Safe version deletion prompt (`DeleteVersionConfirmDialog`) using native HTML `<dialog>` with focus trapping and light dismiss (`closedby="any"`).
- **Sub-Feature 4.6 — Dynamic Editable, Validated, Reorderable & Deletable Resume URLs (`resume-links.ts`, `ResumeLinksEditor.tsx`):**
  - **Structured Header Links (`ResumeHeaderLink[]` & `hideHeaderLinks`)**: Supports independent **Display Text** + **Target URL** (`https://...`) for `LinkedIn`, `GitHub`, `Portfolio`, and custom header links (`+ Add Link`, `+ LinkedIn`, `+ GitHub`, `+ Portfolio`), synced cleanly with **My Profile** (`LinkedInProfileView.tsx`), **Settings → Personal Info** (`SettingsSidepanel.tsx`), clickable `mailto:`/`https:` preview/PDF anchors, and AI tailoring URL preservation (`tailor/route.ts`).
  - **Reorderable & Deletable Controls**: Reorder links vertically (`↑` / `↓`), delete individual links cleanly, or toggle **Remove Links Section** / **Restore Links Section** without discarding saved URLs. Also supports per-item clickable URLs on **Projects** (`project.url`) and **Certifications** (`certificationUrls` with index-shift helper `shiftCertificationUrlsOnDelete`).
  - **Blur-Deferred Safe Validation (`ValidatedUrlInput`)**: Normalizes handles/bare domains via `normalizeHttpUrl` while blocking unsafe schemes (`javascript:`, `data:`, `vbscript:`, `file:`), displaying `✓ Valid Link`, `✓ Auto-linked`, and warning states only after interaction (`onBlur`), alongside a 1-click **Test** button.
- **Sub-Feature 4.7 — Zero-Lag INP Resume Editing (`0ms` Typing Response):**
  - Isolated local `draftOverride` / `draftResume` state inside `A4ResumePreview.tsx` with `320ms` debounced parent sync and immediate `flushDraftResume()` on action/unmount, removed `activeResume` from the `ResizeObserver` creation `useEffect`, applied `@media screen` `.resume-sheet-containment` (`content-visibility: auto` + `@supports not` `contain: layout style paint` fallback in `globals.css`), added `saveLocalStateDebounced` (`450ms` in `storage.ts`), defaulted `updateActiveUserProfile` to `rescore = false` for text/link edits, yielded job rescoring in `rescoreJobsAsync` (`50ms` budget + `scheduler.yield()` / `setTimeout(0)`), and scoped the `1s` countdown interval strictly to `activeTab === 'jobs'`.

---

## 5. Job Market & Board Analytics Dashboard (`Analytics` Tab & `/analytics`)

**Core files:** `src/features/analytics/components/JobAnalyticsView.tsx`, `src/app/analytics/page.tsx`

- **Sub-Feature 5.1 — Top KPI Summary Cards:**
  - Tabular monospace KPI counters for **Total Active Jobs**, **Applicable Exp Fit**, **Average Match Score**, and **Pipeline Actions**.
- **Sub-Feature 5.2 — Per-Board Breakdown (`JobStreet`, `LinkedIn`, `Indeed`):**
  - Job count, market share bar, average match %, clickable top match, and quick jump to filtered `Find Jobs`.
- **Sub-Feature 5.3 — Experience Level & Work Setup Distributions:**
  - Breakdown of `Fits Your Level`, `Slight Stretch`, `Senior Warning`, and `Remote` / `Hybrid` / `Onsite`.
- **Sub-Feature 5.4 — Role Demand & Top 12 Requested Skills:**
  - Tracks funnel stages and ranks in-demand skills with 1-click `+ Add Skill` profile sync and instant job rescoring.

---

## 6. LinkedIn-Style User Profile & 2-Way Resume Sync (`My Profile` Tab)

**Core files:** `src/features/profile/components/LinkedInProfileView.tsx`, `src/lib/default-profile.ts`, `src/app/api/resume/parse/route.ts`

- **Sub-Feature 6.1 — LinkedIn-Style Header, Cover/Profile Photos & Open-to-Work Card:**
  - Custom uploaded **Cover Banner** (`1200×360` compressed, `#1e293b` Civic fallback) and circular **Profile Photo** (`320×320` compressed, monogram initials fallback) via client-side HTML5 `<canvas>` compression (`src/features/profile/lib/image-upload.ts`), with matching **Profile Photo**, **Cover Photo**, **Change Cover**, and **Reset Photos** Civic buttons synced to Supabase `profile_data` and `localStorage`, plus target salary, experience level, and editable **Open to Work** role chips.
- **Sub-Feature 6.2 — Full Inline CRUD Synced 2-Way with Resume Studio (`AI`):**
  - Edit **Experience**, **Projects**, **Licenses & Certifications**, **Education**, **Technical Skills**, and **Career Journey Markdown Vault** with instant synchronization.
- **Sub-Feature 6.3 — Resume File Upload, Hyperlink Extraction & Smart Profile Sync (`/api/resume/parse`, `ResumeUploadDialog.tsx`, `resume-parser.ts`):**
  - Parse `.pdf` (`unpdf`, plus compressed/uncompressed PDF `/URI` link annotation extraction), `.docx` (`mammoth` raw text + `mammoth.convertToHtml` `<a href>` hyperlink extraction), `.txt`, `.md`, or `.json` CVs into full `StructuredResume` (via Gemini `gemini-3.1-flash-lite` when authorized or deterministic `parseResumeTextToStructured`), restoring clickable LinkedIn, GitHub, Portfolio, project, and certification URLs automatically. Preview extracted sections in a native `<dialog>`, sync Smart Profile fields (`name`, `title`, `summary`, `skills`, `primaryRole`, `preferredRoles`, `experienceLevel`, `location`, `careerJourneyMarkdown`, `structuredResume`) to `user_profiles`, archive an `"Imported: <filename>"` snapshot in `tailored_resumes`, and open directly in **Resume Studio**.
- **Sub-Feature 6.4 — Multi-User Profile Switcher:**
  - Pre-loaded with **Mar Kevin P. Alcantara** plus `+ Add Profile` support.

---

## 7. Application Queue & Hybrid Web/Desktop Platform

**Core files:** `src/features/auto-apply/components/AutoApplyBlueprintPanel.tsx`, `electron/main.cjs`, `electron/preload.cjs`, `src/lib/storage.ts`

- **Sub-Feature 7.1 — Per-User Saved Screening Answers & Queue:**
  - Stores expected salary, notice period, work authorization, relocation preference, and queue actions (`Queue Top 3 Matches`, `Launch Assisted Apply`).
- **Sub-Feature 7.2 — Dual Web (Vercel) + Desktop (Electron) Persistence:**
  - Persists to `localStorage` and `.data/store.json` locally, falling back seamlessly to browser storage on Vercel serverless deployments.

---

## 8. Anti-AI-Slop UI Design System & Guardrails (Ruthless UI Architect Mandate)

**Enforced across:** `AGENTS.md`, `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/theme.ts`, `Pa-Hire Po/04 - Design System & Guardrails/Design - Ruthless UI Architect & Anti-AI-Slop Rules.md`

- **Persona & Stance:** You are a ruthless, opinionated UI Design Architect refusing generic, formulaic defaults that LLMs are trained on. Every UI surface must honor the Civic Career Utility standard.
- **Categorized Banned AI-Slop Tells:**
  - **Typography:** No `Inter`, `Roboto`, `Arial`, or bare `system-ui` as primary brand voice. Intentional pairing: `Plus Jakarta Sans` (display) + `Source Sans 3` (body) + `JetBrains Mono` (tabular scores). Resume sheet exclusively uses the Top 7 ranked ATS fonts (`Calibri ★ Best for ATS (#1 Default)`, `Helvetica (#2)`, `Arial (#3)`, `Garamond (#4)`, `Georgia (#5)`, `Cambria (#6)`, `Times New Roman (#7)`) with `font-variant-ligatures: none`.
  - **Color & Gradients:** No purple-on-white or purple-to-indigo "AI product" gradients; no default warm cream/sand backgrounds as a cheap "premium" shortcut; no near-black + single acid-green/lime accent dark themes (`#000000` canvas with `#f97316` or acid-neon glow).
  - **Layout & Cards:** No identical 3-column card grids without functional variation; no fake `01/02/03` step markers with no sequential dependency; no nested card-in-card soup (3+ nested borders; use `divide-y` or `border-t` hairlines); no broadsheet hairlines or zero-radius boxes used purely as decoration. Standard radius is `rounded-lg` (max `rounded-xl` on outer modal shells; never `rounded-3xl`).
  - **UI Chrome & Fake Data:** No invented metrics, fake case-study counts, phantom testimonials, or re-drawn UI chrome (fake browser frames, mobile mockups, floating code windows). No decorative `Sparkles`/`Wand2` icon spam or shouting `font-black uppercase tracking-widest` micro-labels.
  - **Motion:** No bouncy/elastic easing, random hover-scale transforms (`hover:scale-105`), or scattered micro-animations without a clear interaction purpose.
- **4 Required Rules for This Build:**
  1. **Structural Variety:** Never use `Hero -> 3-Feature Cards -> CTA -> Footer`. Invent macro-structures fitting each surface's actual purpose (discovery stream + split reading pane on `/jobs`, ledger on `/applications`, direct A4 sheet in Resume Studio).
  2. **Token Discipline:** Zero inline color or font-size values bypassing design tokens (`getThemeTokens`, `--background`, `--foreground`).
  3. **Responsive Safety:** `overflow-x: clip` on `html` and `body` (never hidden); display headers with `overflow-wrap: anywhere; min-width: 0`; zero horizontal scroll at any mobile width (375px+).
  4. **Content Truth:** Real copy, real layout pacing, and functional states (`empty`, `loading`, `error`) rather than placeholder lorem ipsum or fake statistics. Non-color-only state cues (`✓` + explicit text).

---

## 9. Vercel Store Supabase Lock, Clean Auth Surface & Admin Cloud Settings

**Core files:** `src/lib/supabase/config.ts`, `src/lib/supabase/server-env.ts`, `src/app/api/supabase/setup/route.ts`, `src/app/api/admin/platform-status/route.ts`, `src/features/auth/components/AuthScreen.tsx`, `src/features/admin/components/AdminDashboardView.tsx`, `src/features/admin/components/AdminOverviewTab.tsx`, `src/features/admin/components/AdminUserDirectoryTab.tsx`, `src/features/admin/components/AdminInfraTab.tsx`, `src/features/admin/components/AdminFreeTierCard.tsx`, `src/features/admin/components/AdminSupabaseSetupDialog.tsx`

- **Single Vercel Store Backend (`Pa-Hire Po` • `muftcprpqnzuzfosvftz`):** All authentication, Postgres RLS storage, and Storage buckets point strictly to the Vercel-integrated Supabase instance (`https://muftcprpqnzuzfosvftz.supabase.co`, env-overridable via `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`). Multi-project switchers and separate direct Supabase presets are permanently removed.
- **Pure Cryptographic Supabase Auth & Zero-Bypass Session Security:**
  - **Zero-Bypass Architecture**: Local passwordless development bypasses (`enable-local-admin`, `LOCAL_ADMIN_COOKIE`, synthetic mock sessions) are completely eliminated from `proxy.ts`, `session.ts`, and API routes. All environments authenticate strictly through real Supabase GoTrue Auth tokens.
  - **OWASP Defensive Headers (`proxy.ts`)**: Every middleware response unconditionally injects `X-Frame-Options: DENY` (anti-clickjacking), `X-Content-Type-Options: nosniff` (anti-MIME confusion), `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
  - **Brute-Force Rate Limiting (`api-rate-limiter.ts`)**: Sensitive endpoints (e.g., `/api/supabase/setup`) enforce IP bucket rate-limiting (20 requests/minute), returning `429 Too Many Requests` on abuse.
- **Clean Public `/login` & Admin-Only Infrastructure Visibility:** Centered single-column sign-in UI (`Password`, `Create Account` with 6-digit email OTP verification via `signUp` + `verifyOtp`, `Magic Link / OTP`, `Reset Password`, and Social OAuth) with zero passwordless Admin bypass, neutral blank starter profiles for non-admin users, and all Supabase/`.env`/storage diagnostics hidden from non-admin pages. Includes `/login?switch=1` active-session switching and **Settings → Connected Logins** (`linkIdentity` / `unlinkIdentity`) for linking Google or GitHub to email accounts.
- **Admin-Only 3-Tab Control Center & Live Vercel/Supabase Status (`AdminDashboardView.tsx`, `AdminOverviewTab.tsx`, `AdminUserDirectoryTab.tsx`, `AdminInfraTab.tsx`, `AdminSupabaseSetupDialog.tsx`):** Accessible 3-tab Civic console (`Overview & Platform Status` | `Users` | `Infrastructure & Free-Tier`) backed by admin-only `GET /api/admin/platform-status` (60s cache + `?force=1`), pairing live **Vercel Status** (Hobby runtime/git/cron + `vercel-status.com` + optional `VERCEL_TOKEN`) and **Supabase Status** (Auth GoTrue, Postgres DB & RLS, Storage `resumes` latency probes + `status.supabase.com`), MOC-aligned **P0 Launch Readiness**, `@container` responsive User Directory table, hairline-divided `AdminFreeTierCard`, 1-click `Copy schema.sql`, `.env` key configuration, and 13 copyable **Pa-Hire Po Auth & Security Email Templates** (`supabase/email-templates/`).


---

## 10. Legal & Compliance Infrastructure (`/privacy`, `/terms`)

**Core files:** `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/features/legal/components/LegalPageShell.tsx`, `src/features/auth/components/AuthScreen.tsx`

- **Sub-Feature 10.1 — Official Privacy Policy (`/privacy`):**
  - **Google API Services User Data Policy Compliance**: Explicitly details the requested OAuth scopes (`openid`, `profile`, `email`), user authentication and session association purpose, and strict non-selling, non-advertising, and non-AI-model-training guarantees.
  - **Data Storage & PostgreSQL Row-Level Security (RLS)**: Discloses that user profiles, resumes, and saved job applications are protected by PostgreSQL RLS where users can only access their own records.
  - **Enterprise Gemini AI Processing Disclosure**: Outlines how Resume Studio uses Google Gemini API (`gemini-3.1-flash-lite`) exclusively upon direct user invocation for stateless resume tailoring without data retention or model training.
  - **Philippine Data Privacy Act (RA 10173) & GDPR Compliance**: Details user rights (access, rectification, export, erasure) with data deletion requests handled via `markevinalcantara40@gmail.com`.
- **Sub-Feature 10.2 — Official Terms of Service (`/terms`):**
  - **Civic Career Utility Disclaimer**: Clarifies that Pa-Hire Po is a search and drafting utility, not an employer, recruiting firm, or job placement agency.
  - **Nominative Third-Party Trademark Disclaimers**: Discloses independent status and lack of affiliation or endorsement with external job portals (LinkedIn, JobStreet, Indeed).
  - **AI Resume Advisory Notice**: Establishes that AI tailoring suggestions are advisory and job seekers remain solely responsible for the factual accuracy of their resumes and applications.
  - **Intellectual Property**: Affirms that users retain 100% exclusive ownership over their resume content and work history.
- **Sub-Feature 10.3 — Civic Legal Page Shell (`LegalPageShell.tsx`):**
  - Shared client shell enforcing `Plus Jakarta Sans` headings, `Source Sans 3` body prose, `JetBrains Mono` code/dates, sticky navigation with instant Light/Dark mode toggling, and interactive anchor-linked Table of Contents.
  - Prerendered statically by Next.js (`○ /privacy`, `○ /terms`) for instant loading and SEO crawling.
- **Sub-Feature 10.4 — Public Legal Footer Links (`AuthScreen.tsx`):**
  - Centered, accessible links to `/privacy` and `/terms` rendered directly below the sign-in card on `/login`.

---

## 11. Multi-Provider Social OAuth Engine (Google Cloud & GitHub)

**Core files:** `src/features/auth/components/AuthScreen.tsx`, `src/features/settings/components/SettingsSidepanel.tsx`, `src/lib/supabase/oauth-popup.ts`, `src/app/auth/callback/route.ts`, `src/lib/supabase/config.ts`, `src/app/api/supabase/setup/route.ts`, `electron/main.cjs`, `.env`

- **Sub-Feature 11.1 — Google OAuth 2.0 Integration & Testing Mode Safeguards:**
  - Registered in Google Cloud Console (`pa-hire-po`, Client ID `250527894392-qsbvgolaggk77pdqo28lf4ha5i43623j.apps.googleusercontent.com`).
  - Configured with `muftcprpqnzuzfosvftz.supabase.co` callback.
  - **Testing Mode Strategy**: In Google Cloud Console, `supabase.co` is retained as the sole authorized domain (avoiding the Mozilla Public Suffix List `must be a top private domain` error triggered by `.vercel.app`). Test users are whitelisted directly under Audience/Test Users (supporting up to 100 testers without requiring full brand verification or custom domains).
- **Sub-Feature 11.2 — GitHub OAuth 2.0 Integration (Zero-Friction Global OAuth):**
  - Registered GitHub OAuth App (`GITHUB_CLIENT_ID="Ov23liSE1RfoLy2321xB"`, Secret `eebfc9d8c0454780542a72ebf63dfa8915ef1344`).
  - Callback: `https://muftcprpqnzuzfosvftz.supabase.co/auth/v1/callback`.
  - Zero domain restrictions, zero testing user limits; instantly live for all GitHub users worldwide.
- **Sub-Feature 11.3 — Dynamic Provider Filtering & Localhost Redirect Protection:**
  - `AuthScreen.tsx` queries `/api/supabase/setup` (`/auth/v1/settings`) dynamically so only configured providers (`Google ✓`, `GitHub ✓`) render buttons, preventing `Unsupported provider` runtime errors.
  - **Supabase URL Configuration Safeguard**: Set Supabase **Site URL** to `https://pa-hire-po.vercel.app` and added `https://pa-hire-po.vercel.app/**` to **Redirect URLs** (Allow List), eliminating `localhost refused to connect` (`ERR_CONNECTION_REFUSED`) redirection errors on Vercel production.
  - **Magic Link / OTP Fallback**: Built-in passwordless authentication requiring zero third-party developer consoles.
- **Sub-Feature 11.4 — Always-on-Top Centered OAuth Popout Window (`520×680`, `oauth-popup.ts`, `/auth/callback?popup=1`, Electron):**
  - **Browser Popout Window (`runOAuthPopupFlow`):** Launches `signInWithOAuth` and `linkIdentity` (Settings → Connected Logins) with `skipBrowserRedirect: true` in a centered `520×680` popout window above `/login` or Settings, keeping the underlying app visible behind a native `<dialog>` translucent overlay with **Bring Sign-In Window to Front** and **Cancel** buttons and re-focusing the popout on opener `focus`/`pointerdown`.
  - **Origin-Verified Callback & Auto-Close (`/auth/callback?popup=1`):** Exchanges the OAuth code, broadcasts completion via `BroadcastChannel('pa-hire-po-oauth')` + `window.opener.postMessage` (validated by `isTrustedSameOriginMessage` via `Origin.from()` / `isSameOrigin()` with opaque `"null"` rejection), and auto-closes cleanly with automatic full-page redirect fallback when popups are blocked.
  - **Electron OS-Level Always-on-Top Modal (`electron/main.cjs`):** Handles `frameName === 'pa_hire_po_oauth'` with `parent: mainWindow`, `alwaysOnTop: true`, and `setAlwaysOnTop(true, 'pop-up-menu')` for desktop users.

---

## 12. Active Progress Ledger, Verification State & Next Milestones

- **Verified Production Deployment**:
  - **Current Release Version**: `v1.0.6` (day-based versioning: `v1.0.0` Nov 14 → `v1.0.1` Nov 15 → `v1.0.2` Nov 16 → `v1.0.3` Nov 17 → `v1.0.4` Nov 18 → `v1.0.5` Nov 20 → `v1.0.6` Nov 21, synced in `package.json`, `CHANGELOG.md`, `changelog-data.ts`, and `ChangelogModal.tsx` with `NotificationBell` read tracking).
  - **Latest Verified Commit**: Updating for `v1.0.6` pre-push verification on `https://github.com/kevs0444/Pa-Hire_Po.git` branch `main` (prior live production: `d37a867`).
  - **Key File Map (`v1.0.6` Additions & Core Updates)**:
    - `src/types/resume.ts`, `src/lib/default-profile.ts` — `ResumeHeaderLink`, `headerLinks`, `hideHeaderLinks`, `customLinks`, `certificationUrls`, `project.url`, and expanded 7-font `ResumeFontFamily`.
    - `src/features/resume/lib/resume-links.ts`, `src/features/resume/components/ResumeLinksEditor.tsx` — URL normalization/validation, smart paste, `↑`/`↓` reordering, section hide/restore, and `ValidatedUrlInput`.
    - `src/features/resume/components/A4ResumePreview.tsx`, `src/features/resume/components/ResumeFormatToolbar.tsx`, `src/app/globals.css`, `src/features/jobs/components/ApplyFlowModal.tsx` — 7 ranked ATS fonts (`Calibri ★ Best for ATS`), borderless white `@media print` sheet rules, local draft INP isolation (`320ms` debounce), and `.resume-sheet-containment`.
    - `src/lib/storage.ts`, `src/components/PleaseHireMeDashboard.tsx` — `saveLocalStateDebounced`, `rescore = false` text-edit updates, yielding `rescoreJobsAsync`, and scoped `activeTab === 'jobs'` timer.
    - `src/app/api/resume/parse/route.ts`, `src/features/resume/lib/resume-parser.ts`, `src/app/api/resume/tailor/route.ts` — PDF `/URI` annotation & `.docx` HTML hyperlink extraction and AI URL preservation.
    - `src/lib/supabase/oauth-popup.ts`, `src/app/auth/callback/route.ts`, `src/features/auth/components/AuthScreen.tsx`, `src/features/settings/components/SettingsSidepanel.tsx`, `electron/main.cjs` — Centered `520×680` always-on-top OAuth popout window.
  - **Verification Commands**: `npx tsc --noEmit`, `npm run lint`, and `npm run build` (must all exit `0` pre-push).
  - **Obsidian Second Brain (Mandatory First-Read & Post-Push Sync)**: Full deep context, 22+ commit evolution timeline, System Architecture `.canvas`, Obsidian `.base` dashboards, ADRs, `Changelog Mirror.md`, and prioritized P0 vs P2 roadmap live in [`Pa-Hire Po/00 - Command Center/00 - Home MOC.md`](Pa-Hire%20Po/00%20-%20Command%20Center/00%20-%20Home%20MOC.md).
  - **Vercel Production Status**: Active and live at `https://pa-hire-po.vercel.app`.
  - **Verified Routes**:
    - `https://pa-hire-po.vercel.app/` (`200 OK`)
    - `https://pa-hire-po.vercel.app/login` (`200 OK`)
    - `https://pa-hire-po.vercel.app/privacy` (`200 OK`)
    - `https://pa-hire-po.vercel.app/terms` (`200 OK`)
    - `https://pa-hire-po.vercel.app/api/supabase/setup` (`200 OK`)
    - `https://pa-hire-po.vercel.app/api/admin/platform-status` (`401 Unauthorized` when unauthenticated — confirms live deployment)
- **Active Verified Capabilities**:
  - Multi-board concurrent job scraping (LinkedIn, JobStreet, Indeed) with Specific Title + Company search, site-scoped Internet Web Search fallback (`web-fallback.ts`), strict search correlation, and 1-click `Copy URL` (`CopyUrlButton.tsx`).
  - Smart weighted match scoring (28–98%) against user profile, ESCO-backed dynamic role library (`Top 5–10` saved target roles), and structured target salary preferences.
  - Persistent `saved`, `applied`, and `hidden` job tracking in Supabase `public.user_jobs` with immediate flush sync and non-destructive `Clear` / free-tier pruning.
  - **Job Tracking & `Resume Applied` Suite (`/applications`)**: Company application stage tracker (`Applied`, `Interviewing`, `Offer`, `Rejected`), rich `+ Add Job Application` logger with URL auto-detect & common info, inline editing, 1-click `Copy URL`, `Resume Applied` filterable snapshots, and pop-out **View Submitted Resume** `<dialog>` modal (`SubmittedResumeModal.tsx`, `public.tailored_resumes`, `/api/resumes/history`).
  - **Real-Time Notification Bell & What's New Changelog**: Live activity popover (`NotificationBell.tsx`) synced via Supabase Realtime + `BroadcastChannel`, accessible `<progress>` database loading spinners (`LoadingSpinner.tsx`), tactile Civic micro-animations, and customer-facing changelog (`CHANGELOG.md`, `ChangelogModal.tsx`).
  - **Right-Side Settings Sidepanel (`SettingsSidepanel.tsx`)**: Personal Info & Contact, Target Salary & Preferences, ESCO + Cross-Industry Dynamic Role Library search (`Top 5–10` roles via `/api/roles/search`), and end-user **Desktop App Download & Setup** (Windows `.exe` packaging via `electron-builder.json`, PWA `manifest.ts` 1-click desktop install, and collapsed developer CLI disclosure).
  - Resume Studio (`AI`) with Google Gemini 3.1 Flash-Lite tailoring, side-by-side diff, manual version archiving (`Save Version`), dynamic editable/validated/reorderable/deletable resume URLs (`ResumeLinksEditor`), 7 ranked ATS fonts (`Calibri ★ Best for ATS`), borderless PDF printing, and zero-lag INP editing.
  - LinkedIn-style profile with client-side canvas compression (`320×320` avatar, `1200×360` banner) and synced editable resume URLs (`LinkedInProfileView.tsx`, `SettingsSidepanel.tsx`, PDF/Word hyperlink import).
  - Vercel Store Supabase backend (`Pa-Hire Po` • `muftcprpqnzuzfosvftz`) with hardened RLS, automated keep-alive cron (`0 8 */4 * *`), 13 modern Civic HTML email templates (`supabase/email-templates/` — 6 Authentication + 7 Security Notifications), and Admin Control Center (`/admin`) with category filtering and 1-click copy.
  - Google OAuth (Testing Mode) + GitHub OAuth (centered always-on-top `520×680` popout window in web & Electron) + Password + Magic Link / OTP.
- **Next Strategic Milestones**:
  - [ ] **Custom Domain Setup**: Acquire/connect a custom domain (e.g. `pahirepo.com`) to Vercel and Google Cloud Console to publish Google OAuth to the global public without test user lists.
  - [ ] **Auto-Apply Queue Expansion**: Automated form filling assistant for external job boards.
  - [ ] **Interview Prep Module**: AI-powered mock interview question generator based on saved jobs and user's tailored resume.
