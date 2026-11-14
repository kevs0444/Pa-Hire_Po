import { NextRequest, NextResponse } from 'next/server';
import {
  JobListing,
  JobSource,
  RawScrapedJob,
  ScanSourceMeta,
  UserProfile,
} from '@/types/job';
import { MAR_KEVIN_PROFILE } from '@/lib/default-profile';
import {
  inferDynamicRoles,
  scoreJobAgainstProfile,
  selectRolesForScan,
} from '@/features/resume/lib/resume-analyzer';
import { BoardScrapeResult, scrapeLinkedInJobs } from '@/server/scrapers/linkedin';
import { scrapeJobStreetJobs } from '@/server/scrapers/jobstreet';
import { scrapeIndeedJobs } from '@/server/scrapers/indeed';

export const maxDuration = 30;

interface SearchRequestBody {
  profile?: Partial<UserProfile>;
  explicitRoles?: string[];
  sources?: JobSource[];
}

async function runBoardScraper(
  source: JobSource,
  role: string,
  isPivot: boolean,
  profile: UserProfile
): Promise<BoardScrapeResult> {
  const limit = isPivot ? 6 : 12;
  const input = {
    role,
    isPivot,
    country: profile.country,
    location: profile.location,
    workType: profile.workType,
    limit,
  };

  if (source === 'linkedin') return scrapeLinkedInJobs(input);
  if (source === 'jobstreet') return scrapeJobStreetJobs(input);
  return scrapeIndeedJobs(input);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as SearchRequestBody;
    const profile: UserProfile = {
      ...MAR_KEVIN_PROFILE,
      ...(body.profile || {}),
    };

    const enabledSources: JobSource[] =
      Array.isArray(body.sources) && body.sources.length > 0
        ? body.sources
        : ['linkedin', 'jobstreet', 'indeed'];

    const rolesToSearch = selectRolesForScan(profile, body.explicitRoles);

    const tasks: Array<{
      source: JobSource;
      promise: Promise<BoardScrapeResult>;
    }> = [];

    for (const { role, isPivot } of rolesToSearch) {
      for (const source of enabledSources) {
        tasks.push({
          source,
          promise: runBoardScraper(source, role, isPivot, profile),
        });
      }
    }

    const settled = await Promise.allSettled(tasks.map((t) => t.promise));

    const rawJobs: RawScrapedJob[] = [];
    const metaBySource = new Map<JobSource, ScanSourceMeta[]>();

    settled.forEach((outcome, index) => {
      const source = tasks[index].source;
      const list = metaBySource.get(source) || [];

      if (outcome.status === 'fulfilled') {
        rawJobs.push(...outcome.value.jobs);
        list.push(outcome.value.meta);
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

    // Aggregate per-board status metadata
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

    // If a board returned live jobs for one role, suppress fallback link-only cards for that board
    const boardsWithLiveJobs = new Set(
      meta.filter((m) => m.status === 'live').map((m) => m.source)
    );

    const filteredRaw = rawJobs.filter(
      (job) => !job.isFallback || !boardsWithLiveJobs.has(job.source)
    );

    // Deduplicate across roles / queries while preferring primary role and live postings
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

    const scoredJobs: JobListing[] = Array.from(dedupedMap.values())
      .map((raw) => scoreJobAgainstProfile(raw, profile))
      .sort((a, b) => {
        if (Boolean(a.isFallback) !== Boolean(b.isFallback)) {
          return a.isFallback ? 1 : -1;
        }
        return b.matchScore - a.matchScore;
      });

    const suggestedRoles = inferDynamicRoles(
      profile.resumeText,
      profile.skills,
      profile.primaryRole
    ).slice(0, 8);

    return NextResponse.json({
      jobs: scoredJobs,
      meta,
      searchedRoles: rolesToSearch,
      suggestedRoles,
      scannedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to execute job search pipeline',
      },
      { status: 500 }
    );
  }
}
