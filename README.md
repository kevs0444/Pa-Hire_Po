# PleaseHireMe

> *Because manually refreshing LinkedIn, JobStreet, and Indeed is a full-time job.*

**PleaseHireMe** is a dual **Web App + Electron Desktop App** for automated job discovery, live job market analytics, LinkedIn-style multi-user profile management, and per-job **A4 HTML Resume** tailoring — built with Next.js 16, TypeScript, Tailwind CSS v4, and an optional Electron desktop shell.

---

## Key Features

### 1. Live Multi-Board Job Finder (`Find Jobs`)
- **3-Board Concurrent Scraper Engine**: Searches **LinkedIn** (Guest API + `cheerio` + `ts-jobspy`), **JobStreet** (v5 JSON API across `PH-Main`, `MY-Main`, `SG-Main`, `ID-Main`), and **Indeed** (`ts-jobspy`) with official SVG board logos and direct search fallbacks if a board rate-limits.
- **5-Second Live Auto-Refresh + Manual Scan**: Toggle `Off`, `5s Live`, `15s`, or `30s` non-overlapping live polling alongside manual **Find Jobs Now**.
- **Top 3 Applicable Choices Spotlight**: Surfaces `#1 Choice`, `#2 Choice`, and `#3 Choice` tailored to your active user profile and experience level.
- **Experience Needed Emphasis**: Extracts years/seniority (`Open / Not Specified`, `1–3 yrs experience`, `5+ yrs`, etc.) and classifies each posting as `fit`, `stretch`, or `senior-warning`.
- **JobStreet-Inspired 2-Column Explorer**: Master job list on the left, sticky full job details pane on the right with `28–98%` match scoring, skill match/gap pills, and tailoring tips.

### 2. Job Market Analytics & Auto-Apply Co-Pilot (`Analytics` & `/analytics`)
- **Jobs Per Board Breakdown**: Exact counts, market share %, average match score, and top-scoring listing for **JobStreet**, **LinkedIn**, and **Indeed**.
- **Experience & Work Setup Insights**: Distribution across Entry/Applicable vs Stretch vs Senior roles, plus `Remote`, `Hybrid`, `Onsite`, and role demand rankings.
- **Top 12 Requested Skills**: Compare live job requirements against your resume skills with 1-click `+ Add Skill` rescoring.
- **Auto-Apply Co-Pilot & Queue**: Save per-user screening answers (expected salary, notice period, work authorization), queue jobs (`Queue Top 3 Applicable Choices`), and prepare for Electron BrowserView assisted submission.

### 3. LinkedIn Profile & Step-by-Step A4 HTML Resume Studio (`My Profile` & `A4 Resume`)
- **2-Way Synced LinkedIn-Style Profile**: Add/edit Experience, Projects, Licenses & Certifications, Education, Skills, and Career Journey — synced automatically to your A4 resume sheet and job scorer.
- **Step-by-Step Apply Flow**: Clicking **Apply for This Job (Tailor A4 Resume)** prompts whether to customize your `210mm × 297mm` print-ready A4 resume for that specific job (`tailorResumeLocally` or optional **Gemini 2.5 Flash** via `GEMINI_API_KEY`) before opening the board link.
- **Monochrome Black & White UI**: Supports both Dark B&W and Light B&W themes.

---

## Project Architecture

```text
├── electron/                    # Optional Electron Desktop App shell (main.cjs, preload.cjs, launch-dev.cjs)
├── src/
│   ├── app/                     # Next.js App Router pages (/, /analytics) & API routes (/api/*)
│   ├── components/
│   │   ├── PleaseHireMeDashboard.tsx
│   │   └── ui/                  # BrandLogos.tsx, MatchScoreRing.tsx
│   ├── features/
│   │   ├── analytics/           # JobAnalyticsView.tsx
│   │   ├── auto-apply/          # AutoApplyBlueprintPanel.tsx & types.ts
│   │   ├── jobs/                # TopChoicesSpotlight, JobDetailPane, ApplyFlowModal, HowItWorksModal
│   │   ├── profile/             # LinkedInProfileView.tsx
│   │   └── resume/              # A4ResumePreview.tsx, resume-analyzer.ts, resume-tailor.ts
│   ├── server/scrapers/         # linkedin.ts, jobstreet.ts, indeed.ts
│   ├── lib/                     # default-profile.ts, storage.ts, utils.ts
│   └── types/                   # Shared TypeScript interfaces
```

---

## Local Development (Web + Desktop)

### 1. Run the Web App
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (and [http://localhost:3000/analytics](http://localhost:3000/analytics)).

### 2. Optional AI Resume Tailoring (`.env`)
Create a `.env` file in the repository root (ignored by git via `.gitignore`) to enable Gemini 2.5 Flash tailoring alongside the local Smart Engine:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run as an Electron Desktop App
```bash
npm run desktop:install   # One-time devDependency install (skipped by Vercel)
npm run dev               # Terminal 1: Start local server
npm run desktop           # Terminal 2: Launch Electron desktop window
```

---

## Git Workflow & Deploying to Vercel

- Keep `main` clean for production-ready releases (import this GitHub repo into **Vercel** so pushes to `main` deploy automatically).
- For upcoming features (such as Electron BrowserView Auto-Apply Phase 2), create a feature branch before merging to `main`:
  ```bash
  git checkout -b feat/your-feature-name
  # develop & verify locally (npm run lint && npm run build)
  git push -u origin feat/your-feature-name
  # open a PR / merge into main when ready
  ```
