import {
  DynamicRoleSuggestion,
  JobListing,
  JobSource,
  RawScrapedJob,
  ScanSourceMeta,
  UserProfile,
} from '@/types/job';
import { MAR_KEVIN_PROFILE } from '@/lib/default-profile';
import {
  ROLE_BLUEPRINTS,
  inferDynamicRoles,
  scoreJobAgainstProfile,
  selectRolesForScan,
} from '@/features/resume/lib/resume-analyzer';
import { TtlCache } from '@/server/cache/ttl-cache';
import { scrapeIndeedJobs } from '@/server/scrapers/indeed';
import { scrapeJobStreetJobs } from '@/server/scrapers/jobstreet';
import { BoardScrapeResult, scrapeLinkedInJobs } from '@/server/scrapers/linkedin';

export interface JobSearchRequestBody {
  profile?: Partial<UserProfile>;
  explicitRoles?: string[];
  companyQuery?: string;
  sources?: JobSource[];
  forceRefresh?: boolean;
}

export interface JobSearchServiceResult {
  jobs: JobListing[];
  meta: ScanSourceMeta[];
  searchedRoles: { role: string; isPivot: boolean }[];
  activeSearch: { roleQuery: string; companyQuery: string };
  suggestedRoles: DynamicRoleSuggestion[];
  scannedAt: string;
  cached: boolean;
}

const SCRAPE_CACHE_TTL_MS = 50_000;
const boardScrapeCache = new TtlCache<BoardScrapeResult>(250);

const TITLE_GENERIC_WORDS = new Set([
  'and',
  'for',
  'the',
  'with',
  'job',
  'jobs',
  'role',
  'opening',
  'hiring',
  'position',
  'remote',
  'hybrid',
  'onsite',
  'full',
  'time',
  'part',
  'intern',
  'junior',
  'senior',
  'associate',
  'level',
  'entry',
]);

