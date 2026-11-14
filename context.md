# Pa-Hire Po — Complete Feature & Context Breakdown

Here is the complete breakdown of **Pa-Hire Po** (formerly PleaseHireMe) features, organized into **Main Features** and **Sub-Features**:

---

## 0. Web & Desktop Landing Page + 3-Color Theme Studio

**Core files:** `src/app/page.tsx`, `src/app/jobs/page.tsx`, `src/components/LandingPageView.tsx`, `src/lib/theme.ts`, `public/pa-hire-po-logo.jpg`, `electron/open-desktop.cjs`, `open-desktop.bat`

- **Sub-Feature 0.1 — Official Branding (`Pa-Hire Po` Logo & Metadata):**
  - Displays the official `Pa-Hire Po` emblem (`/pa-hire-po-logo.jpg`) in the browser tab favicon, sticky navbar header, Hero studio showcase, and Electron desktop window icon.
- **Sub-Feature 0.2 — 3-Color UI Theme Switcher (`Dark` | `Light` | `Orange`):**
  - Combines **Black** (`Dark`), **White** (`Light`), and **Orange Studio** (`Orange`) modes paired with signature `#f97316` accents across CTAs, match rings, and active pills via `getThemeTokens`.
- **Sub-Feature 0.3 — Interactive Landing Page & 1-Click Desktop Launchers:**
  - Root `/` opens on the **Home** Landing Page with **Live Workspace Snapshot**, direct **JobStreet / LinkedIn / Indeed** board jump links, 6 workflow cards, and copy-ready commands (`npm run desktop:open`, `npm run desktop:live`, and Windows `open-desktop.bat`).

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
  - Quick-switch pills for your target roles (`Data Analyst`, `Business Intelligence Analyst`, `Junior Data Engineer`, `Data Scientist`, `AI Engineer`, or any custom role).
  - **Pivot Mode (`autoPivotRoles`)**: Automatically rotates adjacent high-overlap roles (`selectRolesForScan` & `inferDynamicRoles`) into searches and tags them with a `Pivot` badge.
- **Sub-Feature 1.4 — Multi-Country & Work-Type Targeting:**
  - Supports Philippines (`ph`), Malaysia (`my`), Singapore (`sg`), Indonesia (`id`), United States (`us`), and Global Remote (`remote`).
  - Filters by `Any`, `Remote`, `Hybrid`, or `Onsite`.
- **Sub-Feature 1.5 — Anti-Block Fallback & Deduplication:**
  - Deduplicates listings by title/company/source and upgrades fallback cards (`isFallback`) automatically whenever live postings arrive.

---

## 2. Smart Resume Matcher, Experience Analyzer & Top 3 Spotlight

**Core files:** `src/features/resume/lib/resume-analyzer.ts`, `src/features/jobs/components/TopChoicesSpotlight.tsx`

- **Sub-Feature 2.1 — Weighted `28–98%` Match Scoring (`scoreJobAgainstProfile`):**
  - **Title Alignment (`up to 38 pts`):** Matches target role and searched role keywords.
  - **Skill Coverage (`up to 40 pts`):** Compares job-required skills against your profile skills (`matchedSkills` vs `missingSkills`).
  - **Resume Context Overlap (`up to 16 pts`):** Token overlap between the full job description and your resume text.
  - **Work Setup & Location Bonus (`2–6 pts`):** Rewards matching remote/hybrid/onsite setup.
  - **Experience Fit Adjustment (`+5` / `-4` / `-15 pts`):** Boosts entry-applicable jobs and penalizes senior-only listings.
- **Sub-Feature 2.2 — Experience Needed Extractor (`extractExperienceRequirement`):**
  - Parses required years (`1–3 yrs experience`, `Fresh Grad / Entry Level`, `5+ yrs`, `Open / Not Specified`) from titles and descriptions.
  - Classifies each job into `fit` (*Matches Your Level*), `stretch` (*Slight Stretch*), or `senior-warning` (*Senior Exp Requested*).
