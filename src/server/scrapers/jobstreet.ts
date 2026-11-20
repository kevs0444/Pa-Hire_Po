import * as cheerio from 'cheerio';
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

interface JobStreetApiItem {
  id?: string | number;
  title?: string;
  teaser?: string;
  bulletPoints?: string[];
  salaryLabel?: string;
  listingDate?: string;
  listingDateDisplay?: string;
  workTypes?: string[];
  workArrangements?: { displayText?: string }[];
  advertiser?: { description?: string };
  companyName?: string;
  locations?: { label?: string }[];
  jobLocation?: { label?: string };
  classifications?: { classification?: { description?: string }; subclassification?: { description?: string } }[];
}

function mergeUniqueJobStreetJobs(
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

async function fetchJobStreetHtmlFallback(
  baseDomain: string,
  searchKeywords: string,
  role: string,
  isPivot: boolean,
  defaultLocation: string,
  workType: WorkType,
  limit: number
): Promise<RawScrapedJob[]> {
  const slugRole = encodeURIComponent(
    searchKeywords.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
  );
  const pageUrl = `${baseDomain}/${slugRole}-jobs`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7500);
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      redirect: 'follow',
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
    const $ = cheerio.load(html);
    const parsed: RawScrapedJob[] = [];

    // 1. Check JSON-LD JobPosting scripts
    $('script[type="application/ld+json"]').each((_, el) => {
      if (parsed.length >= limit) return;
      const rawJson = $(el).contents().text().trim();
      if (!rawJson) return;
      try {
        const data = JSON.parse(rawJson) as Record<string, unknown> | Array<Record<string, unknown>>;
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data['@graph'])
            ? (data['@graph'] as Array<Record<string, unknown>>)
            : [data];
        for (const item of items) {
          if (parsed.length >= limit) break;
          if (item['@type'] !== 'JobPosting') continue;
          const title = typeof item.title === 'string' ? item.title.trim() : '';
          const org = item.hiringOrganization as { name?: string } | undefined;
          const company = org?.name?.trim() || 'Confidential Employer';
          const url = typeof item.url === 'string' ? item.url : '';
          const desc =
            typeof item.description === 'string'
              ? cheerio.load(item.description).text().replace(/\s+/g, ' ').trim()
              : '';
          if (title && url) {
            const jobId = url.match(/\/job\/(\d+)/)?.[1] || `html-${parsed.length}`;
            parsed.push({
              externalId: jobId,
              title,
              company,
              location: defaultLocation,
              source: 'jobstreet',
              url: url.startsWith('http') ? url : `${baseDomain}${url}`,
              postedAt:
                typeof item.datePosted === 'string'
                  ? item.datePosted.slice(0, 10)
                  : 'Recently posted',
              salary: null,
              description: desc.slice(0, 1400) || `${title} at ${company} (${defaultLocation})`,
              workType: workType !== 'any' ? workType : 'Full time',
              searchedRole: role,
              isPivotSuggestion: isPivot,
            });
          }
        }
      } catch {
        // Ignore non-parseable JSON-LD blocks
      }
    });

    // 2. Parse visible JobStreet card elements if JSON-LD wasn't present
    if (parsed.length === 0) {
      $('article, [data-automation="normalJob"]').each((idx, el) => {
        if (parsed.length >= limit) return;
        const titleEl = $(el).find('[data-automation="jobTitle"], h3 a, a[href*="/job/"]').first();
        const title = titleEl.text().trim();
        const href = titleEl.attr('href') || $(el).find('a[href*="/job/"]').first().attr('href') || '';
        const company =
          $(el).find('[data-automation="jobCompany"]').text().trim() ||
          'Confidential Employer';
        const loc =
          $(el).find('[data-automation="jobLocation"]').text().trim() ||
          defaultLocation;
        const salary =
          $(el).find('[data-automation="jobSalary"]').text().trim() || null;
        const teaser = $(el).find('[data-automation="jobShortDescription"]').text().trim();

        if (title && href) {
          const fullUrl = href.startsWith('http') ? href : `${baseDomain}${href}`;
          const jobId = fullUrl.match(/\/job\/(\d+)/)?.[1] || `card-${idx}`;
          parsed.push({
            externalId: jobId,
            title,
            company,
            location: loc,
            source: 'jobstreet',
            url: fullUrl.split('?')[0],
            postedAt:
              $(el).find('[data-automation="jobListingDate"]').text().trim() ||
              'Recently posted',
            salary,
            description: teaser || `${title} at ${company} (${loc})`,
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
    }

    return parsed;
  } catch {
    return [];
  }
}

export async function scrapeJobStreetJobs(
  input: ScrapeBoardInput
): Promise<BoardScrapeResult> {
  const startedAt = Date.now();
  const limit = input.limit ?? 24;
  const config = COUNTRY_CONFIGS[input.country];

  const baseDomain = config.jobstreetDomain || 'https://ph.jobstreet.com';
  const siteKey = config.jobstreetSiteKey || 'PH-Main';
  const cleanLocation =
    input.workType === 'remote'
      ? ''
      : input.location.split(',')[0].trim();
  const cleanCompany = input.company?.trim() || '';
  const searchKeywords = cleanCompany
    ? `${input.role} ${cleanCompany}`
    : input.role;

  const params = new URLSearchParams({
    siteKey,
    keywords: searchKeywords,
    page: '1',
    pageSize: String(limit),
    locale: 'en-PH',
  });

  if (cleanLocation && !/worldwide|remote|united states/i.test(cleanLocation)) {
    params.set('where', cleanLocation);
  }
  if (input.workType === 'remote') {
    params.set('workarrangement', '2');
  } else if (input.workType === 'hybrid') {
    params.set('workarrangement', '3');
  } else if (input.workType === 'onsite') {
    params.set('workarrangement', '1');
  }

  const endpointCandidates = [
    `${baseDomain}/api/jobsearch/v5/search?${params.toString()}`,
    `${baseDomain.replace('https://', 'https://www.')}/api/jobsearch/v5/search?${params.toString()}`,
  ];

  let lastError = 'JobStreet endpoint unavailable';
  let collected: RawScrapedJob[] = [];
  let methodNote = `JobStreet v5 (${siteKey})`;

  for (const url of endpointCandidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);

      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: `${baseDomain}/`,
        },
      });
      clearTimeout(timer);

      if (!res.ok) {
        lastError = `HTTP ${res.status} from JobStreet v5 API`;
        continue;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('json')) {
        lastError = 'JobStreet returned non-JSON challenge response';
        continue;
      }

      const json = (await res.json()) as { data?: JobStreetApiItem[] };
      const items = Array.isArray(json?.data) ? json.data : [];

      if (items.length > 0) {
        const jobs: RawScrapedJob[] = items
          .filter((item) => item.id && item.title)
          .slice(0, limit)
          .map((item) => {
            const jobId = String(item.id);
            const company =
              item.advertiser?.description || item.companyName || 'Confidential Employer';
            const loc =
              item.locations?.[0]?.label ||
              item.jobLocation?.label ||
              config.defaultLocation;
            const bullets = Array.isArray(item.bulletPoints)
              ? item.bulletPoints.join(' • ')
              : '';
            const classificationText = (item.classifications || [])
              .map((c) =>
                [c.classification?.description, c.subclassification?.description]
                  .filter(Boolean)
                  .join(' / ')
              )
              .filter(Boolean)
              .join(' • ');
            const description = [item.teaser, bullets, classificationText]
              .filter(Boolean)
              .join('\n');
            const workArrangement =
              item.workArrangements?.[0]?.displayText ||
              item.workTypes?.[0] ||
              'Full time';

            return {
              externalId: jobId,
              title: item.title || input.role,
              company,
              location: loc,
              source: 'jobstreet',
              url: `${baseDomain}/job/${jobId}`,
              postedAt:
                item.listingDateDisplay ||
                (item.listingDate ? item.listingDate.slice(0, 10) : 'Recently posted'),
              salary: item.salaryLabel || null,
              description:
                description || `${item.title} at ${company} (${loc})`,
              workType: workArrangement,
              searchedRole: input.role,
              isPivotSuggestion: input.isPivot,
            };
          });

        collected = mergeUniqueJobStreetJobs(collected, jobs, limit);
        if (collected.length > 0) break;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'JobStreet request failed';
    }
  }

  // Attempt 2: Direct JobStreet HTML / JSON-LD extraction if v5 returned < 3 jobs
  if (collected.length < 3) {
    const htmlJobs = await fetchJobStreetHtmlFallback(
      baseDomain,
      searchKeywords,
      input.role,
      input.isPivot,
      cleanLocation || config.defaultLocation,
      input.workType,
      limit
    );
    if (htmlJobs.length > 0) {
      collected = mergeUniqueJobStreetJobs(collected, htmlJobs, limit);
      methodNote =
        collected.length === htmlJobs.length
          ? `JobStreet HTML (${siteKey})`
          : `${methodNote} + HTML`;
    }
  }

  // Attempt 3: Site-scoped Internet Web Search Fallback when blocked or < 3 company/role matches
  const needsWebFallback =
    collected.length < 3 ||
    (Boolean(cleanCompany) && countCompanyHits(collected, cleanCompany) < 2);

  if (needsWebFallback) {
    const webJobs = await searchInternetForBoardJobs({
      source: 'jobstreet',
      role: input.role,
      company: cleanCompany || undefined,
      isPivot: input.isPivot,
      country: input.country,
      location: cleanLocation || config.defaultLocation,
      workType: input.workType,
      limit: Math.max(8, limit - collected.length),
    }).catch(() => []);

    if (webJobs.length > 0) {
      collected = mergeUniqueJobStreetJobs(collected, webJobs, limit);
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
        source: 'jobstreet',
        status: 'live',
        count: collected.length,
        message: `Fetched ${collected.length} live postings via ${methodNote}`,
        durationMs: Date.now() - startedAt,
      },
    };
  }

  const slugRole = encodeURIComponent(
    searchKeywords.toLowerCase().replace(/\s+/g, '-')
  );
  const directSearchUrl = `${baseDomain}/${slugRole}-jobs`;

  const fallbackJob: RawScrapedJob = {
    externalId: `js-fallback-${searchKeywords.toLowerCase().replace(/\s+/g, '-')}`,
    title: `${input.role}${cleanCompany ? ` at ${cleanCompany}` : ''} — Live JobStreet Search (${config.label})`,
    company: cleanCompany || 'JobStreet / SEEK',
    location: config.defaultLocation,
    source: 'jobstreet',
    url: directSearchUrl,
    postedAt: 'Live search link',
    salary: null,
    description: `JobStreet (${siteKey}) returned a bot challenge or empty response (${lastError}). Click to open JobStreet directly pre-filtered for "${searchKeywords}".`,
    workType: input.workType === 'any' ? 'All setups' : input.workType,
    searchedRole: input.role,
    isPivotSuggestion: input.isPivot,
    isFallback: true,
  };

  return {
    jobs: [fallbackJob],
    meta: {
      source: 'jobstreet',
      status: 'fallback',
      count: 1,
      message: `${lastError}; generated direct JobStreet search shortcut.`,
      durationMs: Date.now() - startedAt,
    },
  };
}
