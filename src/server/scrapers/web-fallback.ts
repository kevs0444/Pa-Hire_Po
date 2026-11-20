import * as cheerio from 'cheerio';
import { scrapeJobs } from 'ts-jobspy';
import {
  COUNTRY_CONFIGS,
  CountryCode,
  JobSource,
  RawScrapedJob,
  WorkType,
} from '@/types/job';

export interface InternetFallbackInput {
  source: JobSource;
  role: string;
  company?: string;
  isPivot: boolean;
  country: CountryCode;
  location: string;
  workType: WorkType;
  limit?: number;
}

interface ParsedSearchHit {
  url: string;
  headline: string;
  snippet: string;
}

const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

function decodeRedirectUrl(rawHref: string): string {
  const trimmed = rawHref.trim();
  if (!trimmed) return '';

  // DuckDuckGo /l/?uddg=...
  try {
    if (trimmed.includes('duckduckgo.com/l/?') || trimmed.startsWith('/l/?')) {
      const full = trimmed.startsWith('http')
        ? trimmed
        : `https://html.duckduckgo.com${trimmed}`;
      const parsed = new URL(full);
      const uddg = parsed.searchParams.get('uddg');
      if (uddg) return decodeURIComponent(uddg);
    }
  } catch {
    // Ignore malformed DDG wrapper
  }

  // Yahoo /RU=.../RK=...
  const yahooMatch = trimmed.match(/\/RU=([^/]+)\/RK=/i);
  if (yahooMatch?.[1]) {
    try {
      return decodeURIComponent(yahooMatch[1]);
    } catch {
      // Ignore malformed Yahoo redirect
    }
  }

  return trimmed;
}

function isValidJobPostingUrl(url: string, source: JobSource): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  const full = `${parsed.pathname}${parsed.search}`.toLowerCase();

  if (source === 'linkedin') {
    return (
      host.includes('linkedin.com') &&
      (full.includes('/jobs/view/') || /\/jobs\/[^/]+-\d+/.test(full))
    );
  }

  if (source === 'jobstreet') {
    return (
      host.includes('jobstreet.') &&
      (full.includes('/job/') || /jobid=\d+/.test(full))
    );
  }

  if (source === 'indeed') {
    return (
      host.includes('indeed.') &&
      (full.includes('viewjob') ||
        full.includes('vjk=') ||
        full.includes('jk=') ||
        full.includes('/rc/clk') ||
        full.includes('/pagead/') ||
        full.includes('/job/'))
    );
  }

  return false;
}

function isAggregatorListPage(headline: string): boolean {
  const lower = headline.toLowerCase();
  return (
    /^\d[\d,+]*\s+.+\s+jobs?\s+(in|at)\b/i.test(lower) ||
    /\b\d+[\d,+]*\s+jobs?\b/i.test(lower) ||
    /\bjobs?, employment in\b/i.test(lower) ||
    /\btop\s+\d+\s+.*jobs\b/i.test(lower)
  );
}

function cleanCompanyValue(raw: string): string {
  return raw
    .replace(/\s*\|\s*(LinkedIn|JobStreet|Indeed).*$/i, '')
    .replace(/\s*-\s*(JobStreet|Indeed).*$/i, '')
    .replace(/\s+careers?$/i, '')
    .trim();
}