- **Sub-Feature 2.3 — Top 3 Applicable Choices Spotlight:**
  - Pins your `#1 Choice`, `#2 Choice`, and `#3 Choice` at the top of the `Find Jobs` tab (excluding hidden, fallback, and `senior-warning` roles) with 1-click **Apply & Tailor** and **Add to Auto-Apply Queue** actions.

---

## 3. JobStreet-Inspired 2-Column Job Explorer

**Core files:** `src/components/PleaseHireMeDashboard.tsx`, `src/features/jobs/components/JobDetailPane.tsx`, `src/components/ui/BrandLogos.tsx`

- **Sub-Feature 3.1 — Master-Detail Split Layout:**
  - **Left Column:** Scrollable job cards with match score badge, official board logo, company, location, salary, `Exp Needed` pill, and top 3 matched skills.
  - **Right Column (`JobDetailPane`):** Sticky full job inspector with match score ring (`MatchScoreRing.tsx`), prominent **Experience Needed** callout banner, **"Why this fits [User]"** rationale, matched (`✓`) vs missing (`+`) skills, full scrollable job description, and tailoring tips.
- **Sub-Feature 3.2 — Official Job Board Logos (`BoardLogo`):**
  - Recognizable SVG emblems for **LinkedIn**, **JobStreet**, and **Indeed** across board toggles, filters, cards, and headers.
- **Sub-Feature 3.3 — Multi-Faceted Job Filtering & Status Tracking:**
  - Filter by status (`All Active`, `Saved`, `Applied`, `Hidden`), board (`All Sites`, `LinkedIn`, `JobStreet`, `Indeed`), **Applicable Exp Only** (`fitFilter`), keyword search, and minimum match score slider (`0%–80%`).

---

## 4. Step-by-Step Application & A4 HTML Resume Studio

**Core files:** `src/features/jobs/components/ApplyFlowModal.tsx`, `src/features/resume/components/A4ResumePreview.tsx`, `src/features/resume/lib/resume-tailor.ts`, `src/app/api/resume/tailor/route.ts`

- **Sub-Feature 4.1 — 2-Step "Apply for This Job" Flow (`ApplyFlowModal`):**
  - **Step 1 (Decision Prompt):** Asks whether you want to tailor your A4 resume for that specific job (`Yes, Tailor My A4 Resume (Step 2)`) or skip (`Skip & Open Directly on [Board]`).
  - **Step 2 (Live Tailored A4 Preview & Export):** Displays your customized A4 resume alongside **Print / Save A4 PDF** (`window.print()`) and **Open Job on [Board] & Mark Applied**.
- **Sub-Feature 4.2 — Dual Resume Tailoring Engine (Smart Local + Gemini AI):**
  - **Smart Career Journey Tailor (`tailorResumeLocally`):** Deterministically reorders your experience and project bullets by relevance to the target job, injects a role-specific summary from your Career Journey vault, and bolds matched keywords (`**SQL**`, `**Python**`, `**Power BI**`, `**83%**`).
  - **Gemini 2.5 Flash AI Tailor (`tailorWithGemini`):** Uses `process.env.GEMINI_API_KEY` from `.env` (or a custom key in the UI) with strict anti-hallucination rules, automatically falling back to the local Smart Engine if offline or rate-limited.
- **Sub-Feature 4.3 — Print-Isolated `210mm × 297mm` A4 Sheet (`#a4-resume-sheet`):**
  - Dedicated `@media print` and `@page { size: A4 portrait; margin: 8mm; }` rules in `src/app/globals.css` hide all app chrome when printing/saving to PDF.
  - Inline **"Edit Text on Sheet"** mode lets you tweak headlines, summaries, and bullet points directly on the A4 preview.

---

## 5. Job Market & Board Analytics Dashboard (`Analytics` Tab & `/analytics`)

**Core files:** `src/features/analytics/components/JobAnalyticsView.tsx`, `src/app/analytics/page.tsx`

- **Sub-Feature 5.1 — Top KPI Summary Cards:**
  - Live counters for **Total Active Jobs**, **Applicable Exp Fit** (count + % of market), **Average Match Score**, and **Pipeline Actions** (`applied` + `saved` + `queued`).
