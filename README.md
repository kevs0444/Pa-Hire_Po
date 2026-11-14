# Pa-Hire Po

> *Minimalist multi-board job finder & AI-powered dynamic Resume Studio across LinkedIn, JobStreet, and Indeed.*

**Pa-Hire Po** (`pa-hire-po`) is a hybrid **Web App + Electron Desktop App** built with a **Civic Career Utility** UI (LinkedIn × JobStreet Light Civic default + Dark Slate mode) for multi-board job discovery, market analytics, LinkedIn-style profile sync, and personal-AI resume tailoring in **Resume Studio (`AI`)** — powered by Next.js 16, TypeScript, Tailwind CSS v4, and optional Electron.

---

## Key Features

### 0. Civic Career Utility UI & Workspace Overview (`Home` / `/`)
- **Anti-AI-Slop Utilitarian Craft**: Light Civic default (`#F3F2EF` canvas, `#FFFFFF` panels, `#0A66C2` civic blue accents, `3px` active left border) and Dark Slate (`#0B0F17` / `#111827`), paired with `Plus Jakarta Sans`, `Source Sans 3`, and `JetBrains Mono` (`tabular-nums`).
- **Official Pa-Hire Po Branding**: Displays `/pa-hire-po-logo.jpg` and `/favicon.ico` across the navbar, workspace overview, and Electron desktop window icon.
- **Quick Launchers**: Direct board shortcuts for **JobStreet**, **LinkedIn**, and **Indeed**, quick access to **Resume Studio (`AI`)**, and copy-ready Electron CLI commands.

### 1. Live Multi-Board Job Finder (`Find Jobs` / `/jobs`)
- **3-Board Concurrent Scraper Engine**: Searches **LinkedIn** (Guest API + `cheerio` + `ts-jobspy`), **JobStreet** (v5 JSON API across `PH-Main`, `MY-Main`, `SG-Main`, `ID-Main`), and **Indeed** (`ts-jobspy`) with authentic SVG board logos, compound `/` role query expansion (default target role **`Data Analyst / Junior Data Analyst`**), and safe search fallbacks.
- **5-Second Live Auto-Refresh + Manual Scan**: Toggle `Off`, `5s Live`, `15s`, or `30s` non-overlapping live polling alongside manual **Find Jobs**.
- **Recommended Top 3 Strip**: Surfaces top 3 applicable listings for your active profile and experience level without noisy marketing banners.
- **2-Column Master-Detail Explorer**: Left job feed (`border-l-[3px]` selection indicator, `✓` high-match pills) paired with a clean single-surface job detail inspector (`JobDetailPane`) and semantic `MatchScoreRing`.

### 2. Job Market Analytics & Application Queue (`Analytics` / `/analytics`)
- **Board & Experience Breakdowns**: Exact counts, market share bars, average match score (`font-mono tabular-nums`), experience fit tiers (`fit`, `stretch`, `senior-warning`), and work setup distribution.
- **Top 12 Requested Skills**: Compare live job requirements against your resume with 1-click `+ Add Skill` profile rescoring.
- **Saved Screening Answers & Queue**: Store expected salary, notice period, and work authorization per user and queue jobs cleanly (`Queue Top 3 Matches`).

