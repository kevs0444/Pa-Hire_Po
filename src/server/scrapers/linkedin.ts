import * as cheerio from 'cheerio';
import { scrapeJobs } from 'ts-jobspy';
import {
  COUNTRY_CONFIGS,
  CountryCode,
  RawScrapedJob,
  ScanSourceMeta,
  WorkType,
} from '@/types/job';
import { searchInternetForBoardJobs } from '@/server/scrapers/web-fallback';

interface ScrapeBoardInput {
  role: string;
  company?: string;
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

function formatSalaryFromJobSpy(
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

async function fetchLinkedInDescription(jobId: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${encodeURIComponent(jobId)}`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    const text = $('.show-more-less-html__markup, .description__text')
      .text()
      .replace(/\s+/g, ' ')
      .trim();
    return text ? text.slice(0, 1400) : null;
  } catch {
    return null;
  }
}

function mergeUniqueLinkedInJobs(
  primary: RawScrapedJob[],
  incoming: RawScrapedJob[],
  limit: number
): RawScrapedJob[] {
  const seen = new Set(
    primary.map(
      (j) =>
        `${j.title.toLowerCase().replace(/[^a-z0-9]/g, '')}:${j.company.toLowerCase().replace(/[^a-z0-9]/g, '')}`
    )
  );
  const merged = [...primary];
  for (const job of incoming) {
    if (merged.length >= limit) break;
    const key = `${job.title.toLowerCase().replace(/[^a-z0-9]/g, '')}:${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(job);
    }
  }
  return merged;
}

function countCompanyHits(jobs: RawScrapedJob[], company?: string): number {
  const needle = company?.trim().toLowerCase();
  if (!needle) return jobs.length;
  return jobs.filter((j) =>
    `${j.company} ${j.title} ${j.description}`.toLowerCase().includes(needle)
  ).length;
}

async function fetchLinkedInGuestPage(
  searchKeywords: string,
  queryLocation: string,
  workType: WorkType,
  role: string,
  isPivot: boolean,
  start: number,
  limit: number
): Promise<RawScrapedJob[]> {
  const params = new URLSearchParams({
    keywords: searchKeywords,
    location: queryLocation,
    start: String(start),
    trk: 'public_jobs_jobs-search-bar_search-submit',
  });

  if (workType === 'remote') params.set('f_WT', '2');
  if (workType === 'hybrid') params.set('f_WT', '3');
  if (workType === 'onsite') params.set('f_WT', '1');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8500);

  const res = await fetch(
    `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params.toString()}`,
    {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }
  );
  clearTimeout(timer);

  if (!res.ok) return [];

  const html = await res.text();
  const $ = cheerio.load(html);
  const parsed: RawScrapedJob[] = [];

  $('li').each((_, el) => {
    if (parsed.length >= limit) return;
    const title = $(el).find('.base-search-card__title').text().trim();
    const company = $(el).find('.base-search-card__subtitle').text().trim();
    const loc = $(el).find('.job-search-card__location').text().trim();
    const date = $(el).find('time').attr('datetime') || 'Recently posted';
    const rawUrl = $(el).find('.base-card__full-link').attr('href') || '';
    const urn = $(el).find('.base-card').attr('data-entity-urn') || '';
    const jobId = urn.split(':').pop() || `${start}-${parsed.length}`;

    if (title && rawUrl) {
      const cleanUrl = rawUrl.split('?')[0];
      const inferredWorkType = /remote/i.test(`${title} ${loc}`)
        ? 'Remote'
        : /hybrid/i.test(`${title} ${loc}`)
          ? 'Hybrid'
          : workType !== 'any'
            ? workType
            : 'On-site / Flexible';

      parsed.push({
        externalId: jobId,
        title,
        company: company || 'LinkedIn Employer',
        location: loc || queryLocation,
        source: 'linkedin',
        url: cleanUrl,
        postedAt: date,
        salary: null,
        description: `${title} at ${company || 'company'} in ${loc || queryLocation}. Search keyword: ${searchKeywords}.`,
        workType: inferredWorkType,
        searchedRole: role,
        isPivotSuggestion: isPivot,
      });
    }
  });

  return parsed;
}

