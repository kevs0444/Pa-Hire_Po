import * as cheerio from 'cheerio';
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

export async function scrapeLinkedInJobs(
  input: ScrapeBoardInput
): Promise<BoardScrapeResult> {
  const startedAt = Date.now();
  const limit = input.limit ?? 12;
  const config = COUNTRY_CONFIGS[input.country];
  const queryLocation =
    input.workType === 'remote'
      ? 'Remote'
      : input.location.trim() || config.linkedInLocation;

  // Attempt 1: Direct LinkedIn Guest API + Cheerio
  try {
    const params = new URLSearchParams({
      keywords: input.role,
      location: queryLocation,
      start: '0',
      trk: 'public_jobs_jobs-search-bar_search-submit',
    });

    if (input.workType === 'remote') params.set('f_WT', '2');
    if (input.workType === 'hybrid') params.set('f_WT', '3');
    if (input.workType === 'onsite') params.set('f_WT', '1');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

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

    if (res.ok) {
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
        const jobId = urn.split(':').pop() || `${parsed.length}`;

        if (title && rawUrl) {
          const cleanUrl = rawUrl.split('?')[0];
          const inferredWorkType = /remote/i.test(`${title} ${loc}`)
            ? 'Remote'
            : /hybrid/i.test(`${title} ${loc}`)
              ? 'Hybrid'
              : input.workType !== 'any'
                ? input.workType
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
            description: `${title} at ${company || 'company'} in ${loc || queryLocation}. Search keyword: ${input.role}.`,
            workType: inferredWorkType,
            searchedRole: input.role,
            isPivotSuggestion: input.isPivot,
          });
        }
      });

      if (parsed.length > 0) {
        // Enrich top 6 job descriptions concurrently so skill matching is accurate
        const topSlice = parsed.slice(0, 6);
        const descriptions = await Promise.all(
          topSlice.map((job) => fetchLinkedInDescription(job.externalId))
        );
        descriptions.forEach((desc, idx) => {
          if (desc) {
            parsed[idx].description = desc;
          }
        });

        return {
          jobs: parsed,
          meta: {
            source: 'linkedin',
            status: 'live',
            count: parsed.length,
            message: `Fetched ${parsed.length} live postings via LinkedIn Guest API`,
            durationMs: Date.now() - startedAt,
          },
        };
      }
    }
  } catch {
    // Fall through to ts-jobspy attempt
  }

  // Attempt 2: ts-jobspy LinkedIn scraper
  try {
    const result = await scrapeJobs({
      sites: ['linkedin'],
      searchTerm: input.role,
      location: queryLocation,
      isRemote: input.workType === 'remote' ? true : undefined,
      resultsWanted: limit,
      hoursOld: 168,
      timeoutMs: 9000,
      linkedin: { fetchDescription: true },
    });

    const jobs: RawScrapedJob[] = result.jobs.map((job, idx) => ({
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

    if (jobs.length > 0) {
      return {
        jobs,
        meta: {
          source: 'linkedin',
          status: 'live',
          count: jobs.length,
          message: `Fetched ${jobs.length} live postings via ts-jobspy`,
          durationMs: Date.now() - startedAt,
        },
      };
    }
  } catch {
    // Fall through to honest fallback link card
  }

  const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
    input.role
  )}&location=${encodeURIComponent(queryLocation)}`;

  const fallbackJob: RawScrapedJob = {
    externalId: `li-fallback-${input.role.toLowerCase().replace(/\s+/g, '-')}`,
    title: `${input.role} — Live LinkedIn Search`,
    company: 'LinkedIn Job Board',
    location: queryLocation,
    source: 'linkedin',
    url: searchUrl,
    postedAt: 'Live search link',
    salary: null,
    description: `LinkedIn rate-limited automated guest requests from this IP. Open this direct pre-filtered LinkedIn search for "${input.role}" in "${queryLocation}".`,
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
