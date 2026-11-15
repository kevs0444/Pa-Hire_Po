# Date Recency Filter & Job Sorting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Date Recency Filter (`All Time`, `Past 24h`, `Past Week`, `Past Month`) and Sorting Dropdown (`Best Match`, `Newest First`, `Oldest First`) to the Job Explorer in Pa-Hire Po, backed by a unified cross-board date normalization utility.

**Architecture:** A pure client-side date parsing and filtering/sorting engine in `src/features/jobs/lib/job-date-utils.ts` that unifies varied board date formats (LinkedIn/Indeed ISO strings, JobStreet relative strings, fallback timestamps) with high fidelity, integrated into `PleaseHireMeDashboard.tsx`'s filter bar and job listing cards with Civic Career Utility styling.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Lucide React (`Calendar`, `ArrowUpDown`, `Clock`).

**Spec:** Option A (Instant client-side filter + dedicated sort dropdown; all scraped jobs cached; zero re-scrape delay).

---

## Global Constraints
- Strictly adhere to `AGENTS.md` Civic Career Utility design rules:
  - Palette: Light Civic (`#f3f2ef` canvas, `#ffffff` cards, `#0a66c2` accent) and Dark Slate (`#0b0f17` canvas, `#111827` cards).
  - Typography: `Plus Jakarta Sans` display, `Source Sans 3` body, `JetBrains Mono` tabular metrics (`font-mono tabular-nums`).
  - Strict Bans: No `Sparkles`, `Wand2`, `rounded-3xl`, neon glows, or arbitrary gradients.
- Non-destructive filtering: Filtering by date or changing sort order MUST NOT discard cached jobs from `.data/store.json` or `localStorage`.
- Zero ESLint / TypeScript errors (`npm run lint` and `npm run build` must exit 0).

---

## Review Focus
1. **Relative Date Parsing (`1h ago`, `2d ago`, `15d ago`)**: Must compute timestamps relative to `job.discoveredAt` (when scraped) or fallback to current time rather than failing or returning `NaN`.
2. **ISO Date Parsing (`YYYY-MM-DD`)**: Must parse cleanly across timezones without shifting by a full calendar day.
3. **Fallback Strings (`Recently posted`, `Live search link`)**: Must fall back gracefully to `job.discoveredAt` instead of disappearing from date-filtered views.
4. **Stable Dual-Key Sorting**: When sorting by `newest` or `oldest`, fallback jobs must remain deprioritized after live postings, with `matchScore` acting as the secondary tie-breaker.
5. **Interactive UI Responsiveness**: Date filter and sort dropdown changes must recompute `filteredJobs` instantaneously without lag.

---

### Task 1: Create Cross-Board Job Date Utility (`job-date-utils.ts`)

**Files:**
- Create: `src/features/jobs/lib/job-date-utils.ts`
- Test: `src/features/jobs/lib/job-date-utils.test.ts` (or standalone validation script)

**Interfaces:**
- Produces:
  ```ts
  export type DateFilterOption = 'all' | '24h' | '7d' | '30d';
  export type SortOption = 'match' | 'newest' | 'oldest';

  export function parseJobTimestamp(job: {
    postedAt?: string | null;
    discoveredAt?: string | null;
  }): number;

  export function formatJobDateLabel(job: {
    postedAt?: string | null;
    discoveredAt?: string | null;
  }): string;

  export function filterJobsByDate<T extends { postedAt: string; discoveredAt: string }>(
    jobs: T[],
    filter: DateFilterOption,
    referenceNow?: number
  ): T[];

  export function sortJobs<T extends { postedAt: string; discoveredAt: string; matchScore: number; isFallback?: boolean }>(
    jobs: T[],
    sortBy: SortOption
  ): T[];
  ```