function extractTitleCompanyLocation(
  headline: string,
  snippet: string,
  source: JobSource,
  defaultLocation: string,
  searchedCompany?: string
): { title: string; company: string; location: string } {
  const cleanHeadline = headline
    .replace(/\s*\|\s*(LinkedIn|JobStreet(?:\.[a-z.]+)?|Indeed(?:\.[a-z.]+)?).*$/i, '')
    .replace(/\s*-\s*(JobStreet(?:\.[a-z.]+)?|Indeed(?:\.[a-z.]+)?).*$/i, '')
    .trim();

  let title = cleanHeadline;
  let company = '';
  let location = defaultLocation;

  if (source === 'linkedin') {
    // Pattern 1: "<Company> hiring <Role> in <Location>"
    const hiringMatch = cleanHeadline.match(
      /^(.+?)\s+hiring\s+(.+?)(?:\s+in\s+(.+))?$/i
    );
    if (hiringMatch) {
      company = hiringMatch[1].trim();
      title = hiringMatch[2].trim();
      if (hiringMatch[3]) location = hiringMatch[3].trim();
    } else if (cleanHeadline.includes(' - ')) {
      const parts = cleanHeadline.split(/\s+-\s+/);
      if (parts.length >= 2) {
        title = parts[0].trim();
        company = parts[1].trim();
        if (parts[2]) location = parts[2].trim();
      }
    } else if (/\s+at\s+/i.test(cleanHeadline)) {
      const atParts = cleanHeadline.split(/\s+at\s+/i);
      title = atParts[0].trim();
      company = atParts.slice(1).join(' at ').trim();
    }
  } else if (source === 'jobstreet') {
    // Pattern: "<Role> Job in <Location> at <Company>" or "<Role> - <Company>"
    const jobAtMatch = cleanHeadline.match(
      /^(.+?)\s+Job(?:\s+in\s+(.+?))?\s+at\s+(.+)$/i
    );
    if (jobAtMatch) {
      title = jobAtMatch[1].trim();
      if (jobAtMatch[2]) location = jobAtMatch[2].trim();
      company = jobAtMatch[3].trim();
    } else if (/\s+at\s+/i.test(cleanHeadline)) {
      const atParts = cleanHeadline.split(/\s+at\s+/i);
      title = atParts[0].trim();
      company = atParts.slice(1).join(' at ').trim();
    } else if (cleanHeadline.includes(' - ')) {
      const parts = cleanHeadline.split(/\s+-\s+/);
      title = parts[0].trim();
      company = parts[1]?.trim() || '';
    }
  } else if (source === 'indeed') {
    // Pattern: "<Role> - <Company> - <Location>"
    if (cleanHeadline.includes(' - ')) {
      const parts = cleanHeadline.split(/\s+-\s+/);
      title = parts[0].trim();
      company = parts[1]?.trim() || '';
      if (parts[2]) location = parts[2].trim();
    } else if (/\s+at\s+/i.test(cleanHeadline)) {
      const atParts = cleanHeadline.split(/\s+at\s+/i);
      title = atParts[0].trim();
      company = atParts.slice(1).join(' at ').trim();
    }
  }

  company = cleanCompanyValue(company);

  if (!company && searchedCompany?.trim()) {
    const compNeedle = searchedCompany.trim().toLowerCase();
    if (`${headline} ${snippet}`.toLowerCase().includes(compNeedle)) {
      company = searchedCompany.trim();
    }
  }

  if (!company) {
    company =
      source === 'linkedin'
        ? 'LinkedIn Employer'
        : source === 'jobstreet'
          ? 'JobStreet Employer'
          : 'Indeed Employer';
  }

  return {
    title: title || cleanHeadline,
    company,
    location: location || defaultLocation,
  };
}

function buildSiteSearchQuery(
  source: JobSource,
  role: string,
  company: string | undefined,
  country: CountryCode,
  location: string
): string {
  const config = COUNTRY_CONFIGS[country];
  const cleanCompany = company?.trim();
  const cleanLoc = location.split(',')[0].trim();

  let siteClause = 'site:linkedin.com/jobs/view';
  if (source === 'jobstreet') {
    const domain = config.jobstreetDomain
      ? config.jobstreetDomain.replace(/^https?:\/\//, '')
      : 'ph.jobstreet.com';
    siteClause = `site:${domain}/job`;
  } else if (source === 'indeed') {
    const domain = config.indeedDomain
      ? config.indeedDomain.replace(/^https?:\/\//, '')
      : 'ph.indeed.com';
    siteClause = `site:${domain}`;
  }

  const parts = [siteClause, `"${role.trim()}"`];
  if (cleanCompany) {
    parts.push(`"${cleanCompany}"`);
  }
  if (cleanLoc && !/worldwide|remote|all/i.test(cleanLoc) && source !== 'jobstreet') {
    parts.push(cleanLoc);
  }
  return parts.join(' ');
}

async function fetchDuckDuckGoHits(query: string): Promise<ParsedSearchHit[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        signal: controller.signal,
        headers: REQUEST_HEADERS,
      }
    );
    clearTimeout(timer);
    if (!res.ok) return [];

    const html = await res.text();
    // Bail cleanly if anti-bot / captcha challenge returned
    if (/anomaly|captcha|are you a robot/i.test(html) && !html.includes('result__a')) {
      return [];
    }

    const $ = cheerio.load(html);
    const hits: ParsedSearchHit[] = [];

    $('.result, .web-result').each((_, el) => {
      const link = $(el).find('a.result__a').first();
      const rawHref = link.attr('href') || '';
      const url = decodeRedirectUrl(rawHref);
      const headline = link.text().replace(/\s+/g, ' ').trim();
      const snippet = $(el).find('.result__snippet').text().replace(/\s+/g, ' ').trim();
      if (url && headline) {
        hits.push({ url, headline, snippet });
      }
    });

    return hits;
  } catch {
    return [];
  }
}