### 3. LinkedIn Profile & Dynamic `Resume Studio` (`AI`) (`My Profile` & `Resume Studio [AI]`)
- **2-Way Synced LinkedIn-Style Profile**: Add/edit Experience, Projects, Certifications, Education, Skills, and Career Journey — synced automatically to **Resume Studio (`AI`)** and the job scorer.
- **Dynamic Resume Page Size (Default A4) & Top 5 AI-ATS Fonts**: Preview and export **A4 (`210 × 297 mm`, default)**, **US Letter (`8.5 × 11 in`)**, **US Legal (`8.5 × 14 in`)**, or **Dynamic Auto-Fit**, with `Compact` / `Standard` / `Comfortable` density controls and **Top 5 AI-ATS & Researcher Fonts** (**Calibri**, **Helvetica**, **Garamond**, **Arial**, **Georgia**) using ligature-safe (`font-variant-ligatures: none`) `@page` print CSS.
- **Personal Gemini AI Integration & Side-by-Side Change Highlighting**: Automatically uses your personal server-side `GEMINI_API_KEY` from `.env` (`gemini-3.1-flash-lite` primary model with `gemini-flash-lite-latest` and deterministic local Smart Career Journey fallback), displaying a **Personal AI Active** status badge plus **Side-by-Side Compare** (`Base CV` vs. `AI Tailored CV`) and live **Highlight AI Changes** overlays.
- **Native Top-Layer `<dialog>` Application Flow**: Semantic `<dialog>` workflow (`showModal()`, `closedby="any"` + backdrop light-dismiss) lets you tailor your resume before opening the job link and marking it applied.

---

## Project Architecture

```text
├── AGENTS.md                    # Next.js 16 rules + Anti-AI-Slop UI design guardrails
├── context.md                   # Complete feature & UI architecture reference
├── public/                      # Official pa-hire-po-logo.jpg & favicon assets
├── electron/                    # Optional Electron Desktop shell (main.cjs, preload.cjs, open-desktop.cjs)
├── open-desktop.bat             # Windows 1-click desktop launcher
├── src/
│   ├── app/                     # Next.js 16 App Router pages (/, /jobs, /analytics) & API routes (/api/*)
│   ├── components/
│   │   ├── LandingPageView.tsx
│   │   ├── PleaseHireMeDashboard.tsx
│   │   └── ui/                  # BrandLogos.tsx, MatchScoreRing.tsx
│   ├── features/
│   │   ├── analytics/           # JobAnalyticsView.tsx
│   │   ├── auto-apply/          # AutoApplyBlueprintPanel.tsx & types.ts
│   │   ├── jobs/                # TopChoicesSpotlight, JobDetailPane, ApplyFlowModal, HowItWorksModal
│   │   ├── profile/             # LinkedInProfileView.tsx
│   │   └── resume/              # A4ResumePreview.tsx (Resume Studio AI), resume-analyzer.ts, resume-tailor.ts
│   ├── server/scrapers/         # linkedin.ts, jobstreet.ts, indeed.ts
│   ├── lib/                     # default-profile.ts, storage.ts, theme.ts, utils.ts
│   └── types/                   # Shared TypeScript interfaces (ResumePageSize, ResumeDensity, etc.)
```

---

## Local Development & Personal API Setup

### 1. Run the Web App
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000), [http://localhost:3000/jobs](http://localhost:3000/jobs), or [http://localhost:3000/analytics](http://localhost:3000/analytics).

### 2. Personal Gemini API Tailoring (`.env` / Vercel Env Var)
Set your personal `GEMINI_API_KEY` in `.env` locally (gitignored) and in your Vercel Project Environment Variables for hosted deployments:
```env
GEMINI_API_KEY=your_personal_gemini_api_key
```
`POST /api/resume/tailor` uses your personal `.env` key automatically (`gemini-3.1-flash-lite`) without requiring you to re-enter it in the browser.

### 3. Open the Electron Desktop App
```bash
npm run desktop:install   # One-time devDependency install (skipped by Vercel)
npm run desktop:open      # 1-click launcher (auto-starts localhost:3000 + Electron, or double-click open-desktop.bat)
npm run desktop:live      # Launches Electron connected directly to https://pa-hire-po.vercel.app
```

---

## Verification & Deploying to Vercel

```bash
npm run lint
npm run build
git add -A
git commit -m "feat: dynamic Resume Studio AI, personal Gemini API, and anti-slop UI rules"
git push origin main
```
Pushes to `main` on `https://github.com/kevs0444/PleaseHireMe.git` trigger automatic production deployments on Vercel.
