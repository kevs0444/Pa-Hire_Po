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

function mergeUniqueIndeedJobs(
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

async function fetchIndeedHtmlFallback(
  indeedDomain: string,
  searchKeywords: string,
  queryLocation: string,
  role: string,
  isPivot: boolean,
  limit: number
): Promise<RawScrapedJob[]> {
  const url = `${indeedDomain}/jobs?q=${encodeURIComponent(
    searchKeywords
  )}&l=${encodeURIComponent(queryLocation)}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return [];

    const html = await res.text();
    if (/cloudflare|just a moment|captcha/i.test(html) && !html.includes('jobTitle')) {
      return [];
    }

    const $ = cheerio.load(html);
    const parsed: RawScrapedJob[] = [];

    $('.job_seen_beacon, .resultContent, [data-jk]').each((idx, el) => {
      if (parsed.length >= limit) return;
      const titleEl = $(el).find('h2.jobTitle a, a[data-jk]').first();
      const title =
        $(el).find('h2.jobTitle span[title]').text().trim() ||
        titleEl.text().trim();
      const jk =
        $(el).attr('data-jk') ||
        titleEl.attr('data-jk') ||
        `ind-html-${idx}`;
      const href = titleEl.attr('href') || '';
      const company =
        $(el).find('[data-testid="company-name"], .companyName').text().trim() ||
        'Indeed Employer';
      const loc =
        $(el).find('[data-testid="text-location"], .companyLocation').text().trim() ||
        queryLocation;
      const salary =
        $(el).find('.salary-snippet-container, [data-testid="attribute_snippet_testid"]').first().text().trim() ||
        null;
      const snippet = $(el).find('.job-snippet, .underShelfFooter').text().replace(/\s+/g, ' ').trim();

      if (title) {
        const cleanUrl = href.startsWith('http')
          ? href
          : href
            ? `${indeedDomain}${href}`
            : `${indeedDomain}/viewjob?jk=${encodeURIComponent(jk)}`;

        parsed.push({
          externalId: jk,
          title,
          company,
          location: loc,
          source: 'indeed',
          url: cleanUrl,
          postedAt: 'Recently posted',
          salary,
          description: snippet || `${title} at ${company} in ${loc}.`,
          workType: /remote/i.test(`${title} ${loc}`)
            ? 'Remote'
            : /hybrid/i.test(`${title} ${loc}`)
              ? 'Hybrid'
              : 'Full time',
          searchedRole: role,
          isPivotSuggestion: isPivot,
        });
      }
    });

    return parsed;
  } catch {
    return [];
  }
}

export async function scrapeIndeedJobs(
  input: ScrapeBoardInput
): Promise<BoardScrapeResult> {
  const startedAt = Date.now();
  const limit = input.limit ?? 20;
  const config = COUNTRY_CONFIGS[input.country];
  const queryLocation =
    input.workType === 'remote'
      ? 'Remote'
      : input.location.trim() || config.defaultLocation;
  const cleanCompany = input.company?.trim() || '';
  const searchKeywords = cleanCompany
    ? `${input.role} ${cleanCompany}`
    : input.role;

  let errorMessage = '';
  let collected: RawScrapedJob[] = [];
  let methodNote = `Indeed (${config.jobspyCountry})`;

  // Attempt 1: ts-jobspy Indeed GraphQL
  try {
    // Do NOT pass custom userAgent to ts-jobspy for Indeed (Indeed GraphQL requires its fixed mobile app UA)
    const result = await scrapeJobs({
      sites: ['indeed'],
      searchTerm: searchKeywords,
      location: queryLocation,
      country: config.jobspyCountry,
      isRemote: input.workType === 'remote' ? true : undefined,
      resultsWanted: limit,
      hoursOld: 168,
      descriptionFormat: 'plain',
      timeoutMs: 8500,
    });

    const jobs: RawScrapedJob[] = result.jobs.map((job, idx) => ({
      externalId:
        job.id ||
        `ind-${(job.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24)}-${(job.company || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}-${idx}`,
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

    collected = mergeUniqueIndeedJobs(collected, jobs, limit);

    if (collected.length === 0) {
      const siteMeta = result.meta.sites[0];
      if (siteMeta && (siteMeta.status === 'error' || siteMeta.status === 'partial')) {
        errorMessage = siteMeta.error.message;
      } else {
        errorMessage = 'Indeed returned 0 listings for this query/IP';
      }
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Indeed request blocked or timed out';
  }

  // Attempt 2: Direct Indeed HTML mosaic card fallback
  if (collected.length < 3) {
    const htmlJobs = await fetchIndeedHtmlFallback(
      config.indeedDomain,
      searchKeywords,
      queryLocation,
      input.role,
      input.isPivot,
      limit
    );
    if (htmlJobs.length > 0) {
      collected = mergeUniqueIndeedJobs(collected, htmlJobs, limit);
      methodNote =
        collected.length === htmlJobs.length
          ? `Indeed HTML (${config.jobspyCountry})`
          : `${methodNote} + HTML`;
    }
  }

  // Attempt 3: Site-scoped Internet Web Search Fallback when blocked or < 3 company/role matches
  const needsWebFallback =
    collected.length < 3 ||
    (Boolean(cleanCompany) && countCompanyHits(collected, cleanCompany) < 2);

  if (needsWebFallback) {
    const webJobs = await searchInternetForBoardJobs({
      source: 'indeed',
      role: input.role,
      company: cleanCompany || undefined,
      isPivot: input.isPivot,
      country: input.country,
      location: queryLocation,
      workType: input.workType,
      limit: Math.max(8, limit - collected.length),
    }).catch(() => []);

    if (webJobs.length > 0) {
      collected = mergeUniqueIndeedJobs(collected, webJobs, limit);
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
        source: 'indeed',
        status: 'live',
        count: collected.length,
        message: `Fetched ${collected.length} live postings via ${methodNote}`,
        durationMs: Date.now() - startedAt,
      },
    };
  }

  const searchUrl = `${config.indeedDomain}/jobs?q=${encodeURIComponent(
    searchKeywords
  )}&l=${encodeURIComponent(queryLocation)}`;

  const fallbackJob: RawScrapedJob = {
    externalId: `ind-fallback-${searchKeywords.toLowerCase().replace(/\s+/g, '-')}`,
    title: `${input.role}${cleanCompany ? ` at ${cleanCompany}` : ''} — Live Indeed Search (${config.label})`,
    company: cleanCompany || 'Indeed Job Board',
    location: queryLocation,
    source: 'indeed',
    url: searchUrl,
    postedAt: 'Live search link',
    salary: null,
    description: `Indeed protected its endpoint from automated scraping (${errorMessage || 'blocked'}). Open this pre-filtered Indeed search for "${searchKeywords}" in "${queryLocation}".`,
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
      message: `${errorMessage || 'Indeed blocked'}; generated direct Indeed search shortcut.`,
      durationMs: Date.now() - startedAt,
    },
  };
}