export function parseRoleAndCompanyQuery(
  rawRoleInput: string,
  rawCompanyInput?: string
): { roleQuery: string; companyQuery: string } {
  const trimmedRole = (rawRoleInput || '').trim();
  const trimmedCompany = (rawCompanyInput || '').trim();

  if (trimmedCompany) {
    return {
      roleQuery: trimmedRole,
      companyQuery: trimmedCompany,
    };
  }

  const atMatch = trimmedRole.match(
    /^(.+?)\s+(?:at|@)\s+([A-Za-z0-9][A-Za-z0-9\s.&'-]{1,48})$/i
  );
  if (atMatch) {
    return {
      roleQuery: atMatch[1].trim(),
      companyQuery: atMatch[2].trim(),
    };
  }

  return {
    roleQuery: trimmedRole,
    companyQuery: '',
  };
}

function extractCorrelationTokens(phrase: string): string[] {
  return phrase
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !TITLE_GENERIC_WORDS.has(w));
}

function getBlueprintAliasesForRole(roleQuery: string): string[] {
  const lower = roleQuery.toLowerCase();
  const aliases = new Set<string>();
  for (const bp of ROLE_BLUEPRINTS) {
    if (
      lower.includes(bp.role.toLowerCase()) ||
      bp.aliases.some((a) => lower.includes(a))
    ) {
      aliases.add(bp.role.toLowerCase());
      bp.aliases.forEach((a) => aliases.add(a.toLowerCase()));
    }
  }
  return Array.from(aliases);
}

function matchesCompanyQuery(job: RawScrapedJob, companyQuery: string): boolean {
  const needle = companyQuery.trim().toLowerCase();
  if (!needle) return false;
  const companyHay = job.company.toLowerCase();
  const fullHay = `${job.company} ${job.title} ${job.description}`.toLowerCase();

  if (companyHay.includes(needle) || fullHay.includes(needle)) {
    return true;
  }

  const tokens = needle
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return false;
  return tokens.every((t) => companyHay.includes(t) || fullHay.includes(t));
}

function getRoleCorrelationTier(
  job: RawScrapedJob,
  searchedRoles: { role: string; isPivot: boolean }[]
): number {
  const titleLower = job.title.toLowerCase();
  const descLower = job.description.toLowerCase();

  for (const entry of searchedRoles) {
    const cleanRole = entry.role.trim().toLowerCase();
    if (!cleanRole) continue;
    if (titleLower.includes(cleanRole)) return 3;

    const aliases = getBlueprintAliasesForRole(cleanRole);
    if (aliases.some((a) => titleLower.includes(a))) return 3;

    const tokens = extractCorrelationTokens(cleanRole);
    if (tokens.length > 0) {
      const titleHits = tokens.filter((t) => titleLower.includes(t)).length;
      if (titleHits === tokens.length) return 3;
      if (titleHits >= 1) return 2;

      const combinedHits = tokens.filter((t) => descLower.includes(t)).length;
      if (combinedHits === tokens.length) return 1;
    }
  }

  return 0;
}

function filterBySearchCorrelation(
  jobs: RawScrapedJob[],
  searchedRoles: { role: string; isPivot: boolean }[],
  companyQuery: string
): RawScrapedJob[] {
  const liveJobs = jobs.filter((j) => !j.isFallback);
  const fallbackJobs = jobs.filter((j) => j.isFallback);

  let correlatedLive = liveJobs;

  // 1. Company correlation: if user searched a specific company and any live hits match it, strictly focus on that company
  if (companyQuery) {
    const companyMatches = correlatedLive.filter((j) =>
      matchesCompanyQuery(j, companyQuery)
    );
    if (companyMatches.length > 0) {
      correlatedLive = companyMatches;
    }
  }

  // 2. Role / title correlation: remove completely unrelated noise when direct matches exist
  const titleOrDescMatched = correlatedLive.filter(
    (j) => getRoleCorrelationTier(j, searchedRoles) >= 1 || j.isPivotSuggestion
  );
  if (titleOrDescMatched.length > 0) {
    const strongTitleMatched = titleOrDescMatched.filter(
      (j) => getRoleCorrelationTier(j, searchedRoles) >= 2
    );
    correlatedLive =
      strongTitleMatched.length >= 3 || companyQuery
        ? strongTitleMatched.length > 0
          ? strongTitleMatched
          : titleOrDescMatched
        : titleOrDescMatched;
  }

  return [...correlatedLive, ...fallbackJobs];
}

async function runBoardScraper(
  source: JobSource,
  role: string,
  companyQuery: string,
  isPivot: boolean,
  profile: UserProfile,
  forceRefresh = false
): Promise<{ result: BoardScrapeResult; cached: boolean }> {
  const limit = isPivot ? 8 : 20;
  const cacheKey = [
    source,
    role.trim().toLowerCase(),
    companyQuery.trim().toLowerCase(),
    isPivot ? '1' : '0',
    profile.country,
    profile.location.trim().toLowerCase(),
    profile.workType,
    limit,
  ].join('|');

  const { value, cached } = await boardScrapeCache.getOrFetch(
    cacheKey,
    SCRAPE_CACHE_TTL_MS,
    () => {
      const input = {
        role,
        company: companyQuery || undefined,
        isPivot,
        country: profile.country,
        location: profile.location,
        workType: profile.workType,
        limit,
      };
      if (source === 'linkedin') return scrapeLinkedInJobs(input);
      if (source === 'jobstreet') return scrapeJobStreetJobs(input);
      return scrapeIndeedJobs(input);
    },
    forceRefresh
  );

  return { result: value, cached };
}

/**
 * Multi-board concurrent scrape orchestrator with 50s shared TTL + single-flight deduplication.
 * Supports specific Job Title + Company Name search, Internet Web Search fallback, and strict search correlation.
 */
export async function executeJobSearch(
  body: JobSearchRequestBody
): Promise<JobSearchServiceResult> {
  const profile: UserProfile = {
    ...MAR_KEVIN_PROFILE,
    ...(body.profile || {}),
  };

  const enabledSources: JobSource[] =
    Array.isArray(body.sources) && body.sources.length > 0
      ? body.sources
      : ['linkedin', 'jobstreet', 'indeed'];

  const rawExplicitRole = Array.isArray(body.explicitRoles)
    ? body.explicitRoles[0] || ''
    : '';
  const { roleQuery: parsedRole, companyQuery } = parseRoleAndCompanyQuery(
    rawExplicitRole,
    body.companyQuery
  );

  const effectiveExplicitRoles = parsedRole
    ? [parsedRole, ...(Array.isArray(body.explicitRoles) ? body.explicitRoles.slice(1) : [])]
    : companyQuery
      ? [profile.primaryRole || 'Data Analyst']
      : body.explicitRoles;

  const rolesToSearch = selectRolesForScan(profile, effectiveExplicitRoles);

  const tasks: Array<{
    source: JobSource;
    promise: Promise<{ result: BoardScrapeResult; cached: boolean }>;
  }> = [];

  for (const { role, isPivot } of rolesToSearch) {
    for (const source of enabledSources) {
      tasks.push({
        source,
        promise: runBoardScraper(
          source,
          role,
          companyQuery,
          isPivot,
          profile,
          Boolean(body.forceRefresh)
        ),
      });
    }
  }

  const settled = await Promise.allSettled(tasks.map((t) => t.promise));

  const rawJobs: RawScrapedJob[] = [];
  const metaBySource = new Map<JobSource, ScanSourceMeta[]>();
  let anyCached = false;

  settled.forEach((outcome, index) => {
    const source = tasks[index].source;
    const list = metaBySource.get(source) || [];

    if (outcome.status === 'fulfilled') {
      rawJobs.push(...outcome.value.result.jobs);
      list.push(outcome.value.result.meta);
      if (outcome.value.cached) {
        anyCached = true;
      }
    } else {
      list.push({
        source,
        status: 'error',
        count: 0,
        message:
          outcome.reason instanceof Error
            ? outcome.reason.message
            : 'Scraper failed unexpectedly',
        durationMs: 0,
      });
    }
    metaBySource.set(source, list);
  });

  const meta: ScanSourceMeta[] = enabledSources.map((source) => {
    const entries = metaBySource.get(source) || [];
    const liveEntries = entries.filter((e) => e.status === 'live');
    const fallbackEntries = entries.filter((e) => e.status === 'fallback');

    if (liveEntries.length > 0) {
      return {
        source,
        status: 'live',
        count: liveEntries.reduce((sum, e) => sum + e.count, 0),
        message: liveEntries[0].message,
        durationMs: Math.max(...entries.map((e) => e.durationMs), 0),
      };
    }
    if (fallbackEntries.length > 0) {
      return {
        source,
        status: 'fallback',
        count: fallbackEntries.reduce((sum, e) => sum + e.count, 0),
        message: fallbackEntries[0].message,
        durationMs: Math.max(...entries.map((e) => e.durationMs), 0),
      };
    }
    return {
      source,
      status: 'error',
      count: 0,
      message: entries[0]?.message || 'No response from board',
      durationMs: Math.max(...entries.map((e) => e.durationMs), 0),
    };
  });

  const boardsWithLiveJobs = new Set(
    meta.filter((m) => m.status === 'live').map((m) => m.source)
  );

  const filteredRaw = rawJobs.filter(
    (job) => !job.isFallback || !boardsWithLiveJobs.has(job.source)
  );

  const dedupedMap = new Map<string, RawScrapedJob>();
  for (const job of filteredRaw) {
    const normalizedTitle = job.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedCompany = job.company.toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `${job.source}:${normalizedTitle}:${normalizedCompany}`;
    const existing = dedupedMap.get(key);

    if (!existing) {
      dedupedMap.set(key, job);
    } else if (existing.isPivotSuggestion && !job.isPivotSuggestion) {
      dedupedMap.set(key, job);
    } else if (existing.isFallback && !job.isFallback) {
      dedupedMap.set(key, job);
    }
  }

  const correlatedRaw = filterBySearchCorrelation(
    Array.from(dedupedMap.values()),
    rolesToSearch,
    companyQuery
  );

  const rawByKey = new Map<string, RawScrapedJob>();
  const scoredJobs: JobListing[] = correlatedRaw
    .map((raw) => {
      const scored = scoreJobAgainstProfile(raw, profile);
      const companyHit = companyQuery
        ? matchesCompanyQuery(raw, companyQuery)
        : false;
      const roleTier = getRoleCorrelationTier(raw, rolesToSearch);

      let boostedScore = scored.matchScore;
      let matchReason = scored.matchReason;

      if (companyHit && !raw.isFallback) {
        boostedScore = Math.min(98, boostedScore + 12);
        matchReason = `✓ Matches searched company "${companyQuery}" • ${matchReason}`;
      }
      if (roleTier >= 3 && !raw.isFallback) {
        boostedScore = Math.min(98, boostedScore + 6);
      }

      const finalJob: JobListing = {
        ...scored,
        matchScore: boostedScore,
        matchReason,
      };
      rawByKey.set(finalJob.id, raw);
      return finalJob;
    })
    .sort((a, b) => {
      if (Boolean(a.isFallback) !== Boolean(b.isFallback)) {
        return a.isFallback ? 1 : -1;
      }
      if (companyQuery) {
        const aRaw = rawByKey.get(a.id);
        const bRaw = rawByKey.get(b.id);
        const aComp = aRaw ? matchesCompanyQuery(aRaw, companyQuery) : false;
        const bComp = bRaw ? matchesCompanyQuery(bRaw, companyQuery) : false;
        if (aComp !== bComp) return aComp ? -1 : 1;
      }
      const aRaw = rawByKey.get(a.id);
      const bRaw = rawByKey.get(b.id);
      const aTier = aRaw ? getRoleCorrelationTier(aRaw, rolesToSearch) : 0;
      const bTier = bRaw ? getRoleCorrelationTier(bRaw, rolesToSearch) : 0;
      if (aTier !== bTier) return bTier - aTier;

      return b.matchScore - a.matchScore;
    });

  const suggestedRoles = inferDynamicRoles(
    profile.resumeText,
    profile.skills,
    profile.primaryRole
  ).slice(0, 8);

  return {
    jobs: scoredJobs,
    meta,
    searchedRoles: rolesToSearch,
    activeSearch: {
      roleQuery: parsedRole || rolesToSearch[0]?.role || profile.primaryRole,
      companyQuery,
    },
    suggestedRoles,
    scannedAt: new Date().toISOString(),
    cached: anyCached,
  };
}