- **Sub-Feature 5.2 — Per-Board Breakdown (`JobStreet`, `LinkedIn`, `Indeed`):**
  - Shows exact job count, market share percentage bar, live status count, average match %, clickable **Top Match** card per board, and a **"View [Board] Jobs →"** button that jumps directly to `Find Jobs` filtered to that site.
- **Sub-Feature 5.3 — Experience Level & Work Setup Distributions:**
  - Visual progress bars for **Fits Your Level (Entry / 0–2 yrs)**, **Slight Stretch (3–4 yrs)**, and **Senior Warning (5+ yrs)**, plus `Remote`, `Hybrid`, `Onsite`, and `Not Specified` counts.
- **Sub-Feature 5.4 — Role Demand & Application Funnel:**
  - Ranks job volume and average match % per searched role (`Data Analyst`, `Product Analyst`, `Data Scientist`, `Junior Data Engineer`, `BI Analyst`, etc.) and tracks `Total Found` → `Applicable Exp` → `Auto-Apply Queued` → `Saved` → `Applied` → `Hidden`.
- **Sub-Feature 5.5 — Top 12 Requested Skills vs Your Profile:**
  - Ranks the most demanded skills across all discovered jobs, marking each as `✓ Matched` or offering a 1-click **`+ Add Skill`** button that adds the skill to your profile & A4 resume and immediately rescores all jobs.

---

## 6. LinkedIn-Style User Profile & 2-Way Resume Sync (`My Profile` Tab)

**Core files:** `src/features/profile/components/LinkedInProfileView.tsx`, `src/lib/default-profile.ts`, `src/app/api/resume/parse/route.ts`

- **Sub-Feature 6.1 — LinkedIn-Inspired Profile Header & Open-to-Work Card:**
  - Monochrome cover banner, avatar monogram, headline, location, graduation/scholarship highlights, target salary, experience level selector, and editable **Open to Work** role chips.
- **Sub-Feature 6.2 — Full Inline CRUD Synced 2-Way with A4 Resume:**
  - Add, edit, or delete **Experience** (roles, companies, periods, bullet points), **Projects**, **Licenses & Certifications**, **Education**, **Technical Skills**, and **Career Journey Markdown Vault** — every edit automatically updates `structuredResume`, `resumeText`, and job match scores.
- **Sub-Feature 6.3 — Resume File Upload & Parser (`/api/resume/parse`):**
  - Upload `.pdf`, `.txt`, `.md`, or `.json` resumes to automatically extract skills, summary text, and suggested roles.
- **Sub-Feature 6.4 — Multi-User Profile Switcher:**
  - Pre-loaded with **Mar Kevin P. Alcantara**'s full RTU / LUXASIA LEAP / Phoenix Petroleum / Denso Ten profile, plus **`+ Add User Profile`** (`createBlankUserProfile`) to switch between multiple users with isolated resumes and scores.

---

## 7. Automated Application Co-Pilot & Hybrid Web/Desktop Platform

**Core files:** `src/features/auto-apply/components/AutoApplyBlueprintPanel.tsx`, `electron/main.cjs`, `electron/preload.cjs`, `src/lib/storage.ts`

- **Sub-Feature 7.1 — Per-User Saved Screening Answers:**
  - Stores expected salary, notice period/availability, work authorization, relocation readiness, `Auto-Tailor A4 Resume` toggle, and `Confirm Before Submit` gate.
- **Sub-Feature 7.2 — Interactive Auto-Apply Queue:**
  - Queue individual jobs or click **Queue Top 3 Applicable Choices**, inspect queued items in one list, and trigger **Launch Assisted Apply** per listing.
- **Sub-Feature 7.3 — Dual Web (Vercel) + Desktop (Electron) Runtime:**
  - Runs in any web browser (`http://localhost:3000`), deploys to Vercel, and includes an Electron desktop wrapper (`electron/main.cjs` + `window.electronAPI`) for native Windows desktop execution (`npm run desktop`).
- **Sub-Feature 7.4 — Hybrid Local + Browser Persistence (`storage.ts` & `/api/state`):**
  - Persists profiles, jobs, theme (`Dark B&W` / `Light B&W`), and queues to both `localStorage` and `.data/store.json` locally, with automatic fallback to browser storage on serverless deployments.