- [ ] **Step 1: Write unit tests covering ISO strings, relative strings (`1h ago`, `3d ago`), fallbacks, filtering windows, and sorting orders**
- [ ] **Step 2: Run test / verification command to verify initial test run**
- [ ] **Step 3: Implement `parseJobTimestamp`, `formatJobDateLabel`, `filterJobsByDate`, and `sortJobs` in `src/features/jobs/lib/job-date-utils.ts`**
- [ ] **Step 4: Run tests and ensure all parsing, filtering, and sorting assertions pass**
- [ ] **Step 5: Commit `job-date-utils.ts` and test suite**

---

### Task 2: Integrate Date Filter & Sort Controls into `PleaseHireMeDashboard.tsx`

**Files:**
- Modify: `src/components/PleaseHireMeDashboard.tsx`
- Types: `src/types/job.ts` (export `DateFilterOption` and `SortOption` or re-export from `job-date-utils`)

**Interfaces:**
- Consumes: `parseJobTimestamp`, `formatJobDateLabel`, `filterJobsByDate`, `sortJobs`, `DateFilterOption`, `SortOption`
- Produces: Reactive `dateFilter` and `sortBy` state in `PleaseHireMeDashboard.tsx`

- [ ] **Step 1: Add `dateFilter` and `sortBy` state to `PleaseHireMeDashboard.tsx`**
  ```tsx
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('match');
  ```
- [ ] **Step 2: Update `filteredJobs` memo pipeline to apply date filtering and sorting**
  - Chain `statusFilter` -> `sourceFilter` -> `fitFilter` -> `minScore` -> `searchQuery` -> `filterJobsByDate(..., dateFilter)` -> `sortJobs(..., sortBy)`.
- [ ] **Step 3: Add Date Filter and Sort dropdowns to the Job Explorer toolbar**
  - Date Filter select: with `Calendar` icon (`All Dates`, `Past 24h`, `Past Week`, `Past Month`).
  - Sort select: with `ArrowUpDown` icon (`Best Match`, `Newest First`, `Oldest First`).
  - Style both using Civic Career Utility tokens (`inputSurface`, `rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:outline-none`).
- [ ] **Step 4: Enhance job cards in the left feed to display the formatted date badge**
  - Add a compact `Clock` icon + `formatJobDateLabel(job)` badge next to company/location.
- [ ] **Step 5: Run `npm run lint` and `npm run build` to verify clean compilation**
- [ ] **Step 6: Commit dashboard changes**

---

### Task 3: Update Types, Documentation, and Push to Vercel

**Files:**
- Modify: `context.md`
- Modify: `README.md`

- [ ] **Step 1: Document Sub-Feature 1.6 (Date Recency Filtering & Multi-Criteria Sorting) in `context.md`**
- [ ] **Step 2: Update feature list in `README.md`**
- [ ] **Step 3: Run full verification suite (`npm run lint` && `npm run build`)**
- [ ] **Step 4: Check git status to ensure zero untracked `.env` or `.data` files**
- [ ] **Step 5: Commit and push to `origin main`**

---

## Verification Plan

### Automated Verification
```bash
# Lint check
npm run lint

# TypeScript & Next.js production build verification
npm run build

# Standalone date parsing test check
node -e "const { parseJobTimestamp, filterJobsByDate, sortJobs } = require('./src/features/jobs/lib/job-date-utils.ts'); console.log('Parsed successfully');"
```

### Manual Verification
1. Open Job Explorer at `/jobs` or `/`.
2. Select **Past 24h** in the date dropdown: verify only jobs posted within the last 24 hours appear, with count updating accurately.
3. Select **Past Week** and **Past Month**: verify progressively wider windows of jobs appear.
4. Select **Newest First**: verify jobs are ordered with the most recent postings at the top (`1h ago`, `2d ago`, etc.), with older dates descending.
5. Select **Best Match**: verify sorting returns to highest match score (`98%`, `92%`, etc.).
6. Switch back to **All Dates**: verify all cached jobs from LinkedIn, JobStreet, and Indeed reappear immediately without re-scraping.
