---
type: feature
status: verified
priority: p0-now
area: jobs
milestone: v1-pleasehireme
commit_ref: "94ac0e1"
files:
  - src/app/api/jobs/search/route.ts
  - src/server/services/job-search-service.ts
  - src/server/scrapers/linkedin.ts
  - src/server/scrapers/jobstreet.ts
  - src/server/scrapers/indeed.ts
updated: 2026-11-16
tags:
  - pahirepo
  - feature
  - scrapers
---

# Feature — Multi-Board Job Scraper Engine

## Purpose & User Outcome
Concurrently aggregates live job listings across **LinkedIn**, **JobStreet**, and **Indeed** into a single deduplicated feed, eliminating repetitive multi-tab manual searching.

## Sub-Features & Behavior
- **3-Board Concurrent Scrapers:**
  - **LinkedIn:** Queries LinkedIn Guest Search API (`seeMoreJobPostings/search`) parsed with `cheerio`, enriches top results via `jobPosting/{jobId}`, and falls back to `ts-jobspy`.
  - **JobStreet:** Queries JobStreet v5 JSON API (`/api/jobsearch/v5/search`) across `PH-Main`, `MY-Main`, `SG-Main`, and `ID-Main`.
  - **Indeed:** Fetches live regional postings via `ts-jobspy` (`scrapeJobs`).
- **Live Auto-Refresh & Manual Scan:** Toggle `Off`, `5s Live`, `15s`, or `30s` non-overlapping polling (`scanInFlightRef` guard prevents duplicate concurrent requests) alongside manual **Find Jobs Now**.
- **Dynamic Role Choices & Compound `/` Expansion:** Default target role is **`Data Analyst / Junior Data Analyst`**. Compound `/` roles expand into separate clean board queries while scoring both title variants cleanly.
- **Pivot Mode (`autoPivotRoles`):** Rotates adjacent high-overlap roles (`selectRolesForScan` & `inferDynamicRoles`) into scans and tags them with a `Pivot` badge (`limit = 6` vs `12` primary).
- **Multi-Country & Work-Type Targeting:** Supports `ph`, `my`, `sg`, `id`, `us`, and Global `remote`, plus `Any`, `Remote`, `Hybrid`, and `Onsite` filters.
- **Anti-Block Fallback & Deduplication:** Deduplicates by title/company/source and upgrades `isFallback` placeholder cards automatically when live results arrive.

## Code Map
- API Route: `src/app/api/jobs/search/route.ts` (`maxDuration = 30`, rate limit `30 req / 60s`)
- Orchestrator: `src/server/services/job-search-service.ts` (`SCRAPE_CACHE_TTL_MS = 90_000`, `TtlCache(250)`)
- Scrapers: `src/server/scrapers/{linkedin,jobstreet,indeed}.ts`

## Related Notes
- [[Feature - Match Scorer & Experience Analyzer]]
- [[Feature - 2-Column Job Explorer & Date Sorting]]
- [[Architecture - Rate Limiting, Caching & Security]]
