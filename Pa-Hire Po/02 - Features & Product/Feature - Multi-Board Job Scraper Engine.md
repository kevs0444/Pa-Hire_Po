---
type: feature
status: verified
priority: p0-now
area: jobs
milestone: v1.0.5
commit_ref: "ce581df"
files:
  - src/app/api/jobs/search/route.ts
  - src/server/services/job-search-service.ts
  - src/server/scrapers/linkedin.ts
  - src/server/scrapers/jobstreet.ts
  - src/server/scrapers/indeed.ts
  - src/server/scrapers/web-fallback.ts
  - src/components/ui/CopyUrlButton.tsx
updated: 2026-11-20
tags:
  - pahirepo
  - feature
  - scrapers
---

# Feature — Multi-Board Job Scraper Engine

## Purpose & User Outcome
Concurrently extracts live job listings across **LinkedIn**, **JobStreet**, and **Indeed** for a specific **Job Title** and optional **Company Name**, falling back to site-scoped Internet Web Search when boards rate-limit, enforcing strict search correlation, and letting users copy any listing URL in one click.

## Sub-Features & Behavior
- **3-Board Deeper Concurrent Extraction (`20–24` jobs/board):**
  - **LinkedIn:** Multi-page Guest Search API (`start=0` & `start=25`, parsed via `cheerio`), enriches top 8 postings via `jobPosting/{jobId}`, falls back to `ts-jobspy`, and triggers `searchInternetForBoardJobs` if `< 3` hits or insufficient company matches.
  - **JobStreet:** JobStreet v5 JSON API (`/api/jobsearch/v5/search`, `pageSize=24`) across `PH-Main`, `MY-Main`, `SG-Main`, and `ID-Main`, falls back to direct HTML/JSON-LD `JobPosting` extraction, and escalates to `searchInternetForBoardJobs`.
  - **Indeed:** `ts-jobspy` (`scrapeJobs`), direct HTML mosaic card extraction, and `searchInternetForBoardJobs`.
- **Site-Scoped Internet Web Search Fallback (`web-fallback.ts`):** Queries `DuckDuckGo HTML`, `Yahoo Search HTML`, and `ts-jobspy` Google Jobs with board-scoped `site:` filters to extract real individual job URLs, titles, company names, and snippets whenever direct scrapers are challenged.
- **Specific Title + Company Search & Strict Correlation:** `parseRoleAndCompanyQuery` parses dedicated **Company Name (Optional)** or `"Role at Company"` queries without overwriting `Profile.primaryRole`; `filterBySearchCorrelation` filters uncorrelated noise and boosts exact Company (`+12`) and Title (`+6`) matches while replacing stale unsaved `suggested` jobs on explicit search.
- **1-Minute Auto-Refresh + 1-Click `CopyUrlButton.tsx`:** Preserves active Title/Company search across 60s auto-refreshes and provides 1-click `Copy URL` across Job Cards, `JobDetailPane.tsx`, and `TopChoicesSpotlight.tsx`.
- **Dynamic Role Choices, Pivot Mode & Multi-Country Targeting:** Supports `ph`, `my`, `sg`, `id`, `us`, and Global `remote`, plus `Any`, `Remote`, `Hybrid`, and `Onsite` filters.

## Code Map
- API Route: `src/app/api/jobs/search/route.ts` (`maxDuration = 30`, rate limit `30 req / 60s`)
- Orchestrator: `src/server/services/job-search-service.ts` (`SCRAPE_CACHE_TTL_MS = 50_000`, `TtlCache(250)`)
- Scrapers: `src/server/scrapers/{linkedin,jobstreet,indeed,web-fallback}.ts`
- Copy Control: `src/components/ui/CopyUrlButton.tsx`

## Related Notes
- [[Feature - Match Scorer & Experience Analyzer]]
- [[Feature - 2-Column Job Explorer & Date Sorting]]
- [[Architecture - Rate Limiting, Caching & Security]]
