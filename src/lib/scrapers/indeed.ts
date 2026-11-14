import { scrapeJobs } from 'ts-jobspy';
import {
  COUNTRY_CONFIGS,
  CountryCode,
  RawScrapedJob,
  ScanSourceMeta,
  WorkType,
} from '@/types/job';

interface ScrapeBoardInput {
  role: string;
  isPivot: boolean;
  country: CountryCode;
  location: string;
  workType: WorkType;
  limit?: number;
}

export interface BoardScrapeResult {
  jobs: RawScrapedJob[];
  meta: ScanSourceMeta;
}

function formatSalary(
  minAmount: number | null,
  maxAmount: number | null,
  currency: string | null,
  interval: string | null
): string | null {
  if (minAmount == null && maxAmount == null) return null;
  const curr = currency || '';
  const unit = interval ? `/${interval}` : '';
  if (minAmount != null && maxAmount != null && minAmount !== maxAmount) {
    return `${curr} ${minAmount.toLocaleString()} - ${maxAmount.toLocaleString()}${unit}`.trim();
  }
  const val = minAmount ?? maxAmount;
  return val != null ? `${curr} ${val.toLocaleString()}${unit}`.trim() : null;
}

export async function scrapeIndeedJobs(
  input: ScrapeBoardInput
): Promise<BoardScrapeResult> {
  const startedAt = Date.now();
  const limit = input.limit ?? 12;
  const config = COUNTRY_CONFIGS[input.country];
  const queryLocation =
    input.workType === 'remote'
      ? 'Remote'
      : input.location.trim() || config.defaultLocation;

  let errorMessage = '';

  try {
    // Do NOT pass custom userAgent to ts-jobspy for Indeed (Indeed GraphQL requires its fixed mobile app UA)
    const result = await scrapeJobs({
      sites: ['indeed'],
      searchTerm: input.role,
      location: queryLocation,
      country: config.jobspyCountry,
      isRemote: input.workType === 'remote' ? true : undefined,
      resultsWanted: limit,
      hoursOld: 168,
      descriptionFormat: 'plain',
      timeoutMs: 9000,
    });

    const jobs: RawScrapedJob[] = result.jobs.map((job, idx) => ({
      externalId: job.id || `ind-${idx}-${Date.now()}`,
      title: job.title,
      company: job.company || 'Indeed Employer',
      location: job.location || queryLocation,
      source: 'indeed',
      url: job.jobUrlDirect || job.jobUrl,
      postedAt: job.datePosted || 'Recently posted',
      salary: formatSalary(
        job.minAmount,
        job.maxAmount,
        job.currency,
        job.interval
      ),
      description:
        job.description ||
        `${job.title} at ${job.company || 'Employer'} in ${job.location || queryLocation}.`,
      workType: job.isRemote
        ? 'Remote'
        : job.workFromHomeType || (job.jobTypes?.[0] ?? 'Full time'),
      searchedRole: input.role,
      isPivotSuggestion: input.isPivot,
    }));

    if (jobs.length > 0) {
      return {
        jobs,
        meta: {
          source: 'indeed',
          status: 'live',
          count: jobs.length,
          message: `Fetched ${jobs.length} live postings via Indeed (${config.jobspyCountry})`,
          durationMs: Date.now() - startedAt,
        },
      };
    }

    const siteMeta = result.meta.sites[0];
    if (siteMeta && (siteMeta.status === 'error' || siteMeta.status === 'partial')) {
      errorMessage = siteMeta.error.message;
    } else {
      errorMessage = 'Indeed returned 0 listings for this query/IP';
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Indeed request blocked or timed out';
  }

  const searchUrl = `${config.indeedDomain}/jobs?q=${encodeURIComponent(
    input.role
  )}&l=${encodeURIComponent(queryLocation)}`;

  const fallbackJob: RawScrapedJob = {
    externalId: `ind-fallback-${input.role.toLowerCase().replace(/\s+/g, '-')}`,
    title: `${input.role} — Live Indeed Search (${config.label})`,
    company: 'Indeed Job Board',
    location: queryLocation,
    source: 'indeed',
    url: searchUrl,
    postedAt: 'Live search link',
    salary: null,
    description: `Indeed protected its endpoint from automated scraping (${errorMessage}). Open this pre-filtered Indeed search for "${input.role}" in "${queryLocation}".`,
    workType: input.workType === 'any' ? 'All setups' : input.workType,
    searchedRole: input.role,
    isPivotSuggestion: input.isPivot,
    isFallback: true,
  };

  return {
    jobs: [fallbackJob],
    meta: {
      source: 'indeed',
      status: 'fallback',
      count: 1,
      message: `${errorMessage}; generated direct Indeed search shortcut.`,
      durationMs: Date.now() - startedAt,
    },
  };
}
