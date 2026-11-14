# Design Doc: Job Recency Date Filter and Sort Order

- **Date**: 2026-11-15
- **Status**: Draft (Awaiting Approval)
- **Topic**: Recency Date Filtering and Sort Order in Job Explorer

---

## 1. Intent & Context
Users searching for jobs need to quickly find the latest postings (e.g. within the past 24 hours, past week, or past month) and toggle between ordering jobs by **Highest Match Score** and **Latest First**. Currently, the job explorer displays all scraped jobs ordered strictly by `matchScore`, with no way to filter out older listings or sort by posting recency.

---

## 2. Goals, Non-Goals & Constraints

### Goals
1. **Quick Date Filter Toolbar**: Allow 1-click filtering by posting date recency:
   - `Anytime` (all jobs)
   - `Past 24h` (&le; 24 hours / 1 day)
   - `Past Week` (&le; 7 days)
   - `Past Month` (&le; 30 days)
2. **Sort Order Toggle**: Allow toggling sort order:
   - `Best Match %` (highest match score descending, default)
   - `Latest First` (newest posting date descending)
3. **Robust Date Parser**: Parse both ISO format dates (`2026-11-14`, `2026-10-29`) and relative strings (`1h ago`, `7h ago`, `1d ago`, `3d ago`, `7d ago`, `15d ago`, `30d+ ago`) into normalized timestamps/day-offsets. Fallback to `discoveredAt` if unparseable.
4. **Persistent / Reactive State**: Maintain clean reactivity with other active filters (status, board, experience fit, min score, text search).

### Non-Goals
- Changing external scraper APIs or altering how scrapers fetch from upstream sources (the filtering is client-side over the accumulated local job store for instant responsiveness).
- Modifying resume tailoring logic.

### Anti-Goals
- Dropping or hiding jobs with slightly unconventional date strings due to parser failures (gracefully fallback to `discoveredAt`).
- Laggy re-sorting on large job sets (keep memoized with `useMemo`).

---

## 3. Approaches Considered & User Selection

1. **Approach 1 (Dropdown & Sort Toggle)**: Select dropdown for date ranges and a sort order toggle.
2. **Approach 2 (Quick Toolbar Presets)**: Fast one-click pill buttons directly in the top filter bar.
3. **Approach 3 (Sort Only)**: Toggle order without hiding old jobs.

**Selected by User**: **Both** (Combining quick preset pill buttons in the toolbar with a dedicated sort-order toggle, providing both 1-click speed and flexible ranking).

---

## 4. Architectural Design & Implementation Details

### A. Date Normalization Helper (`src/lib/date-utils.ts` or `src/lib/utils.ts`)
Create a helper function:
```typescript
export function getJobPostingAgeDays(postedAt: string | undefined, discoveredAt?: string): number;
export function getJobPostingDate(postedAt: string | undefined, discoveredAt?: string): Date;
```
Parsing rules:
1. Relative hours: `/(\d+)\s*h(?:our)?s?\s*ago/i` &rarr; `< 1` day (0.04 * hours).
2. Relative days: `/(\d+)\s*d(?:ay)?s?\s*ago/i` &rarr; `N` days.
3. Relative weeks/months: `/(\d+)\s*w(?:eek)?s?\s*ago/i` &rarr; `N * 7` days; `/(\d+)\s*m(?:onth)?s?\s*ago/i` &rarr; `N * 30` days.
4. "Just posted", "Today", "Just now" &rarr; 0 days.
5. ISO / standard date strings (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`): `(now - Date.parse(str)) / (1000 * 60 * 60 * 24)`.
6. Fallback: Parse `discoveredAt` or default to 0.

### B. State in `PleaseHireMeDashboard.tsx`
- `dateFilter`: `'anytime' | '24h' | 'week' | 'month'` (default `'anytime'`)
- `sortOrder`: `'match' | 'latest'` (default `'match'`)

### C. Filtering & Sorting Pipeline in `filteredJobs`
```typescript
const filteredJobs = useMemo(() => {
  // 1. Existing filters: status, source, fit, minScore, searchQuery
  // 2. Date recency filter:
  //    '24h' -> ageDays <= 1
  //    'week' -> ageDays <= 7
  //    'month' -> ageDays <= 30
  // 3. Sorting:
  //    'match': b.matchScore - a.matchScore (fallback: latest)
  //    'latest': dateB.getTime() - dateA.getTime() (fallback: matchScore)
}, [store.jobs, statusFilter, sourceFilter, fitFilter, minScore, searchQuery, dateFilter, sortOrder]);
```

### D. UI Controls in Filter Bar
Add next to the existing board/fit filters:
- **Date Range Pills**: `Anytime` | `Past 24h` | `Past Week` | `Past Month`
- **Sort Selector**: `Best Match` &harr; `Latest First` (with Clock / Flame icon)
- Count badge updates to reflect the filtered tally.

---

## 5. Verification Plan
1. **Automated Tests / Typecheck**: Run `npx tsc --noEmit` to verify type safety and zero compilation errors.
2. **Parser Unit Checks**: Test diverse date formats (`2026-11-14`, `1h ago`, `3d ago`, `30d+ ago`, `2026-03-09`).
3. **Manual Verification**:
   - Open Find Jobs in the browser / desktop app.
   - Click "Past Week": Verify listings older than 7 days are filtered out.
   - Toggle "Latest First": Verify most recent postings appear at the top.
   - Switch between filters and verify smooth instant rendering.