async function fetchYahooHits(query: string): Promise<ParsedSearchHit[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    const res = await fetch(
      `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`,
      {
        signal: controller.signal,
        headers: REQUEST_HEADERS,
      }
    );
    clearTimeout(timer);
    if (!res.ok) return [];

    const html = await res.text();
    const $ = cheerio.load(html);
    const hits: ParsedSearchHit[] = [];

    $('.algo, .dd.algo').each((_, el) => {
      const link = $(el).find('h3 a, .compTitle a').first();
      const rawHref = link.attr('href') || '';
      const url = decodeRedirectUrl(rawHref);
      const headline = link.text().replace(/\s+/g, ' ').trim();
      const snippet = $(el).find('.compText, p').text().replace(/\s+/g, ' ').trim();
      if (url && headline) {
        hits.push({ url, headline, snippet });
      }
    });

    return hits;
  } catch {
    return [];
  }
}

function mapHitsToRawJobs(
  hits: ParsedSearchHit[],
  input: InternetFallbackInput,
  defaultLocation: string
): RawScrapedJob[] {
  const limit = input.limit ?? 12;
  const seenUrls = new Set<string>();
  const jobs: RawScrapedJob[] = [];

  for (let i = 0; i < hits.length; i++) {
    if (jobs.length >= limit) break;
    const hit = hits[i];
    if (!isValidJobPostingUrl(hit.url, input.source)) continue;
    if (isAggregatorListPage(hit.headline)) continue;

    const cleanUrl = hit.url.split('#')[0];
    if (seenUrls.has(cleanUrl)) continue;
    seenUrls.add(cleanUrl);

    const { title, company, location } = extractTitleCompanyLocation(
      hit.headline,
      hit.snippet,
      input.source,
      defaultLocation,
      input.company
    );

    const inferredWorkType = /remote/i.test(`${title} ${location} ${hit.snippet}`)
      ? 'Remote'
      : /hybrid/i.test(`${title} ${location} ${hit.snippet}`)
        ? 'Hybrid'
        : input.workType !== 'any'
          ? input.workType
          : 'Flexible';

    const slugId = cleanUrl
      .replace(/^https?:\/\//, '')
      .replace(/[^a-z0-9]/gi, '')
      .slice(-24);

    jobs.push({
      externalId: `web-${input.source}-${slugId || i}`,
      title,
      company,
      location,
      source: input.source,
      url: cleanUrl,
      postedAt: 'Recently posted',
      salary: null,
      description:
        hit.snippet ||
        `${title} at ${company} in ${location}. Extracted via live web search for "${input.role}".`,
      workType: inferredWorkType,
      searchedRole: input.role,
      isPivotSuggestion: input.isPivot,
      isFallback: false,
    });
  }

  return jobs;
}

async function fetchGoogleJobsFallback(
  input: InternetFallbackInput,
  defaultLocation: string
): Promise<RawScrapedJob[]> {
  try {
    const cleanCompany = input.company?.trim();
    const boardLabel =
      input.source === 'linkedin'
        ? 'LinkedIn'
        : input.source === 'jobstreet'
          ? 'JobStreet'
          : 'Indeed';
    const googleQuery = [
      input.role,
      cleanCompany || '',
      input.workType === 'remote' ? 'remote' : defaultLocation,
      cleanCompany ? '' : boardLabel,
    ]
      .filter(Boolean)
      .join(' ');

    const res = await scrapeJobs({
      sites: ['google'],
      searchTerm: googleQuery,
      location: defaultLocation,
      isRemote: input.workType === 'remote' ? true : undefined,
      resultsWanted: Math.min(input.limit ?? 10, 12),
      hoursOld: 336,
      timeoutMs: 6500,
      google: { searchTerm: googleQuery },
    });

    const mapped: RawScrapedJob[] = [];
    for (let idx = 0; idx < res.jobs.length; idx++) {
      const job = res.jobs[idx];
      const directUrl = job.jobUrlDirect || job.jobUrl;
      if (!directUrl) continue;

      const urlLower = directUrl.toLowerCase();
      const matchesBoardUrl =
        (input.source === 'linkedin' && urlLower.includes('linkedin.com')) ||
        (input.source === 'jobstreet' && urlLower.includes('jobstreet.')) ||
        (input.source === 'indeed' && urlLower.includes('indeed.'));
      const matchesCompany =
        Boolean(cleanCompany) &&
        `${job.company || ''} ${job.title}`.toLowerCase().includes(cleanCompany!.toLowerCase());

      if (!matchesBoardUrl && !matchesCompany) {
        continue;
      }

      mapped.push({
        externalId:
          job.id ||
          `gweb-${input.source}-${(job.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)}-${idx}`,
        title: job.title,
        company: job.company || cleanCompany || `${boardLabel} Employer`,
        location: job.location || defaultLocation,
        source: input.source,
        url: directUrl,
        postedAt: job.datePosted || 'Recently posted',
        salary:
          job.minAmount != null || job.maxAmount != null
            ? `${job.currency || ''} ${(job.minAmount ?? job.maxAmount ?? 0).toLocaleString()}${job.maxAmount && job.minAmount && job.maxAmount !== job.minAmount ? ` - ${job.maxAmount.toLocaleString()}` : ''}`.trim()
            : null,
        description:
          job.description ||
          `${job.title} at ${job.company || cleanCompany || 'Employer'} in ${job.location || defaultLocation}.`,
        workType: job.isRemote ? 'Remote' : job.workFromHomeType || 'Flexible',
        searchedRole: input.role,
        isPivotSuggestion: input.isPivot,
        isFallback: false,
      });
    }

    return mapped;
  } catch {
    return [];
  }
}

/**
 * Site-scoped Internet Search fallback that extracts real individual job postings
 * from LinkedIn, JobStreet, and Indeed when direct board APIs are blocked, rate-limited,
 * or return too few matches for a specific Title + Company query.
 */
export async function searchInternetForBoardJobs(
  input: InternetFallbackInput
): Promise<RawScrapedJob[]> {
  const config = COUNTRY_CONFIGS[input.country];
  const defaultLocation =
    input.workType === 'remote'
      ? 'Remote'
      : input.location.trim() || config.defaultLocation;

  const query = buildSiteSearchQuery(
    input.source,
    input.role,
    input.company,
    input.country,
    defaultLocation
  );

  const ddgHits = await fetchDuckDuckGoHits(query);
  const jobs = mapHitsToRawJobs(ddgHits, input, defaultLocation);

  if (jobs.length < 4) {
    const yahooHits = await fetchYahooHits(query);
    const yahooJobs = mapHitsToRawJobs(yahooHits, input, defaultLocation);
    const seen = new Set(jobs.map((j) => j.url));
    for (const item of yahooJobs) {
      if (!seen.has(item.url)) {
        seen.add(item.url);
        jobs.push(item);
      }
    }
  }

  if (jobs.length < 3) {
    const googleJobs = await fetchGoogleJobsFallback(input, defaultLocation);
    const seen = new Set(jobs.map((j) => j.url));
    for (const item of googleJobs) {
      if (!seen.has(item.url)) {
        seen.add(item.url);
        jobs.push(item);
      }
    }
  }

  return jobs.slice(0, input.limit ?? 15);
}
