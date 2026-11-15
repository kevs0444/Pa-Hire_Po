# Pa-Hire Po — Complete Feature & Context Breakdown

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

**Core files:** `src/app/api/jobs/search/route.ts`, `src/server/scrapers/linkedin.ts`, `src/server/scrapers/jobstreet.ts`, `src/server/scrapers/indeed.ts`

- **Sub-Feature 1.1 — 3-Board Concurrent Scraping:**
  - **LinkedIn Scraper:** Queries LinkedIn's Guest Search API (`seeMoreJobPostings/search`) parsed with `cheerio`, enriches top listings via `jobPosting/{jobId}`, and falls back to `ts-jobspy`.
  - **JobStreet Scraper:** Queries the JobStreet v5 JSON API (`/api/jobsearch/v5/search`) across `PH-Main`, `MY-Main`, `SG-Main`, and `ID-Main`.
  - **Indeed Scraper:** Fetches live postings via `ts-jobspy` (`scrapeJobs`) mapped to regional Indeed country targets.
- **Sub-Feature 1.2 — 5-Second Live Auto-Refresh + Manual Scan:**
  - Manual **"Find Jobs Now"** button for instant on-demand scraping.
  - Non-overlapping auto-refresh timer (`Off` | `5s Live` | `15s` | `30s`) with live second-by-second countdown (`scanInFlightRef` prevents overlapping requests).
- **Sub-Feature 1.3 — Dynamic Role Choices & Pivot Mode:**
  - Quick-switch pills for your target roles (default **`Data Analyst / Junior Data Analyst`**, plus `Data Analyst`, `Junior Data Analyst`, `Business Intelligence Analyst`, `Junior Data Engineer`, `Data Scientist`, `AI Engineer`, or any custom role). Compound `/` roles automatically expand into separate clean job-board search queries while scoring both title variants cleanly.
  - **Pivot Mode (`autoPivotRoles`):** Automatically rotates adjacent high-overlap roles (`selectRolesForScan` & `inferDynamicRoles`) into searches and tags them with a `Pivot` badge.
- **Sub-Feature 1.4 — Multi-Country & Work-Type Targeting:**
  - Supports Philippines (`ph`), Malaysia (`my`), Singapore (`sg`), Indonesia (`id`), United States (`us`), and Global Remote (`remote`).
  - Filters by `Any`, `Remote`, `Hybrid`, or `Onsite`.
- **Sub-Feature 1.5 — Anti-Block Fallback & Deduplication:**
  - Deduplicates listings by title/company/source and upgrades fallback cards (`isFallback`) automatically whenever live postings arrive.
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

## 3. LinkedIn × JobStreet 2-Column Job Explorer

**Core files:** `src/components/PleaseHireMeDashboard.tsx`, `src/features/jobs/components/JobDetailPane.tsx`, `src/components/ui/BrandLogos.tsx`

- **Sub-Feature 3.1 — Master-Detail Split Layout:**
  - **Left Column (`lg:col-span-5`):** Scannable `rounded-lg` job cards with `3px` left accent border on active selection, authentic board logo, company, location, salary, experience badge, and `✓` prefixed high-match pills (`>= 75%`).
  - **Right Column (`JobDetailPane`):** Single-surface reading panel separated by hairline dividers with semantic `MatchScoreRing` (`#057642` emerald `>=75%`, `#0a66c2` blue `>=55%`), experience alignment rationale, matched (`✓`) vs missing (`+`) skills, and full description.
- **Sub-Feature 3.2 — Official Job Board Logos (`BoardLogo`):**
  - Authentic full-brand SVG emblems (`#0A66C2` LinkedIn, `#0D3880` JobStreet SEEK glyph, `#003A9B` Indeed).
- **Sub-Feature 3.3 — Multi-Faceted Job Filtering & Status Tracking:**
  - Filter by status (`All Active`, `Saved`, `Applied`, `Hidden`), board (`All Sites`, `LinkedIn`, `JobStreet`, `Indeed`), **Applicable Exp Only** (`fitFilter`), keyword search, and minimum match score slider (`0%–80%`).

---

## 4. Step-by-Step Application & Dynamic Resume Studio (`AI`)

