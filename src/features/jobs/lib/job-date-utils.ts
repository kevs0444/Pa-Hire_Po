/**
 * Cross-board job posting date parsing, filtering, and sorting utilities.
 * Handles LinkedIn/Indeed ISO strings ('2026-11-12'), JobStreet relative formats
 * ('1h ago', '2d ago', '15d ago'), and fallback discovery timestamps.
 *
 * NOTE: Designed to be 100% deterministic during Next.js SSR/prerender by accepting
 * an optional `referenceNow` timestamp rather than evaluating `Date.now()` during render.
 */

export type DateFilterOption = 'all' | '24h' | '3d' | '7d' | '14d' | '30d';
export type SortOption = 'match' | 'newest' | 'oldest';
export type JobSortOption = SortOption;

export interface JobDateInput {
  postedAt?: string | null;
  discoveredAt?: string | null;
}

export interface SortableJob extends JobDateInput {
  matchScore: number;
  isFallback?: boolean;
}

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Normalizes any scraped job date into an epoch millisecond timestamp.
 */
export function parseJobTimestamp(
  job: JobDateInput,
  referenceNow?: number
): number {
  const discoveredMs = job.discoveredAt ? Date.parse(job.discoveredAt) : NaN;
  const baseTime = !Number.isNaN(discoveredMs)
    ? discoveredMs
    : typeof referenceNow === 'number'
      ? referenceNow
      : 0;

  const raw = job.postedAt?.trim();
  if (!raw) {
    return !Number.isNaN(discoveredMs) ? discoveredMs : 0;
  }

  // 1. Direct ISO Date: YYYY-MM-DD or full ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) return parsed;
  }

  // 2. Relative time string parsing
  const lower = raw.toLowerCase();

  const minMatch = lower.match(/^(\d+)\s*(?:m|min|mins|minute|minutes)\s*ago$/);
  if (minMatch) {
    const mins = Number(minMatch[1]);
    return baseTime - mins * MS_PER_MINUTE;
  }

  const hrMatch = lower.match(/^(\d+)\s*(?:h|hr|hrs|hour|hours)\s*ago$/);
  if (hrMatch) {
    const hrs = Number(hrMatch[1]);
    return baseTime - hrs * MS_PER_HOUR;
  }

  const dayMatch = lower.match(/^(\d+)\s*(?:d|day|days)\s*ago$/);
  if (dayMatch) {
    const days = Number(dayMatch[1]);
    return baseTime - days * MS_PER_DAY;
  }

  const wkMatch = lower.match(/^(\d+)\s*(?:w|wk|wks|week|weeks)\s*ago$/);
  if (wkMatch) {
    const wks = Number(wkMatch[1]);
    return baseTime - wks * 7 * MS_PER_DAY;
  }

  const moMatch = lower.match(/^(\d+)\s*(?:mo|mos|month|months)\s*ago$/);
  if (moMatch) {
    const mos = Number(moMatch[1]);
    return baseTime - mos * 30 * MS_PER_DAY;
  }

  // 3. Common vague / fallback descriptors
  if (
    lower.includes('just now') ||
    lower.includes('recently') ||
    lower.includes('today')
  ) {
    return baseTime;
  }

  if (lower.includes('yesterday')) {
    return baseTime - MS_PER_DAY;
  }

  // 4. Default fallback to discovery time or 0
  return !Number.isNaN(discoveredMs) ? discoveredMs : 0;
}

/**
 * Returns a human-friendly compact date badge label (e.g. "1h ago", "2d ago", "Nov 12").
 */
export function formatJobDateLabel(
  job: JobDateInput,
  referenceNow?: number
): string {
  const raw = job.postedAt?.trim();

  // If already a concise relative string from JobStreet, preserve it
  if (raw && /^\d+\s*[hdwm]\s*ago$/i.test(raw)) {
    return raw;
  }

  const ts = parseJobTimestamp(job, referenceNow);
  if (!ts || ts <= 0) {
    return raw || 'Recent';
  }

  if (typeof referenceNow === 'number') {
    const diffMs = referenceNow - ts;
    if (diffMs < 0) {
      return 'Just now';
    }

    if (diffMs < MS_PER_HOUR) {
      const mins = Math.max(1, Math.floor(diffMs / MS_PER_MINUTE));
      return `${mins}m ago`;
    }

    if (diffMs < MS_PER_DAY) {
      const hrs = Math.max(1, Math.floor(diffMs / MS_PER_HOUR));
      return `${hrs}h ago`;
    }

    if (diffMs < 14 * MS_PER_DAY) {
      const days = Math.floor(diffMs / MS_PER_DAY);
      return `${days}d ago`;
    }
  }

  // For older dates or during static prerender, display short month and day (e.g. "Oct 28")
  const date = new Date(ts);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Filters a list of jobs based on the selected date window.
 * Returns all jobs when filter is 'all' or when referenceNow is not yet provided.
 */
export function filterJobsByDate<T extends JobDateInput>(
  jobs: T[],
  filter: DateFilterOption,
  referenceNow?: number
): T[] {
  if (filter === 'all' || typeof referenceNow !== 'number') {
    return jobs;
  }

  let windowMs = MS_PER_DAY;
  if (filter === '24h') {
    windowMs = MS_PER_DAY;
  } else if (filter === '3d') {
    windowMs = 3 * MS_PER_DAY;
  } else if (filter === '7d') {
    windowMs = 7 * MS_PER_DAY;
  } else if (filter === '14d') {
    windowMs = 14 * MS_PER_DAY;
  } else if (filter === '30d') {
    windowMs = 30 * MS_PER_DAY;
  }

  const cutoff = referenceNow - windowMs;

  return jobs.filter((job) => {
    const ts = parseJobTimestamp(job, referenceNow);
    return ts >= cutoff;
  });
}

/**
 * Sorts jobs according to the chosen sort strategy:
 * - 'match': Best Match (matchScore desc, then newest date)
 * - 'newest': Newest First (timestamp desc, then matchScore desc)
 * - 'oldest': Oldest First (timestamp asc, then matchScore desc)
 * Fallback placeholders are always positioned after live jobs.
 */
export function sortJobs<T extends SortableJob>(
  jobs: T[],
  sortBy: SortOption,
  referenceNow?: number
): T[] {
  return jobs.slice().sort((a, b) => {
    // 1. Keep fallback listings deprioritized after live postings
    if (Boolean(a.isFallback) !== Boolean(b.isFallback)) {
      return a.isFallback ? 1 : -1;
    }

    const aTime = parseJobTimestamp(a, referenceNow);
    const bTime = parseJobTimestamp(b, referenceNow);

    if (sortBy === 'newest') {
      if (bTime !== aTime) return bTime - aTime;
      return b.matchScore - a.matchScore;
    }

    if (sortBy === 'oldest') {
      if (aTime !== bTime) return aTime - bTime;
      return b.matchScore - a.matchScore;
    }

    // Default 'match'
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return bTime - aTime;
  });
}