export async function scrapeLinkedInJobs(
  input: ScrapeBoardInput
): Promise<BoardScrapeResult> {
  const startedAt = Date.now();
  const limit = input.limit ?? 20;
  const config = COUNTRY_CONFIGS[input.country];
  const queryLocation =
    input.workType === 'remote'
      ? 'Remote'
      : input.location.trim() || config.linkedInLocation;
  const cleanCompany = input.company?.trim() || '';
  const searchKeywords = cleanCompany
    ? `${input.role} ${cleanCompany}`
    : input.role;

  let collected: RawScrapedJob[] = [];
  let methodNote = 'LinkedIn Guest API';

  // Attempt 1: Direct LinkedIn Guest API + Cheerio (multi-page when deep extraction helps)
  try {
    const page1 = await fetchLinkedInGuestPage(
      searchKeywords,
      queryLocation,
      input.workType,
      input.role,
      input.isPivot,
      0,
      limit
    );
    collected = mergeUniqueLinkedInJobs(collected, page1, limit);

    if (collected.length > 0 && collected.length < limit && !input.isPivot) {
      const page2 = await fetchLinkedInGuestPage(
        searchKeywords,
        queryLocation,
        input.workType,
        input.role,
        input.isPivot,
        25,
        limit - collected.length
      ).catch(() => []);
      collected = mergeUniqueLinkedInJobs(collected, page2, limit);
    }

    if (collected.length > 0) {
      const topSlice = collected.slice(0, 8);
      const descriptions = await Promise.all(
        topSlice.map((job) => fetchLinkedInDescription(job.externalId))
      );
      descriptions.forEach((desc, idx) => {
        if (desc) {
          collected[idx].description = desc;
        }
      });
    }
  } catch {
    // Fall through to ts-jobspy attempt
  }

  // Attempt 2: ts-jobspy LinkedIn scraper (if Guest API returned too few)
  if (collected.length < 3) {
    try {
      const result = await scrapeJobs({
        sites: ['linkedin'],
        searchTerm: searchKeywords,
        location: queryLocation,
        isRemote: input.workType === 'remote' ? true : undefined,
        resultsWanted: limit,
        hoursOld: 168,
        timeoutMs: 8500,
        linkedin: { fetchDescription: true },
      });

      const jobspyJobs: RawScrapedJob[] = result.jobs.map((job, idx) => ({
        externalId:
          job.id ||
          `li-${(job.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24)}-${(job.company || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}-${idx}`,
        title: job.title,
        company: job.company || 'LinkedIn Employer',
        location: job.location || queryLocation,
        source: 'linkedin',
        url: job.jobUrlDirect || job.jobUrl,
        postedAt: job.datePosted || 'Recently posted',
        salary: formatSalaryFromJobSpy(
          job.minAmount,
          job.maxAmount,
          job.currency,
          job.interval
        ),
        description:
          job.description ||
          `${job.title} at ${job.company || 'Employer'} (${job.location || queryLocation})`,
        workType: job.isRemote ? 'Remote' : job.workFromHomeType || 'Flexible',
        searchedRole: input.role,
        isPivotSuggestion: input.isPivot,
      }));

      if (jobspyJobs.length > 0) {
        collected = mergeUniqueLinkedInJobs(collected, jobspyJobs, limit);
        methodNote =
          collected.length === jobspyJobs.length
            ? 'ts-jobspy'
            : `${methodNote} + ts-jobspy`;
      }
    } catch {
      // Fall through to Internet Search fallback
    }
  }

  // Attempt 3: Site-scoped Internet Web Search Fallback when blocked or < 3 company/role matches
  const needsWebFallback =
    collected.length < 3 ||
    (Boolean(cleanCompany) && countCompanyHits(collected, cleanCompany) < 2);

  if (needsWebFallback) {
    const webJobs = await searchInternetForBoardJobs({
      source: 'linkedin',
      role: input.role,
      company: cleanCompany || undefined,
      isPivot: input.isPivot,
      country: input.country,
      location: queryLocation,
      workType: input.workType,
      limit: Math.max(8, limit - collected.length),
    }).catch(() => []);

    if (webJobs.length > 0) {
      collected = mergeUniqueLinkedInJobs(collected, webJobs, limit);
      methodNote =
        collected.length === webJobs.length
          ? 'Internet Web Search'
          : `${methodNote} + Internet Search`;
    }
  }

  if (collected.length > 0) {
    return {
      jobs: collected,
      meta: {
        source: 'linkedin',
        status: 'live',
        count: collected.length,
        message: `Fetched ${collected.length} live postings via ${methodNote}`,
        durationMs: Date.now() - startedAt,
      },
    };
  }

  const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
    searchKeywords
  )}&location=${encodeURIComponent(queryLocation)}`;

  const fallbackJob: RawScrapedJob = {
    externalId: `li-fallback-${searchKeywords.toLowerCase().replace(/\s+/g, '-')}`,
    title: `${input.role}${cleanCompany ? ` at ${cleanCompany}` : ''} — Live LinkedIn Search`,
    company: cleanCompany || 'LinkedIn Job Board',
    location: queryLocation,
    source: 'linkedin',
    url: searchUrl,
    postedAt: 'Live search link',
    salary: null,
    description: `LinkedIn rate-limited automated guest requests from this IP. Open this direct pre-filtered LinkedIn search for "${searchKeywords}" in "${queryLocation}".`,
    workType: input.workType === 'any' ? 'All setups' : input.workType,
    searchedRole: input.role,
    isPivotSuggestion: input.isPivot,
    isFallback: true,
  };

  return {
    jobs: [fallbackJob],
    meta: {
      source: 'linkedin',
      status: 'fallback',
      count: 1,
      message: 'LinkedIn rate-limited automated requests; generated direct search shortcut.',
      durationMs: Date.now() - startedAt,
    },
  };
}