**Core files:** `src/features/jobs/components/ApplyFlowModal.tsx`, `src/features/resume/components/A4ResumePreview.tsx`, `src/features/resume/lib/resume-tailor.ts`, `src/app/api/resume/tailor/route.ts`

- **Sub-Feature 4.1 — Native Top-Layer `<dialog>` Application Flow (`ApplyFlowModal` & `HowItWorksModal`):**
  - Uses native HTML `<dialog>` (`showModal()`, `closedby="any"` + pointer light-dismiss fallback, `aria-labelledby`, `overscroll-behavior: contain` backdrop containment).
  - **Step 1:** Offers direct board application or 1-click AI tailoring in **Resume Studio (`AI`)**.
  - **Step 2:** Renders live tailored resume preview with dynamic sizing, **Print / Save PDF**, and **Continue to [Board] & Mark Applied**.
- **Sub-Feature 4.2 — Personal Gemini API (`gemini-3.1-flash-lite`) + Smart Local Fallback + Side-by-Side Diff:**
  - Automatically prioritizes server-side personal `process.env.GEMINI_API_KEY` from `.env` (`GET /api/state` and `GET /api/resume/tailor` expose `personalApiConfigured` without ever leaking the secret to client bundles).
  - Calls `gemini-3.1-flash-lite` (fallback `gemini-flash-lite-latest` → `gemini-2.5-flash` → deterministic `tailorResumeLocally`) with strict anti-hallucination grounding rules. Displays **Personal AI Active** badge in the studio toolbar.
  - **Side-by-Side Comparison & AI Change Highlighting:** When tailored by AI, toggle **Side-by-Side Compare** (`Base Profile CV` vs. `AI Tailored CV`) and **Highlight AI Changes** (color-coded indicators + `✓ AI Tailored` / `↑ Reordered` tags on modified headlines, tailored summaries, rewritten bullets, skill updates, and bolded keywords, stripped cleanly during PDF printing).
- **Sub-Feature 4.3 — Dynamic Resume Paper Sizing (Default A4 `210 × 297 mm`) & Top 5 AI-ATS / Researcher Fonts:**
  - Supports **A4 (Default • `210 × 297 mm`)**, **US Letter (`8.5 × 11 in`)**, **US Legal (`8.5 × 14 in`)**, and **Dynamic (`Auto Fit Content`)**, plus **Density** (`Compact`, `Standard`, `Comfortable`).
  - Includes live **ATS Font** selector grounded for AI/LLM parsers and research/technical roles: **Calibri** (Default • #1 AI ATS Standard), **Helvetica** (#2 Tech & Engineering), **Garamond** (#3 Researcher & Academic), **Arial** (#4 Universal Legacy ATS), and **Georgia** (#5 High-Contrast Research Serif).
  - Enforces `font-variant-ligatures: none` and dynamic `@media print { @page { size: ...; margin: 8mm; } }` on `#a4-resume-sheet` so exported PDFs avoid ligature corruption in Workday/Greenhouse/Lever/PDFBox parsers.

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
- **Sub-Feature 6.3 — Resume File Upload & Parser (`/api/resume/parse`):**
  - Parse `.pdf`, `.txt`, `.md`, or `.json` CVs into skills, summary text, and inferred roles.
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

## 8. Anti-AI-Slop UI Design System & Guardrails

**Enforced across:** `AGENTS.md`, `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/theme.ts`

- **Banned Patterns:** Pure black (`#000000`) + neon orange (`#f97316`), `blur-3xl` glow orbs, purple/indigo AI gradients, `rounded-3xl` bubble cards, nested 3-layer cards, `Sparkles`/`Wand2` decorative icons, `Stage 1–4` / `01–03` filler cards, generic `Inter`/`Geist`/`system-ui` display typography, and `fixed inset-0` overlay `<div>` modals.
- **Enforced Craft:** `Plus Jakarta Sans` + `Source Sans 3` + `JetBrains Mono` (`tabular-nums`), warm `#F3F2EF` / crisp `#FFFFFF` civic palette, hairline `divide-y` sections, native `<dialog>` modals, root `color-scheme: light dark`, non-color-only state cues (`✓` + explicit labels), uniform Civic action buttons (`rounded-lg border px-3 py-1.5 text-xs font-medium`), and client-side compressed LinkedIn profile media (`320×320` avatar, `1200×360` cover banner via `<Image unoptimized />`).
