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
}

export async function scrapeJobStreetJobs(
  input: ScrapeBoardInput
): Promise<BoardScrapeResult> {
  const startedAt = Date.now();
  const limit = input.limit ?? 15;
  const config = COUNTRY_CONFIGS[input.country];

  const baseDomain = config.jobstreetDomain || 'https://ph.jobstreet.com';
  const siteKey = config.jobstreetSiteKey || 'PH-Main';
  const cleanLocation =
    input.workType === 'remote'
      ? ''
      : input.location.split(',')[0].trim();

  const params = new URLSearchParams({
    siteKey,
    keywords: input.role,
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
            const description = [item.teaser, bullets].filter(Boolean).join('\n');
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

        if (jobs.length > 0) {
          return {
            jobs,
            meta: {
              source: 'jobstreet',
              status: 'live',
              count: jobs.length,
              message: `Fetched ${jobs.length} live postings via JobStreet v5 (${siteKey})`,
              durationMs: Date.now() - startedAt,
            },
          };
        }
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'JobStreet request failed';
    }
  }

  const slugRole = encodeURIComponent(input.role.toLowerCase().replace(/\s+/g, '-'));
  const directSearchUrl = `${baseDomain}/${slugRole}-jobs`;

  const fallbackJob: RawScrapedJob = {
    externalId: `js-fallback-${input.role.toLowerCase().replace(/\s+/g, '-')}`,
    title: `${input.role} — Live JobStreet Search (${config.label})`,
    company: 'JobStreet / SEEK',
    location: config.defaultLocation,
    source: 'jobstreet',
    url: directSearchUrl,
    postedAt: 'Live search link',
    salary: null,
    description: `JobStreet (${siteKey}) returned a bot challenge or empty response (${lastError}). Click to open JobStreet directly pre-filtered for "${input.role}".`,
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
